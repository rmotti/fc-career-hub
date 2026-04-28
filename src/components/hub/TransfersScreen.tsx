import { useMemo, useState } from "react";
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
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { type ApiTransfer, extractErrorMessage } from "@/services/api";
import { useTransfers, useCreateTransfer, useUpdateTransfer, useDeleteTransfer } from "@/hooks/useTransfers";
import { useFinancialSnapshot } from "@/hooks/useFinancialSnapshot";
import { usePlayer, useUpdatePlayer, useUpdatePlayerStats } from "@/hooks/usePlayers";
import TransferModal from "@/components/modals/TransferModal";
import PlayerModal from "@/components/modals/PlayerModal";
import { formatCurrency, formatCurrencyInMillions, formatSignedCurrencyInMillions } from "@/utils/currency";
import { shouldRemovePlayerFromSquad } from "@/utils/playerTransferStatus";

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
  all: "Todos os tipos",
  compra: "Compras",
  venda: "Vendas",
  emprestimo_entrada: "Empréstimos de entrada",
  emprestimo_saida: "Empréstimos de saída",
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

const normalizeClubName = (club: string) => club.trim().toLocaleLowerCase("pt-BR");

const getTransferTone = (transfer: ApiTransfer): TransferTone => {
  if (transfer.type === "compra") return "primary";
  if (transfer.type === "venda") return "accent";
  return "warning";
};

const getTransferTypeLabel = (transfer: ApiTransfer) => {
  if (transfer.type === "compra") return "Compra";
  if (transfer.type === "venda") return "Venda";
  return transfer.type === "emprestimo_entrada" ? "Empr. entrada" : "Empr. saída";
};

const getTransferFeeLabel = (transfer: ApiTransfer) => {
  if (transfer.feeFormatted) return transfer.feeFormatted;
  if (transfer.fee) return formatCurrencyInMillions(transfer.fee);
  if (isLoanTransfer(transfer)) return "Empréstimo";
  return "Livre";
};

const TransfersScreen = ({ saveId, currentClub, currentSeason, selectedSeason }: Props) => {
  const [tab, setTab] = useState<"current" | "history">("current");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<ApiTransfer | null>(null);
  const [variation, setVariation] = useState<{ amount: number; type: "compra" | "venda" | "emprestimo_entrada" | "emprestimo_saida" } | null>(null);
  const [purchasePlayerId, setPurchasePlayerId] = useState<string | null>(null);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<TransferTypeFilter>("all");
  const [historySeasonFilter, setHistorySeasonFilter] = useState("all");
  const [historySort, setHistorySort] = useState<HistorySort>("recent");

  const { data: save } = useFinancialSnapshot(saveId);
  const { data: allTransfers = [], isLoading } = useTransfers(saveId);
  const { data: currentTransfers = [] } = useTransfers(saveId, "current");
  const createTransfer = useCreateTransfer();
  const updateTransfer = useUpdateTransfer();
  const deleteTransfer = useDeleteTransfer();
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
  const transferSpend = currentTransfers
    .filter((transfer) => transfer.type === "compra")
    .reduce((sum, transfer) => sum + (transfer.fee ?? 0), 0);
  const transferRevenue = currentTransfers
    .filter((transfer) => transfer.type === "venda")
    .reduce((sum, transfer) => sum + (transfer.fee ?? 0), 0);
  const transferNet = transferRevenue - transferSpend;
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
      toast.success("Transferência atualizada com sucesso!", { duration: 3000 });
    } else {
      const response = await createTransfer.mutateAsync({ saveId, data });
      setVariation({ amount: data.fee || 0, type: data.type });
      setTimeout(() => setVariation(null), 5000);

      if ((data.type === "compra" || data.type === "emprestimo_entrada") && response.transfer?.playerId) {
        setPurchasePlayerId(response.transfer.playerId);
        setPlayerModalOpen(true);
        toast.success("Jogador adicionado! Complete as informações abaixo.", { duration: 4000 });
      } else if (response.transfer?.playerId && shouldRemovePlayerFromSquad(data.type)) {
        await updatePlayer.mutateAsync({ saveId, playerId: response.transfer.playerId, data: { isActive: false } });
        toast.success(
          data.type === "venda"
            ? "Jogador vendido e removido do elenco."
            : "Jogador enviado por empréstimo e removido do elenco.",
          { duration: 3000 }
        );
      } else {
        toast.success("Transferência registrada com sucesso!", { duration: 3000 });
      }
    }
    setEditingTransfer(null);
  };

  const handleSavePurchasePlayer = async (data: any, playerId?: string) => {
    if (!playerId) return;
    const { goals, assists, yellowCards, redCards, matches, ...playerData } = data;
    await updatePlayer.mutateAsync({ saveId, playerId, data: playerData });
    const hasStats = goals > 0 || assists > 0 || yellowCards > 0 || redCards > 0 || matches > 0;
    if (hasStats) {
      await updateStats.mutateAsync({ saveId, playerId, data: { goals, assists, yellowCards, redCards, matches } });
    }
    toast.success("Jogador atualizado!", { duration: 3000 });
    setPurchasePlayerId(null);
  };

  const handleDelete = (transfer: ApiTransfer) => {
    deleteTransfer.mutate({ saveId, transferId: transfer.id }, {
      onSuccess: () => toast.success("Transferência removida.", { duration: 3000 }),
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
    const routeLabel = incoming ? `De ${transfer.from}` : `Para ${transfer.to}`;

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
                type="button"
                onClick={() => openEditModal(transfer)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label={`Editar ${transfer.playerName}`}
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(transfer)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Excluir ${transfer.playerName}`}
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
                type="button"
                onClick={() => openEditModal(transfer)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label={`Editar ${transfer.playerName}`}
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(transfer)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Excluir ${transfer.playerName}`}
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
        <Loader2 size={20} className="animate-spin" /> Carregando transferências...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{currentClub} · {currentSeason}</p>
          <h2 className="font-display text-3xl font-bold leading-none tracking-tight text-foreground">Central de Mercado</h2>
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
              {item === "current" ? "Janela atual" : "Histórico"}
            </button>
          ))}
          {!isPastSeason && (
            <button
              type="button"
              onClick={openCreateModal}
              className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus size={16} /> Nova transferência
            </button>
          )}
        </div>
      </div>

      {isPastSeason && (
        <div className="rounded-md border border-border bg-muted px-4 py-2 text-sm text-muted-foreground">
          Visualizando temporada {selectedSeason}. As transferências estão em modo somente leitura.
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MarketStat
          label="Saldo disponível"
          value={displayBalance}
          icon={BadgeEuro}
          tone={(save?.balance ?? 0) < 0 ? "destructive" : "primary"}
          detail={
            variation
              ? `${variation.type === "venda" || variation.type === "emprestimo_saida" ? "+" : "-"} ${formatCurrencyInMillions(variation.amount)} nesta ação`
              : "Orçamento após a janela atual"
          }
        />
        <MarketStat
          label="Resultado da janela"
          value={formatSignedCurrencyInMillions(transferNet)}
          icon={transferNet >= 0 ? TrendingUp : TrendingDown}
          tone={transferNet >= 0 ? "accent" : "destructive"}
          detail={`${formatCurrencyInMillions(transferRevenue)} receita · ${formatCurrencyInMillions(transferSpend)} gasto`}
        />
        <MarketStat
          label="Entradas"
          value={currentIncoming.length}
          icon={ArrowDownLeft}
          tone="primary"
          detail={`${currentIncoming.filter((transfer) => transfer.type === "compra").length} compra(s) · ${currentIncoming.filter((transfer) => transfer.type === "emprestimo_entrada").length} empréstimo(s)`}
        />
        <MarketStat
          label="Saídas"
          value={currentOutgoing.length}
          icon={ArrowUpRight}
          tone="accent"
          detail={`${currentOutgoing.filter((transfer) => transfer.type === "venda").length} venda(s) · ${currentOutgoing.filter((transfer) => transfer.type === "emprestimo_saida").length} empréstimo(s)`}
        />
      </section>

      {tab === "current" ? (
        <div className="space-y-5">
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <TransferColumn
              title="Entradas"
              icon={ArrowDownLeft}
              tone="primary"
              count={currentIncoming.length}
              empty="Nenhuma contratação ou empréstimo de entrada nesta janela."
            >
              {currentIncoming.map((transfer) => renderTransferRow(transfer))}
            </TransferColumn>

            <TransferColumn
              title="Saídas"
              icon={ArrowUpRight}
              tone="accent"
              count={currentOutgoing.length}
              empty="Nenhuma venda ou empréstimo de saída nesta janela."
            >
              {currentOutgoing.map((transfer) => renderTransferRow(transfer))}
            </TransferColumn>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <MarketHighlight label="Maior compra" transfer={biggestPurchase} empty="Sem compras pagas" tone="primary" />
            <MarketHighlight label="Maior venda" transfer={biggestSale} empty="Sem vendas pagas" tone="accent" />
            <div className="card-gamer p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Repeat2 size={15} className={toneClass.warning} />
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Empréstimos</p>
                </div>
                <p className="font-display text-2xl font-bold leading-none text-[hsl(var(--warning))]">{currentLoans.length}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentLoans.length > 0
                  ? "Movimentos sem impacto direto no saldo, mas com impacto no elenco."
                  : "Nenhum empréstimo registrado na janela atual."}
              </p>
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-4">
          <section className="card-gamer p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Filter size={18} />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold">Filtros do histórico</h3>
                <p className="text-sm text-muted-foreground">{filteredHistoryTransfers.length} transferência{filteredHistoryTransfers.length === 1 ? "" : "s"} encontrada{filteredHistoryTransfers.length === 1 ? "" : "s"}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <FilterSelect
                label="Tipo"
                value={historyTypeFilter}
                onChange={(value) => setHistoryTypeFilter(value as TransferTypeFilter)}
                options={Object.entries(TRANSFER_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <FilterSelect
                label="Temporada"
                value={historySeasonFilter}
                onChange={setHistorySeasonFilter}
                options={[
                  { value: "all", label: "Todas as temporadas" },
                  ...historySeasons.map((season) => ({ value: season, label: season })),
                ]}
              />
              <FilterSelect
                label="Ordenação"
                value={historySort}
                onChange={(value) => setHistorySort(value as HistorySort)}
                options={[
                  { value: "recent", label: "Padrão" },
                  { value: "value_desc", label: "Maior valor" },
                  { value: "value_asc", label: "Menor valor" },
                ]}
              />
            </div>
          </section>

          <section className="card-gamer overflow-hidden">
            {filteredHistoryTransfers.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">Sem transferências registradas para os filtros selecionados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[840px] text-left">
                  <thead className="bg-muted/35">
                    <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Temporada</th>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
                      <th className="px-4 py-3 font-semibold">Jogador</th>
                      <th className="px-4 py-3 font-semibold">De</th>
                      <th className="px-4 py-3 font-semibold">Para</th>
                      <th className="px-4 py-3 text-right font-semibold">Valor</th>
                      {!isPastSeason && <th className="px-4 py-3 text-right font-semibold">Ações</th>}
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
