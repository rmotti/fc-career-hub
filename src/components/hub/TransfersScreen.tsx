import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, DollarSign, Plus, Pencil, Trash2 } from "lucide-react";
import type { SaveData, Transfer } from "@/data/mockData";
import TransferModal from "@/components/modals/TransferModal";

interface Props {
  save: SaveData;
  onUpdateTransfers: (transfers: Transfer[]) => void;
}

const TransfersScreen = ({ save, onUpdateTransfers }: Props) => {
  const [tab, setTab] = useState<"current" | "history">("current");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);

  const currentYear = save.year;
  const currentTransfers = save.transfers.filter(t => t.year >= currentYear - 1);
  const purchases = currentTransfers.filter(t => t.type === "compra");
  const sales = currentTransfers.filter(t => t.type === "venda");

  const handleSaveTransfer = (transfer: Transfer) => {
    const exists = save.transfers.find((t) => t.id === transfer.id);
    if (exists) {
      onUpdateTransfers(save.transfers.map((t) => (t.id === transfer.id ? transfer : t)));
    } else {
      onUpdateTransfers([...save.transfers, transfer]);
    }
    setEditingTransfer(null);
  };

  const handleDelete = (id: number) => {
    onUpdateTransfers(save.transfers.filter((t) => t.id !== id));
  };

  const renderTransferRow = (t: Transfer, showType?: boolean) => (
    <div key={t.id} className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-2 group">
      <div className="flex items-center gap-3">
        {(showType || true) && (
          t.type === "compra" ? <ArrowDownLeft size={14} className="text-primary" /> : <ArrowUpRight size={14} className="text-accent" />
        )}
        <div>
          <p className="font-medium text-sm">{t.playerName}</p>
          <p className="text-xs text-muted-foreground">
            {t.type === "compra" ? `De: ${t.from}` : `Para: ${t.to}`} — {t.year}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-display font-bold text-sm ${t.type === "compra" ? "text-primary" : "text-accent"}`}>
          {t.fee}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => { setEditingTransfer(t); setModalOpen(true); }}
            className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => handleDelete(t.id)}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
              <p className="text-xl font-display font-bold text-primary">{save.budget}</p>
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
          {save.transfers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem transferências registradas.</p>
          ) : (
            <div className="space-y-2">
              {[...save.transfers].sort((a, b) => b.year - a.year).map((t) => renderTransferRow(t, true))}
            </div>
          )}
        </div>
      )}

      <TransferModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transfer={editingTransfer}
        currentClub={save.currentClub}
        currentYear={save.year}
        onSave={handleSaveTransfer}
      />
    </div>
  );
};

export default TransfersScreen;
