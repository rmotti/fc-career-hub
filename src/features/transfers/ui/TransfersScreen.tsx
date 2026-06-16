import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeEuro,
  Clock3,
  Filter,
  Loader2,
  Pencil,
  Plus,
  Repeat2,
  RotateCcw,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { type ApiTransfer, extractErrorMessage } from "@/shared/api/client";
import { useTransfers, useCreateTransfer, useUpdateTransfer, useDeleteTransfer, useReverseTransfer } from "@/features/transfers/model/useTransfers";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { useFinancialSnapshot } from "@/features/dashboard/model/useFinancialSnapshot";
import { usePlayer, useUpdatePlayer, useUpdatePlayerStats } from "@/features/squad/model/usePlayers";
import TransferModal from "@/features/transfers/ui/TransferModal";
import PlayerModal from "@/features/squad/ui/PlayerModal";
import { formatCurrency, formatCurrencyInMillions, formatSignedCurrencyInMillions } from "@/shared/lib/currency";
import { m, type Money } from "@/shared/lib/money";
import { shouldRemovePlayerFromSquad } from "@/shared/lib/playerTransferStatus";

interface Props {
  saveId: string;
  currentClub: string;
  currentSeason: string;
  selectedSeason?: string;
}

type TransferTypeFilter = "all" | "compra" | "venda" | "emprestimo_entrada" | "emprestimo_saida";
type HistorySort = "recent" | "value_desc" | "value_asc";
type TransferTone = "primary" | "accent" | "warning" | "destructive" | "muted";

const TRANSFER_TYPE_LABELS: Record<TransferTypeFilter, string> = {
  all: "All types",
  compra: "Purchases",
  venda: "Sales",
  emprestimo_entrada: "Incoming loans",
  emprestimo_saida: "Outgoing loans",
};

const toneClass: Record<TransferTone, string> = {
  primary: "text-primary",
  accent: "text-accent",
  warning: "text-[hsl(var(--warning))]",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

const badgeClass: Record<TransferTone, string> = {
  primary: "border-primary/20 bg-primary/10 text-primary",
  accent: "border-accent/20 bg-accent/10 text-accent",
  warning: "border-[hsl(var(--warning))]/25 bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  destructive: "border-destructive/20 bg-destructive/10 text-destructive",
  muted: "border-border bg-muted/50 text-muted-foreground",
};

const isIncomingTransfer = (transfer: ApiTransfer) =>
  transfer.type === "compra" || transfer.type === "emprestimo_entrada";

const isOutgoingTransfer = (transfer: ApiTransfer) =>
  transfer.type === "venda" || transfer.type === "emprestimo_saida";

const isLoanTransfer = (transfer: ApiTransfer) =>
  transfer.type === "emprestimo_entrada" || transfer.type === "emprestimo_saida";

const normalizeClubName = (club: string) => club.trim().toLocaleLowerCase("en");

const getTransferTone = (transfer: ApiTransfer): TransferTone => {
  if (transfer.type === "compra") return "primary";
  if (transfer.type === "venda") return "accent";
  return "warning";
};

const getTransferTypeLabel = (transfer: ApiTransfer) => {
  if (transfer.type === "compra") return "Purchase";
  if (transfer.type === "venda") return "Sale";
  return transfer.type === "emprestimo_entrada" ? "Loan in" : "Loan out";
};

const getTransferFeeLabel = (transfer: ApiTransfer) => {
  if (transfer.feeFormatted) return transfer.feeFormatted;
  if (transfer.fee) return formatCurrencyInMillions(transfer.fee);
  if (isLoanTransfer(transfer)) return "Loan";
  return "Free";
};

const TransfersScreen = ({ saveId, currentClub, currentSeason, selectedSeason }: Props) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"current" | "history">("current");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<ApiTransfer | null>(null);
  const [variation, setVariation] = useState<{ amount: Money<"M">; type: "compra" | "venda" | "emprestimo_entrada" | "emprestimo_saida" } | null>(null);
  const [purchasePlayerId, setPurchasePlayerId] = useState<string | null>(null);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<TransferTypeFilter>("all");
  const [historySeasonFilter, setHistorySeasonFilter] = useState("all");
  const [historySort, setHistorySort] = useState<HistorySort>("recent");
  const [transferToReverse, setTransferToReverse] = useState<ApiTransfer | null>(null);

  const { data: save } = useFinancialSnapshot(saveId);
  const { data: allTransfers = [], isLoading } = useTransfers(saveId);
  const { data: currentTransfers = [] } = useTransfers(saveId, "current");
  const createTransfer = useCreateTransfer();
  const updateTransfer = useUpdateTransfer();
  const deleteTransfer = useDeleteTransfer();
  const reverseTransfer = useReverseTransfer();
  const updatePlayer = useUpdatePlayer();
  const updateStats = useUpdatePlayerStats();

  const { data: purchasePlayer } = usePlayer(saveId, purchasePlayerId);

  const isPastSeason = !!(selectedSeason && currentSeason && selectedSeason !== currentSeason);
  const displayBalance = typeof save?.balance === "number" ? formatCurrency(save.balance) : save?.balanceFormatted ?? "-";
  const currentClubKey = normalizeClubName(currentClub);

  const currentClubTransfers = useMemo(() => {
    return allTransfers.filter((transfer) =>
      normalizeClubName(transfer.from) === currentClubKey || normalizeClubName(transfer.to) === currentClubKey
    );
  }, [allTransfers, currentClubKey]);

  const historySeasons = useMemo(() => {
    return [...new Set(currentClubTransfers.map((transfer) => transfer.season))]
      .sort((a, b) => b.localeCompare(a));
  }, [currentClubTransfers]);

  const filteredHistoryTransfers = useMemo(() => {
    const filtered = currentClubTransfers.filter((transfer) => {
      const matchesType = historyTypeFilter === "all" || transfer.type === historyTypeFilter;
      const matchesSeason = historySeasonFilter === "all" || transfer.season === historySeasonFilter;
      return matchesType && matchesSeason;
    });

    if (historySort === "value_desc") {
      return [...filtered].sort((a, b) => (b.fee ?? 0) - (a.fee ?? 0));
    }

    if (historySort === "value_asc") {
      return [...filtered].sort((a, b) => (a.fee ?? 0) - (b.fee ?? 0));
    }

    return filtered;
  }, [currentClubTransfers, historySeasonFilter, historySort, historyTypeFilter]);

  const currentIncoming = currentTransfers.filter(isIncomingTransfer);
  const currentOutgoing = currentTransfers.filter(isOutgoingTransfer);
  const currentLoans = currentTransfers.filter(isLoanTransfer);
  const transferSpend = m(currentTransfers
    .filter((transfer) => transfer.type === "compra")
    .reduce((sum, transfer) => sum + (transfer.fee ?? 0), 0));
  const transferRevenue = m(currentTransfers
    .filter((transfer) => transfer.type === "venda")
    .reduce((sum, transfer) => sum + (transfer.fee ?? 0), 0));
  const transferNet = m(transferRevenue - transferSpend);
  const biggestPurchase = [...currentTransfers]
    .filter((transfer) => transfer.type === "compra")
    .sort((a, b) => (b.fee ?? 0) - (a.fee ?? 0))[0] ?? null;
  const biggestSale = [...currentTransfers]
    .filter((transfer) => transfer.type === "venda")
    .sort((a, b) => (b.fee ?? 0) - (a.fee ?? 0))[0] ?? null;

  const handleSaveTransfer = async (data: any, transferId?: string) => {
    if (transferId) {
      const updatedTransfer = await updateTransfer.mutateAsync({ saveId, transferId, data });
      if (updatedTransfer.playerId && shouldRemovePlayerFromSquad(updatedTransfer.type)) {
        await updatePlayer.mutateAsync({ saveId, playerId: updatedTransfer.playerId, data: { isActive: false } });
      }
      toast.success(t("transfers.toasts.updated"), { duration: 3000 });
    } else {
      const response = await createTransfer.mutateAsync({ saveId, data });
      setVariation({ amount: m(data.fee || 0), type: data.type });
      setTimeout(() => setVariation(null), 5000);

      if ((data.type === "compra" || data.type === "emprestimo_entrada") && response.transfer?.playerId) {
        setPurchasePlayerId(response.transfer.playerId);
        setPlayerModalOpen(true);
        toast.success(t("transfers.toasts.playerAdded"), { duration: 4000 });
      } else if (response.transfer?.playerId && shouldRemovePlayerFromSquad(data.type)) {
        await updatePlayer.mutateAsync({ saveId, playerId: response.transfer.playerId, data: { isActive: false } });
        toast.success(
          data.type === "venda"
            ? t("transfers.toasts.playerSold")
            : t("transfers.toasts.playerLoaned"),
          { duration: 3000 }
        );
      } else {
        toast.success(t("transfers.toasts.registered"), { duration: 3000 });
      }
    }
    setEditingTransfer(null);
  };

  const handleSavePurchasePlayer = async (data: any, playerId?: string) => {
    if (!playerId) return;
    const { goals, assists, yellowCards, redCards, matches, cleanSheets, ...playerData } = data;
    await updatePlayer.mutateAsync({ saveId, playerId, data: playerData });
    const hasStats = goals > 0 || assists > 0 || yellowCards > 0 || redCards > 0 || matches > 0 || cleanSheets > 0;
    if (hasStats) {
      await updateStats.mutateAsync({ saveId, playerId, data: { goals, assists, yellowCards, redCards, matches, cleanSheets } });
    }
    toast.success(t("transfers.toasts.playerUpdated"), { duration: 3000 });
    setPurchasePlayerId(null);
  };

  const handleDelete = (transfer: ApiTransfer) => {
    deleteTransfer.mutate({ saveId, transferId: transfer.id }, {
      onSuccess: () => toast.success(t("transfers.toasts.deleted"), { duration: 3000 }),
      onError: (err) => toast.error(extractErrorMessage(err), { duration: 5000 }),
    });
  };

  const handleReverse = (transfer: ApiTransfer) => {
    reverseTransfer.mutate({ saveId, transferId: transfer.id }, {
      onSuccess: () => {
        toast.success(t("transfers.toasts.reversed", { name: transfer.playerName }), { duration: 4000 });
        setTransferToReverse(null);
      },
      onError: (err) => toast.error(extractErrorMessage(err), { duration: 5000 }),
    });
  };

  const openEditModal = (transfer: ApiTransfer) => {
    setEditingTransfer(transfer);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingTransfer(null);
    setModalOpen(true);
  };

  const renderTransferRow = (transfer: ApiTransfer) => {
    const incoming = isIncomingTransfer(transfer);
    const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
    const tone = getTransferTone(transfer);
    const routeLabel = incoming ? t("transfers.direction.from", { club: transfer.from }) : t("transfers.direction.to", { club: transfer.to });

    return (
      <div
        key={transfer.id}
        className="group grid min-h-[72px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border bg-background/30 px-3 py-3 transition-colors hover:border-primary/25 hover:bg-muted/30"
      >
        <div className={`flex h-9 w-9 items-center justify-center rounded-md border ${badgeClass[tone]}`}>
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{transfer.playerName}</p>
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none ${badgeClass[tone]}`}>
              {getTransferTypeLabel(transfer)}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{routeLabel} · {transfer.season}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`shrink-0 text-right font-display text-sm font-bold ${toneClass[tone]}`}>
            {getTransferFeeLabel(transfer)}
          </span>
          {!isPastSeason && (
            <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <button
                data-tour="transfers-edit-transfer"
                type="button"
                onClick={() => openEditModal(transfer)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label={`Edit ${transfer.playerName}`}
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => setTransferToReverse(transfer)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                aria-label={t("transfers.reverse.aria", { name: transfer.playerName })}
                title={t("transfers.reverse.tooltip")}
              >
                <RotateCcw size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(transfer)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Delete ${transfer.playerName}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHistoryRow = (transfer: ApiTransfer) => {
    const tone = getTransferTone(transfer);
    const incoming = isIncomingTransfer(transfer);
    const Icon = incoming ? ArrowDownLeft : ArrowUpRight;

    return (
      <tr key={transfer.id} className="group border-t border-border transition-colors hover:bg-muted/25">
        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{transfer.season}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] font-semibold uppercase leading-none ${badgeClass[tone]}`}>
            <Icon size={12} />
            {getTransferTypeLabel(transfer)}
          </span>
        </td>
        <td className="min-w-[180px] px-4 py-3">
          <p className="truncate text-sm font-semibold text-foreground">{transfer.playerName}</p>
        </td>
        <td className="min-w-[140px] px-4 py-3 text-sm text-muted-foreground">{transfer.from}</td>
        <td className="min-w-[140px] px-4 py-3 text-sm text-muted-foreground">{transfer.to}</td>
        <td className={`whitespace-nowrap px-4 py-3 text-right font-display text-sm font-bold ${toneClass[tone]}`}>
          {getTransferFeeLabel(transfer)}
        </td>
        {!isPastSeason && (
          <td className="whitespace-nowrap px-4 py-3 text-right">
            <div className="inline-flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <button
                data-tour="transfers-edit-transfer"
                type="button"
                onClick={() => openEditModal(transfer)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label={`Edit ${transfer.playerName}`}
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => setTransferToReverse(transfer)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                aria-label={t("transfers.reverse.aria", { name: transfer.playerName })}
                title={t("transfers.reverse.tooltip")}
              >
                <RotateCcw size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(transfer)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Delete ${transfer.playerName}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </td>
        )}
      </tr>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" /> {t("transfers.loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <div data-tour="transfers-header" className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{currentClub} · {currentSeason}</p>
          <h2 className="font-display text-3xl font-bold leading-none tracking-tight text-foreground">{t("transfers.title")}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["current", "history"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors ${
                tab === item
                  ? "border-primary/25 bg-primary/10 text-primary"
                  : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {item === "current" ? <Repeat2 size={15} /> : <Clock3 size={15} />}
              {item === "current" ? t("transfers.tabs.current") : t("transfers.tabs.history")}
            </button>
          ))}
          {!isPastSeason && (
            <button
              data-tour="transfers-create-transfer"
              type="button"
              onClick={openCreateModal}
              className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus size={16} /> {t("transfers.newTransfer")}
            </button>
          )}
        </div>
      </div>

      {isPastSeason && (
        <div className="rounded-md border border-border bg-muted px-4 py-2 text-sm text-muted-foreground">
          {t("transfers.pastSeasonBanner", { season: selectedSeason })}
        </div>
      )}

      <section data-tour="transfers-metrics" className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MarketStat
          label={t("transfers.metrics.available")}
          value={displayBalance}
          icon={BadgeEuro}
          tone={(save?.balance ?? 0) < 0 ? "destructive" : "primary"}
          detail={
            variation
              ? `${variation.type === "venda" || variation.type === "emprestimo_saida" ? "+" : "-"} ${formatCurrencyInMillions(variation.amount)}`
              : t("transfers.metrics.budgetDetail")
          }
        />
        <MarketStat
          label={t("transfers.metrics.windowResult")}
          value={formatSignedCurrencyInMillions(transferNet)}
          icon={transferNet >= 0 ? TrendingUp : TrendingDown}
          tone={transferNet >= 0 ? "accent" : "destructive"}
          detail={t("transfers.metrics.windowDetail", { revenue: formatCurrencyInMillions(transferRevenue), spent: formatCurrencyInMillions(transferSpend) })}
        />
        <MarketStat
          label={t("transfers.metrics.incoming")}
          value={currentIncoming.length}
          icon={ArrowDownLeft}
          tone="primary"
          detail={t("transfers.metrics.incomingDetail", { purchases: currentIncoming.filter((transfer) => transfer.type === "compra").length, loans: currentIncoming.filter((transfer) => transfer.type === "emprestimo_entrada").length })}
        />
        <MarketStat
          label={t("transfers.metrics.outgoing")}
          value={currentOutgoing.length}
          icon={ArrowUpRight}
          tone="accent"
          detail={t("transfers.metrics.outgoingDetail", { sales: currentOutgoing.filter((transfer) => transfer.type === "venda").length, loans: currentOutgoing.filter((transfer) => transfer.type === "emprestimo_saida").length })}
        />
      </section>

      {tab === "current" ? (
        <div className="space-y-5">
          <section data-tour="transfers-current" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <TransferColumn
              title={t("transfers.current.incoming")}
              icon={ArrowDownLeft}
              tone="primary"
              count={currentIncoming.length}
              empty={t("transfers.current.noIncoming")}
            >
              {currentIncoming.map((transfer) => renderTransferRow(transfer))}
            </TransferColumn>

            <TransferColumn
              title={t("transfers.current.outgoing")}
              icon={ArrowUpRight}
              tone="accent"
              count={currentOutgoing.length}
              empty={t("transfers.current.noOutgoing")}
            >
              {currentOutgoing.map((transfer) => renderTransferRow(transfer))}
            </TransferColumn>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <MarketHighlight label={t("transfers.highlights.biggestPurchase")} transfer={biggestPurchase} empty={t("transfers.highlights.noPurchases")} tone="primary" />
            <MarketHighlight label={t("transfers.highlights.biggestSale")} transfer={biggestSale} empty={t("transfers.highlights.noSales")} tone="accent" />
            <div className="card-gamer p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Repeat2 size={15} className={toneClass.warning} />
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{t("transfers.highlights.loans")}</p>
                </div>
                <p className="font-display text-2xl font-bold leading-none text-[hsl(var(--warning))]">{currentLoans.length}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentLoans.length > 0
                  ? t("transfers.highlights.loansDesc")
                  : t("transfers.highlights.noLoans")}
              </p>
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-4">
          <section data-tour="transfers-history" className="card-gamer p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Filter size={18} />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold">{t("transfers.history.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("transfers.history.found", { count: filteredHistoryTransfers.length })}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <FilterSelect
                label={t("transfers.history.type")}
                value={historyTypeFilter}
                onChange={(value) => setHistoryTypeFilter(value as TransferTypeFilter)}
                options={Object.entries(TRANSFER_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <FilterSelect
                label={t("transfers.history.season")}
                value={historySeasonFilter}
                onChange={setHistorySeasonFilter}
                options={[
                  { value: "all", label: t("transfers.history.allSeasons") },
                  ...historySeasons.map((season) => ({ value: season, label: season })),
                ]}
              />
              <FilterSelect
                label={t("transfers.history.sort")}
                value={historySort}
                onChange={(value) => setHistorySort(value as HistorySort)}
                options={[
                  { value: "recent", label: t("transfers.history.default") },
                  { value: "value_desc", label: t("transfers.history.highestValue") },
                  { value: "value_asc", label: t("transfers.history.lowestValue") },
                ]}
              />
            </div>
          </section>

          <section className="card-gamer overflow-hidden">
            {filteredHistoryTransfers.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">{t("transfers.history.noTransfers")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[840px] text-left">
                  <thead className="bg-muted/35">
                    <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">{t("transfers.columns.season")}</th>
                      <th className="px-4 py-3 font-semibold">{t("transfers.columns.type")}</th>
                      <th className="px-4 py-3 font-semibold">{t("transfers.columns.player")}</th>
                      <th className="px-4 py-3 font-semibold">{t("transfers.columns.from")}</th>
                      <th className="px-4 py-3 font-semibold">{t("transfers.columns.to")}</th>
                      <th className="px-4 py-3 text-right font-semibold">{t("transfers.columns.value")}</th>
                      {!isPastSeason && <th className="px-4 py-3 text-right font-semibold">{t("transfers.columns.actions")}</th>}
                    </tr>
                  </thead>
                  <tbody>{filteredHistoryTransfers.map((transfer) => renderHistoryRow(transfer))}</tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      <TransferModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transfer={editingTransfer}
        currentClub={currentClub}
        currentSeason={currentSeason}
        onSave={handleSaveTransfer}
        saveId={saveId}
      />

      <PlayerModal
        open={playerModalOpen}
        onOpenChange={(open) => {
          setPlayerModalOpen(open);
          if (!open) setPurchasePlayerId(null);
        }}
        player={purchasePlayer ?? null}
        onSave={handleSavePurchasePlayer}
        saveId={saveId}
      />

      <AlertDialog
        open={transferToReverse !== null}
        onOpenChange={(open) => { if (!open && !reverseTransfer.isPending) setTransferToReverse(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw size={18} className="text-accent" />
              {t("transfers.reverse.dialogTitle", { name: transferToReverse?.playerName })}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>{t("transfers.reverse.dialogBody")}</p>
                <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
                  <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warning" />
                  <span>{t("transfers.reverse.dialogWarning")}</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={reverseTransfer.isPending}
              onClick={() => setTransferToReverse(null)}
              className="rounded-lg border border-border bg-background/50 px-4 py-2.5 font-display text-sm font-bold text-foreground transition-colors hover:border-primary/40 disabled:opacity-50"
            >
              {t("transfers.reverse.cancel")}
            </button>
            <button
              type="button"
              disabled={reverseTransfer.isPending || !transferToReverse}
              onClick={() => transferToReverse && handleReverse(transferToReverse)}
              className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-display text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {reverseTransfer.isPending ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
              {t("transfers.reverse.confirm")}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface MarketStatProps {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ElementType;
  tone: TransferTone;
}

function MarketStat({ label, value, detail, icon: Icon, tone }: MarketStatProps) {
  return (
    <div className="card-gamer p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={15} className={toneClass[tone]} />
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      </div>
      <p className={`font-display text-3xl font-bold leading-none ${toneClass[tone]}`}>{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

interface TransferColumnProps {
  title: string;
  icon: React.ElementType;
  tone: TransferTone;
  count: number;
  empty: string;
  children: React.ReactNode;
}

function TransferColumn({ title, icon: Icon, tone, count, empty, children }: TransferColumnProps) {
  return (
    <section className="card-gamer p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={16} className={toneClass[tone]} />
          <h3 className="font-display text-lg font-semibold">{title}</h3>
        </div>
        <span className={`rounded border px-2 py-1 font-display text-xs font-bold ${badgeClass[tone]}`}>{count}</span>
      </div>
      {count === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  );
}

interface MarketHighlightProps {
  label: string;
  transfer: ApiTransfer | null;
  empty: string;
  tone: TransferTone;
}

function MarketHighlight({ label, transfer, empty, tone }: MarketHighlightProps) {
  return (
    <div className="card-gamer p-5">
      <div className="mb-4 flex items-center gap-2">
        <BadgeEuro size={15} className={toneClass[tone]} />
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      </div>
      {transfer ? (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="truncate text-base font-semibold text-foreground">{transfer.playerName}</p>
            <span className={`shrink-0 font-display text-lg font-bold ${toneClass[tone]}`}>{getTransferFeeLabel(transfer)}</span>
          </div>
          <p className="truncate text-sm text-muted-foreground">{transfer.from} {"->"} {transfer.to}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

export default TransfersScreen;
