import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { type ApiTransfer, extractErrorMessage } from "@/services/api";
import { toast } from "sonner";
import { Lock, ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { usePlayers } from "@/hooks/usePlayers";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: ApiTransfer | null;
  currentClub: string;
  currentSeason: string;
  onSave: (data: any, transferId?: string) => Promise<void>;
  saveId: string;
}

type TransferType = "compra" | "venda" | "emprestimo_entrada" | "emprestimo_saida";

const TransferModal = ({ open, onOpenChange, transfer, currentClub, currentSeason, onSave, saveId }: Props) => {
  const { data: activePlayers = [] } = usePlayers(saveId, true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    playerId: "",
    playerName: "",
    type: "compra" as TransferType,
    from: "",
    to: "",
    fee: "",
  });

  const isEntry = form.type === "compra" || form.type === "emprestimo_entrada";
  const isExit  = form.type === "venda"  || form.type === "emprestimo_saida";

  useEffect(() => {
    if (transfer) {
      setForm({
        playerId: transfer.playerId || "",
        playerName: transfer.playerName,
        type: transfer.type as TransferType,
        from: transfer.from,
        to: transfer.to,
        fee: transfer.fee ?? "",
      });
    } else {
      setForm({
        playerId: "",
        playerName: "",
        type: "compra",
        from: "",
        to: currentClub,
        fee: "",
      });
    }
  }, [transfer, open, currentClub]);

  // Auto-fill the locked club field when type changes
  useEffect(() => {
    if (isEntry) {
      setForm((prev) => ({ ...prev, to: currentClub }));
    } else {
      setForm((prev) => ({ ...prev, from: currentClub }));
    }
  }, [form.type, currentClub]);

  const handlePlayerSelect = (pId: string) => {
    const player = activePlayers.find(p => p.id === pId);
    if (!player) {
      setForm(prev => ({ ...prev, playerId: "", playerName: "" }));
      return;
    }
    setForm(prev => ({
      ...prev,
      playerId: player.id,
      playerName: player.name,
      from: isExit ? currentClub : prev.from,
      to: isEntry ? currentClub : prev.to,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(
        { ...form, season: currentSeason, fee: form.fee ? parseFloat(form.fee) : undefined },
        transfer?.id
      );
      onOpenChange(false);
    } catch (err: any) {
      toast.error(extractErrorMessage(err), { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
  const lockedClass = "opacity-70 cursor-not-allowed bg-muted/60 pl-9";
  const labelClass = "text-xs text-muted-foreground uppercase mb-1 block";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            {isEntry
              ? <ArrowDownLeft size={18} className="text-primary" />
              : <ArrowUpRight size={18} className="text-accent" />
            }
            {transfer ? "Editar Transferência" : "Nova Transferência"}
          </DialogTitle>
          <DialogDescription>Registre uma contratação ou venda.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelClass}>Jogador</label>
            {isExit ? (
              <select className={inputClass} value={form.playerId || ""} onChange={(e) => handlePlayerSelect(e.target.value)} required>
                <option value="">Selecionar jogador do elenco...</option>
                {activePlayers.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.position})
                  </option>
                ))}
              </select>
            ) : (
              <input className={inputClass} value={form.playerName} onChange={(e) => setForm({ ...form, playerName: e.target.value })} placeholder="Nome do jogador" required />
            )}
          </div>
          <div>
            <label className={labelClass}>Tipo</label>
            <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TransferType })}>
              <option value="compra">Compra</option>
              <option value="venda">Venda</option>
              <option value="emprestimo_entrada">Empréstimo (entrada)</option>
              <option value="emprestimo_saida">Empréstimo (saída)</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>De</label>
              <div className="relative">
                <input
                  className={`${inputClass} ${isExit ? lockedClass : ""}`}
                  value={isExit ? currentClub : form.from}
                  onChange={(e) => !isExit && setForm({ ...form, from: e.target.value })}
                  disabled={isExit}
                  placeholder="Clube de origem"
                  required
                />
                {isExit && <Lock size={14} className="absolute left-3 top-2.5 text-muted-foreground" />}
              </div>
            </div>
            <div>
              <label className={labelClass}>Para</label>
              <div className="relative">
                <input
                  className={`${inputClass} ${isEntry ? lockedClass : ""}`}
                  value={isEntry ? currentClub : form.to}
                  onChange={(e) => !isEntry && setForm({ ...form, to: e.target.value })}
                  disabled={isEntry}
                  placeholder="Clube de destino"
                  required
                />
                {isEntry && <Lock size={14} className="absolute left-3 top-2.5 text-muted-foreground" />}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Valor</label>
              <div className="relative">
                <input type="number" step="0.1" min={0} className={inputClass} value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} placeholder="45" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">M€</span>
              </div>
              {(form.type === "emprestimo_entrada" || form.type === "emprestimo_saida") && (
                <p className="text-xs text-muted-foreground mt-1">Empréstimos não afetam o saldo da equipe.</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Temporada</label>
              <div className="relative">
                <input
                  className={`${inputClass} ${lockedClass}`}
                  value={currentSeason}
                  disabled
                />
                <Lock size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground px-5 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-70">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {transfer ? "Salvar" : "Registrar"}
            </button>
            <button type="button" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="bg-muted text-muted-foreground px-5 py-2 rounded-md text-sm hover:text-foreground transition-colors disabled:opacity-50">
              Cancelar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferModal;
