import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { extractErrorMessage, type ApiTeamStats } from "@/services/api";
import { toast } from "sonner";
import { CUP_OPTIONS } from "@/utils/competitions";

interface StatsForm {
  goalsPro: number | "";
  goalsAgainst: number | "";
  wins: number | "";
  draws: number | "";
  losses: number | "";
  leaguePosition: number | "";
  cupResult: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stat: ApiTeamStats | null;
  onSave: (stats: StatsForm) => Promise<void>;
}

const StatsModal = ({ open, onOpenChange, stat, onSave }: Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<StatsForm>({
    goalsPro: "",
    goalsAgainst: "",
    wins: "",
    draws: "",
    losses: "",
    leaguePosition: "",
    cupResult: "NaoParticipou",
  });

  useEffect(() => {
    if (!stat) return;
    setForm({
      goalsPro: stat.goalsPro,
      goalsAgainst: stat.goalsAgainst,
      wins: stat.wins,
      draws: stat.draws,
      losses: stat.losses,
      leaguePosition: stat.leaguePosition ?? "",
      cupResult: stat.cupResult ?? "NaoParticipou",
    });
  }, [stat, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submissionForm = {
      ...form,
      goalsPro: form.goalsPro === "" ? 0 : form.goalsPro,
      goalsAgainst: form.goalsAgainst === "" ? 0 : form.goalsAgainst,
      wins: form.wins === "" ? 0 : form.wins,
      draws: form.draws === "" ? 0 : form.draws,
      losses: form.losses === "" ? 0 : form.losses,
      leaguePosition: form.leaguePosition === "" ? null : form.leaguePosition,
    };

    setIsSubmitting(true);
    try {
      await onSave(submissionForm);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(extractErrorMessage(err), { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!stat) return null;

  const isLeague = stat.competition.type === "League";
  const inputClass = "w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "text-xs text-muted-foreground uppercase mb-1 block";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Editar {stat.competition.name}</DialogTitle>
          <DialogDescription>Atualize os números da competição na temporada.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label id="label-wins" className={labelClass}>Vitórias</label>
              <input id="field-wins" name="wins" type="number" className={inputClass} value={form.wins} onChange={(e) => setForm({ ...form, wins: e.target.value === "" ? "" : parseInt(e.target.value, 10) })} min={0} />
            </div>
            <div>
              <label id="label-draws" className={labelClass}>Empates</label>
              <input id="field-draws" name="draws" type="number" className={inputClass} value={form.draws} onChange={(e) => setForm({ ...form, draws: e.target.value === "" ? "" : parseInt(e.target.value, 10) })} min={0} />
            </div>
            <div>
              <label id="label-losses" className={labelClass}>Derrotas</label>
              <input id="field-losses" name="losses" type="number" className={inputClass} value={form.losses} onChange={(e) => setForm({ ...form, losses: e.target.value === "" ? "" : parseInt(e.target.value, 10) })} min={0} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label id="label-goalsPro" className={labelClass}>Gols Marcados</label>
              <input id="field-goalsPro" name="goalsPro" type="number" className={inputClass} value={form.goalsPro} onChange={(e) => setForm({ ...form, goalsPro: e.target.value === "" ? "" : parseInt(e.target.value, 10) })} min={0} />
            </div>
            <div>
              <label id="label-goalsAgainst" className={labelClass}>Gols Sofridos</label>
              <input id="field-goalsAgainst" name="goalsAgainst" type="number" className={inputClass} value={form.goalsAgainst} onChange={(e) => setForm({ ...form, goalsAgainst: e.target.value === "" ? "" : parseInt(e.target.value, 10) })} min={0} />
            </div>
          </div>

          {isLeague ? (
            <div className="border-t border-border pt-3">
              <label id="label-leaguePosition" className={labelClass}>Posição na Liga</label>
              <input
                id="field-leaguePosition"
                name="leaguePosition"
                type="number"
                className={inputClass}
                value={form.leaguePosition}
                onChange={(e) => setForm({ ...form, leaguePosition: e.target.value === "" ? "" : parseInt(e.target.value, 10) })}
                min={1}
                max={30}
                placeholder="ex: 1"
              />
            </div>
          ) : (
            <div className="border-t border-border pt-3">
              <label id="label-cupResult" className={labelClass}>Resultado da Copa</label>
              <select
                id="field-cupResult"
                name="cupResult"
                className={inputClass}
                value={form.cupResult}
                onChange={(e) => setForm({ ...form, cupResult: e.target.value })}
              >
                {CUP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground px-5 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-70">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Salvar
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

export default StatsModal;
