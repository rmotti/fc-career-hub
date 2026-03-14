import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { type ApiTransfer, extractErrorMessage } from "@/services/api";
import { normalizeCurrencyInput } from "@/utils/currency";
import { toast } from "sonner";
import { Lock } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: ApiTransfer | null;
  currentClub: string;
  currentSeason: string;
  onSave: (data: any, transferId?: string) => Promise<void>;
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
    if (form.type === "compra") {
      setForm((prev) => ({ ...prev, to: currentClub }));
    } else {
      setForm((prev) => ({ ...prev, from: currentClub }));
    }
  }, [form.type, currentClub]);

  const handleFeeBlur = () => {
    const normalized = normalizeCurrencyInput(form.fee);
    setForm((prev) => ({ ...prev, fee: normalized }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fee = normalizeCurrencyInput(form.fee);
    try {
      await onSave({ ...form, fee }, transfer?.id);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(extractErrorMessage(err), { duration: 5000 });
    }
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>De</label>
              <div className="relative">
                <input 
                  className={`${inputClass} ${form.type === "venda" ? "opacity-70 cursor-not-allowed bg-muted/60 pl-9" : ""}`} 
                  value={form.from} 
                  onChange={(e) => setForm({ ...form, from: e.target.value })} 
                  disabled={form.type === "venda"}
                  placeholder={form.type === "compra" ? "Clube de origem" : ""}
                  required 
                />
                {form.type === "venda" && <Lock size={14} className="absolute left-3 top-2.5 text-muted-foreground" />}
              </div>
            </div>
            <div>
              <label className={labelClass}>Para</label>
              <div className="relative">
                <input 
                  className={`${inputClass} ${form.type === "compra" ? "opacity-70 cursor-not-allowed bg-muted/60 pl-9" : ""}`} 
                  value={form.to} 
                  onChange={(e) => setForm({ ...form, to: e.target.value })} 
                  disabled={form.type === "compra"}
                  placeholder={form.type === "venda" ? "Clube de destino" : ""}
                  required 
                />
                {form.type === "compra" && <Lock size={14} className="absolute left-3 top-2.5 text-muted-foreground" />}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Valor</label>
              <input className={inputClass} value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} onBlur={handleFeeBlur} placeholder="€10M" />
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
