import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { extractErrorMessage } from "@/services/api";
import { toast } from "sonner";

interface StatsForm {
  goalsPro: number | "";
  goalsAgainst: number | "";
  wins: number | "";
  draws: number | "";
  losses: number | "";
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: StatsForm;
  onSave: (stats: StatsForm) => Promise<void>;
}

const StatsModal = ({ open, onOpenChange, stats, onSave }: Props) => {
  const [form, setForm] = useState(stats);

  useEffect(() => {
    setForm(stats);
  }, [stats, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submissionForm = {
      ...form,
      goalsPro: form.goalsPro === "" ? 0 : form.goalsPro,
      goalsAgainst: form.goalsAgainst === "" ? 0 : form.goalsAgainst,
      wins: form.wins === "" ? 0 : form.wins,
      draws: form.draws === "" ? 0 : form.draws,
      losses: form.losses === "" ? 0 : form.losses,
    };
    try {
      await onSave(submissionForm as any);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(extractErrorMessage(err), { duration: 5000 });
    }
  };

  const inputClass = "w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "text-xs text-muted-foreground uppercase mb-1 block";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Editar Estatísticas</DialogTitle>
          <DialogDescription>Atualize as estatísticas do time na temporada.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Gols Pró</label>
              <input type="number" className={inputClass} value={form.goalsPro} onChange={(e) => setForm({ ...form, goalsPro: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
            </div>
            <div>
              <label className={labelClass}>Gols Contra</label>
              <input type="number" className={inputClass} value={form.goalsAgainst} onChange={(e) => setForm({ ...form, goalsAgainst: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Vitórias</label>
              <input type="number" className={inputClass} value={form.wins} onChange={(e) => setForm({ ...form, wins: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
            </div>
            <div>
              <label className={labelClass}>Empates</label>
              <input type="number" className={inputClass} value={form.draws} onChange={(e) => setForm({ ...form, draws: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
            </div>
            <div>
              <label className={labelClass}>Derrotas</label>
              <input type="number" className={inputClass} value={form.losses} onChange={(e) => setForm({ ...form, losses: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-primary text-primary-foreground px-5 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity">
              Salvar
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

export default StatsModal;
