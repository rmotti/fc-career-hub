import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { type ApiPlayer, extractErrorMessage } from "@/services/api";
import { useUpdatePlayerStats, usePlayer } from "@/hooks/usePlayers";
import { toast } from "sonner";
import { getBadge } from "@/lib/playerBadge";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: ApiPlayer | null;
  onSave: (data: any, playerId?: string) => Promise<void>;
  saveId: string;
}

const POSITIONS = ["GOL", "LD", "LE", "ZAG", "VOL", "MC", "ME", "MD", "MEI", "PE", "PD", "SA", "ATA"] as const;
const CLEAN_SHEETS_POSITIONS = new Set(["GOL", "ZAG", "LD", "LE", "VOL"]);

const EMPTY_PLAYER = {
  name: "", position: "MC" as string, age: 20 as number | "", status: "Important" as string, ovr: 70 as number | "",
  salary: "" as number | "", marketValue: "" as number | "",
  potential: "" as number | "", shirtNumber: "" as number | "",
  goals: 0 as number | "", assists: 0 as number | "", yellowCards: 0 as number | "", redCards: 0 as number | "", matches: 0 as number | "", cleanSheets: 0 as number | "",
};

const PlayerModal = ({ open, onOpenChange, player, onSave, saveId }: Props) => {
  const [form, setForm] = useState(EMPTY_PLAYER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!player;
  const updateStats = useUpdatePlayerStats();
  const { data: playerDetail } = usePlayer(open && isEdit ? saveId : null, player?.id ?? null);

  useEffect(() => {
    if (open) {
      if (player) {
        const stats = player.currentSeasonStats || player.totalStats;
        setForm({
          name: player.name,
          position: player.position,
          age: player.age,
          status: player.status,
          ovr: player.ovr,
          salary: player.salary ?? "",
          marketValue: player.marketValue ?? "",
          potential: player.potential ?? "",
          shirtNumber: player.shirtNumber ?? "",
          goals: stats?.goals ?? 0,
          assists: stats?.assists ?? 0,
          yellowCards: stats?.yellowCards ?? 0,
          redCards: stats?.redCards ?? 0,
          matches: stats?.matches ?? 0,
          cleanSheets: stats?.cleanSheets ?? 0,
        });
      } else {
        setForm(EMPTY_PLAYER);
      }
    }
  }, [player, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submissionForm = {
      ...form,
      age: form.age === "" ? 0 : form.age,
      ovr: form.ovr === "" ? 0 : form.ovr,
      goals: form.goals === "" ? 0 : form.goals,
      assists: form.assists === "" ? 0 : form.assists,
      yellowCards: form.yellowCards === "" ? 0 : form.yellowCards,
      redCards: form.redCards === "" ? 0 : form.redCards,
      matches: form.matches === "" ? 0 : form.matches,
      cleanSheets: form.cleanSheets === "" ? 0 : form.cleanSheets,
      potential: form.potential === "" ? undefined : form.potential,
      shirtNumber: form.shirtNumber === "" ? undefined : form.shirtNumber,
    };

    setIsSubmitting(true);
    try {
      await onSave(submissionForm, player?.id);

      if (player) {
        const stats = player.currentSeasonStats || player.totalStats;
        const statsChanged =
          form.goals !== (stats?.goals ?? 0) ||
          form.assists !== (stats?.assists ?? 0) ||
          form.yellowCards !== (stats?.yellowCards ?? 0) ||
          form.redCards !== (stats?.redCards ?? 0) ||
          form.matches !== (stats?.matches ?? 0) ||
          form.cleanSheets !== (stats?.cleanSheets ?? 0);

        if (statsChanged) {
          await updateStats.mutateAsync({
            saveId,
            playerId: player.id,
            data: {
              goals: submissionForm.goals,
              assists: submissionForm.assists,
              yellowCards: submissionForm.yellowCards,
              redCards: submissionForm.redCards,
              matches: submissionForm.matches,
              cleanSheets: submissionForm.cleanSheets,
            },
          });
          toast.success("Estatísticas atualizadas!", { duration: 3000 });
        }
      }
      setForm(EMPTY_PLAYER);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(extractErrorMessage(err), { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "text-xs text-muted-foreground uppercase mb-1 block";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{isEdit ? "Editar Jogador" : "Adicionar Jogador"}</DialogTitle>
          <DialogDescription>Preencha os dados do jogador.</DialogDescription>
        </DialogHeader>
        {player && (() => {
          const badge = getBadge(player);
          return badge ? (
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2 py-1 rounded text-sm font-semibold"
                style={{ backgroundColor: badge.color + "22", color: badge.color, border: `1px solid ${badge.color}44` }}
              >
                {badge.icon} {badge.label}
              </span>
            </div>
          ) : null;
        })()}
        <form onSubmit={handleSubmit}>
          <fieldset className="space-y-3" disabled={isSubmitting}>
          <div>
            <label className={labelClass}>Nome</label>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Posição</label>
              <select className={inputClass} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Crucial">Crucial</option>
                <option value="Important">Importante</option>
                <option value="Role">Rotação</option>
                <option value="Sporadic">Esporádico</option>
                <option value="Promising">Promissor</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Idade</label>
              <input type="number" className={inputClass} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value === "" ? "" : parseInt(e.target.value) })} min={15} max={45} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>OVR</label>
              <input type="number" className={inputClass} value={form.ovr} onChange={(e) => setForm({ ...form, ovr: e.target.value === "" ? "" : parseInt(e.target.value) })} min={40} max={99} />
            </div>
            <div>
              <label className={labelClass}>Potencial</label>
              <input type="number" className={inputClass} value={form.potential} onChange={(e) => setForm({ ...form, potential: e.target.value === "" ? "" : parseInt(e.target.value) })} min={40} max={99} placeholder="—" />
            </div>
            <div>
              <label className={labelClass}>Camisa</label>
              <input type="number" className={inputClass} value={form.shirtNumber} onChange={(e) => setForm({ ...form, shirtNumber: e.target.value === "" ? "" : parseInt(e.target.value) })} min={1} max={99} placeholder="—" />
            </div>
            <div>
              <label className={labelClass}>Partidas</label>
              <input type="number" className={inputClass} value={form.matches} onChange={(e) => setForm({ ...form, matches: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>Gols</label>
              <input type="number" className={inputClass} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
            </div>
            <div>
              <label className={labelClass}>Assist.</label>
              <input type="number" className={inputClass} value={form.assists} onChange={(e) => setForm({ ...form, assists: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
            </div>
            {CLEAN_SHEETS_POSITIONS.has(form.position) && (
              <div>
                <label className={labelClass}>Clean Sheets</label>
                <input type="number" className={inputClass} value={form.cleanSheets} onChange={(e) => setForm({ ...form, cleanSheets: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Cartões Amarelos</label>
              <input type="number" className={inputClass} value={form.yellowCards} onChange={(e) => setForm({ ...form, yellowCards: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
            </div>
            <div>
              <label className={labelClass}>Cartões Vermelhos</label>
              <input type="number" className={inputClass} value={form.redCards} onChange={(e) => setForm({ ...form, redCards: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Salário</label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min={0}
                  className={inputClass}
                  value={form.salary ?? ""}
                  onChange={(e) => setForm({ ...form, salary: e.target.value ? parseFloat(e.target.value) : "" })}
                  placeholder="75"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">K€</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>Valor de Mercado</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  className={inputClass}
                  value={form.marketValue ?? ""}
                  onChange={(e) => setForm({ ...form, marketValue: e.target.value ? parseFloat(e.target.value) : "" })}
                  placeholder="35"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">M€</span>
              </div>
            </div>
          </div>
          {playerDetail?.ovrHistory && playerDetail.ovrHistory.length > 0 && (
            <div>
              <label className={labelClass}>Evolução de OVR</label>
              <div className="bg-muted/50 rounded-md border border-border overflow-hidden">
                <div className="grid grid-cols-3 px-3 py-1.5 text-xs text-muted-foreground uppercase border-b border-border">
                  <span>Temporada</span>
                  <span>OVR</span>
                  <span>Valor</span>
                </div>
                {playerDetail.ovrHistory.map((h) => (
                  <div key={h.season} className="grid grid-cols-3 px-3 py-1.5 text-sm border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground">{h.season}</span>
                    <span className="font-display font-bold">{h.ovr}</span>
                    <span className="text-muted-foreground">{h.marketValue != null ? `€${h.marketValue}M` : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground px-5 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? "Salvar" : "Adicionar"}
            </button>
            <button type="button" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="bg-muted text-muted-foreground px-5 py-2 rounded-md text-sm hover:text-foreground transition-colors disabled:opacity-50">
              Cancelar
            </button>
          </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerModal;
