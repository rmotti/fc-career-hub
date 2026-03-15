import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, DollarSign, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { type ApiTransfer, extractErrorMessage } from "@/services/api";
import { useTransfers, useCreateTransfer, useUpdateTransfer, useDeleteTransfer } from "@/hooks/useTransfers";
import { useSave } from "@/hooks/useSaves";
import TransferModal from "@/components/modals/TransferModal";

interface Props {
  saveId: string;
  currentClub: string;
  currentSeason: string;
}

const TransfersScreen = ({ saveId, currentClub, currentSeason }: Props) => {
  const [tab, setTab] = useState<"current" | "history">("current");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<ApiTransfer | null>(null);
  const [variation, setVariation] = useState<{ amount: string; type: "compra" | "venda" } | null>(null);

  const { data: save } = useSave(saveId);
  const { data: allTransfers = [], isLoading } = useTransfers(saveId);
  const { data: currentTransfers = [] } = useTransfers(saveId, "current");
  const createTransfer = useCreateTransfer();
  const updateTransfer = useUpdateTransfer();
  const deleteTransfer = useDeleteTransfer();

  const displayTransfers = tab === "current" ? currentTransfers : allTransfers;
  const purchases = displayTransfers.filter(t => t.type === "compra");
  const sales = displayTransfers.filter(t => t.type === "venda");

  const handleSaveTransfer = async (data: any, transferId?: string) => {
    if (transferId) {
      await updateTransfer.mutateAsync({ saveId, transferId, data });
      toast.success("Transferência atualizada com sucesso!", { duration: 3000 });
    } else {
      await createTransfer.mutateAsync({ saveId, data });
      setVariation({ amount: data.fee || "0", type: data.type });
      setTimeout(() => setVariation(null), 5000);
      toast.success("Transferência registrada com sucesso!", { duration: 3000 });
    }
    setEditingTransfer(null);
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
        {t.type === "compra" ? <ArrowDownLeft size={14} className="text-primary" /> : <ArrowUpRight size={14} className="text-accent" />}
        <div>
          <p className="font-medium text-sm">{t.playerName}</p>
          <p className="text-xs text-muted-foreground">
            {t.type === "compra" ? `De: ${t.from}` : `Para: ${t.to}`} — {t.season}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-display font-bold text-sm ${t.type === "compra" ? "text-primary" : "text-accent"}`}>
          {t.fee || "Livre"}
        </span>
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
        <button
          onClick={() => { setEditingTransfer(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Nova Transferência
        </button>
      </div>

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
              <p className="text-xs text-muted-foreground uppercase">Orçamento Disponível</p>
              <div className="flex items-center gap-3">
                <p className="text-xl font-display font-bold text-primary">{save?.balanceFormatted ?? save?.balance ?? "—"}</p>
                {variation && (
                  <span className={`text-sm font-bold ${variation.type === "venda" ? "text-green-500" : "text-destructive"} animate-in fade-in slide-in-from-left-2`}>
                    {variation.type === "venda" ? "+" : "-"}€{variation.amount}M
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
        <div className="card-gamer p-5">
          <h3 className="font-display font-semibold mb-4">Histórico Completo</h3>
          {allTransfers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem transferências registradas.</p>
          ) : (
            <div className="space-y-2">
              {allTransfers.map((t) => renderTransferRow(t))}
            </div>
          )}
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
    </div>
  );
};

export default TransfersScreen;
