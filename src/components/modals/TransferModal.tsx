import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { ApiTransfer } from "@/services/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: ApiTransfer | null;
  currentClub: string;
  currentSeason: string;
  onSave: (data: { playerName: string; type: "compra" | "venda"; from: string; to: string; fee: string; season: string }, transferId?: string) => void;
}

const TransferModal = ({ open, onOpenChange, transfer, currentClub, currentSeason, onSave }: Props) => {
  const [form, setForm] = useState({
    playerName: "",
    type: "compra" as "compra" | "venda",
    from: "",
    to: "",
    fee: "",
    season: currentSeason,
  });

  useEffect(() => {
    if (transfer) {
      setForm({
        playerName: transfer.playerName,
        type: transfer.type,
        from: transfer.from,
        to: transfer.to,
        fee: transfer.fee ?? "",
        season: transfer.season,
      });
    } else {
      setForm({
        playerName: "",
        type: "compra",
        from: "",
        to: currentClub,
        fee: "",
        season: currentSeason,
      });
    }
  }, [transfer, open, currentClub, currentSeason]);

  // Auto-fill club based on type
  useEffect(() => {
    if (!transfer) {
      if (form.type === "compra") {
        setForm((prev) => ({ ...prev, to: currentClub }));
      } else {
        setForm((prev) => ({ ...prev, from: currentClub }));
      }
    }
  }, [form.type, currentClub, transfer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form, transfer?._id);
    onOpenChange(false);
  };

  const inputClass = "w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "text-xs text-muted-foreground uppercase mb-1 block";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{transfer ? "Editar Transferência" : "Nova Transferência"}</DialogTitle>
          <DialogDescription>Registre uma contratação ou venda.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelClass}>Jogador</label>
            <input className={inputClass} value={form.playerName} onChange={(e) => setForm({ ...form, playerName: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Tipo</label>
            <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "compra" | "venda" })}>
              <option value="compra">Compra</option>
              <option value="venda">Venda</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>De</label>
              <input className={inputClass} value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Para</label>
              <input className={inputClass} value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Valor</label>
              <input className={inputClass} value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} placeholder="€10M" />
            </div>
            <div>
              <label className={labelClass}>Temporada</label>
              <input className={inputClass} value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} placeholder="2026/27" required />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-primary text-primary-foreground px-5 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity">
              {transfer ? "Salvar" : "Registrar"}
            </button>
            <button type="button" onClick={() => onOpenChange(false)} className="bg-muted text-muted-foreground px-5 py-2 rounded-md text-sm hover:text-foreground transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferModal;
