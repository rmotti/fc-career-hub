import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, DollarSign, Plus, Pencil, Trash2, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";
import { type ApiTransfer, extractErrorMessage } from "@/services/api";
import { useTransfers, useCreateTransfer, useUpdateTransfer, useDeleteTransfer } from "@/hooks/useTransfers";
import { useFinancialSnapshot } from "@/hooks/useFinancialSnapshot";
import { usePlayer, useUpdatePlayer, useUpdatePlayerStats } from "@/hooks/usePlayers";
import TransferModal from "@/components/modals/TransferModal";
import PlayerModal from "@/components/modals/PlayerModal";
import { formatCurrency } from "@/utils/currency";

interface Props {
  saveId: string;
  currentClub: string;
  currentSeason: string;
  selectedSeason?: string;
}

type TransferTypeFilter = "all" | "compra" | "venda" | "emprestimo_entrada" | "emprestimo_saida";
type HistorySort = "recent" | "value_desc" | "value_asc";

const TRANSFER_TYPE_LABELS: Record<TransferTypeFilter, string> = {
  all: "Todos os tipos",
  compra: "Compras",
  venda: "Vendas",
  emprestimo_entrada: "Empréstimos de entrada",
  emprestimo_saida: "Empréstimos de saída",
};

const TransfersScreen = ({ saveId, currentClub, currentSeason, selectedSeason }: Props) => {
  const [tab, setTab] = useState<"current" | "history">("current");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<ApiTransfer | null>(null);
  const [variation, setVariation] = useState<{ amount: string; type: "compra" | "venda" | "emprestimo_entrada" | "emprestimo_saida" } | null>(null);
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
  const displayBalance = typeof save?.balance === "number" ? formatCurrency(save.balance) : save?.balanceFormatted ?? "—";

  const historySeasons = useMemo(() => {
    return [...new Set(allTransfers.map((transfer) => transfer.season))]
      .sort((a, b) => b.localeCompare(a));
  }, [allTransfers]);

  const filteredHistoryTransfers = useMemo(() => {
    const filtered = allTransfers.filter((transfer) => {
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
  }, [allTransfers, historySeasonFilter, historySort, historyTypeFilter]);

  const displayTransfers = tab === "current" ? currentTransfers : filteredHistoryTransfers;
  const purchases = displayTransfers.filter(t => t.type === "compra" || t.type === "emprestimo_entrada");
  const sales = displayTransfers.filter(t => t.type === "venda" || t.type === "emprestimo_saida");

  const handleSaveTransfer = async (data: any, transferId?: string) => {
    if (transferId) {
      await updateTransfer.mutateAsync({ saveId, transferId, data });
      toast.success("Transferência atualizada com sucesso!", { duration: 3000 });
    } else {
      const response = await createTransfer.mutateAsync({ saveId, data });
      setVariation({ amount: data.fee || "0", type: data.type });
      setTimeout(() => setVariation(null), 5000);

      if ((data.type === "compra" || data.type === "emprestimo_entrada") && response.transfer?.playerId) {
        setPurchasePlayerId(response.transfer.playerId);
        setPlayerModalOpen(true);
        toast.success("Jogador adicionado! Complete as informações abaixo.", { duration: 4000 });
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

  const renderTransferRow = (t: ApiTransfer) => (
    <div key={t.id} className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-2 group">
      <div className="flex items-center gap-3">
        {(t.type === "compra" || t.type === "emprestimo_entrada") ? <ArrowDownLeft size={14} className="text-primary" /> : <ArrowUpRight size={14} className="text-accent" />}
        <div>
          <p className="font-medium text-sm">{t.playerName}</p>
          <p className="text-xs text-muted-foreground">
            {(t.type === "compra" || t.type === "emprestimo_entrada") ? `De: ${t.from}` : `Para: ${t.to}`} — {t.season}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-display font-bold text-sm ${(t.type === "compra" || t.type === "emprestimo_entrada") ? "text-primary" : "text-accent"}`}>
          {t.fee
            ? (t.feeFormatted ?? `€${t.fee}M`)
            : (t.type === "emprestimo_entrada" || t.type === "emprestimo_saida")
              ? "Empréstimo"
              : "Livre"}
        </span>
        {!isPastSeason && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => { setEditingTransfer(t); setModalOpen(true); }}
              className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => handleDelete(t)}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" /> Carregando transferências...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold">Transferências</h2>
        {!isPastSeason && (
          <button
            onClick={() => { setEditingTransfer(null); setModalOpen(true); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Nova Transferência
          </button>
        )}
      </div>
      {isPastSeason && (
        <div className="px-4 py-2 rounded-md bg-muted border border-border text-sm text-muted-foreground flex items-center gap-2">
          📅 Visualizando temporada {selectedSeason} — modo somente leitura
        </div>
      )}

      <div className="flex gap-2">
        {(["current", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "current" ? "Janela Atual" : "Histórico"}
          </button>
        ))}
      </div>

      {tab === "current" ? (
        <div className="space-y-6">
          <div className="card-gamer p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Saldo disponível</p>
              <div className="flex items-center gap-3">
                <p className="text-xl font-display font-bold text-primary">{displayBalance}</p>
                {variation && (
                  <span className={`text-sm font-bold ${(variation.type === "venda" || variation.type === "emprestimo_saida") ? "text-green-500" : "text-destructive"} animate-in fade-in slide-in-from-left-2`}>
                    {(variation.type === "venda" || variation.type === "emprestimo_saida") ? "+" : "-"}€{variation.amount}M
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="card-gamer p-5">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
              <ArrowDownLeft size={16} className="text-primary" /> Contratações
            </h3>
            {purchases.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma contratação recente.</p>
            ) : (
              <div className="space-y-2">{purchases.map((t) => renderTransferRow(t))}</div>
            )}
          </div>

          <div className="card-gamer p-5">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
              <ArrowUpRight size={16} className="text-accent" /> Vendas
            </h3>
            {sales.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma venda recente.</p>
            ) : (
              <div className="space-y-2">{sales.map((t) => renderTransferRow(t))}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="card-gamer p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Filter size={18} />
              </div>
              <div>
                <h3 className="font-display font-semibold">Filtros</h3>
                <p className="text-sm text-muted-foreground">Refine o histórico por tipo, temporada e faixa de valor.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs uppercase text-muted-foreground">Tipo</label>
                <select
                  value={historyTypeFilter}
                  onChange={(e) => setHistoryTypeFilter(e.target.value as TransferTypeFilter)}
                  className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {Object.entries(TRANSFER_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase text-muted-foreground">Temporada</label>
                <select
                  value={historySeasonFilter}
                  onChange={(e) => setHistorySeasonFilter(e.target.value)}
                  className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">Todas as temporadas</option>
                  {historySeasons.map((season) => (
                    <option key={season} value={season}>{season}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase text-muted-foreground">Ordenar por valor</label>
                <select
                  value={historySort}
                  onChange={(e) => setHistorySort(e.target.value as HistorySort)}
                  className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="recent">Padrão</option>
                  <option value="value_desc">Maior valor</option>
                  <option value="value_asc">Menor valor</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card-gamer p-5">
            <div className="mb-4">
              <h3 className="font-display font-semibold">Histórico Completo</h3>
              <p className="text-sm text-muted-foreground">
                {filteredHistoryTransfers.length} transferência{filteredHistoryTransfers.length === 1 ? "" : "s"} encontrada{filteredHistoryTransfers.length === 1 ? "" : "s"}
              </p>
            </div>
            {filteredHistoryTransfers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem transferências registradas.</p>
            ) : (
              <div className="space-y-2">
                {filteredHistoryTransfers.map((t) => renderTransferRow(t))}
              </div>
            )}
          </div>
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

export default TransfersScreen;
