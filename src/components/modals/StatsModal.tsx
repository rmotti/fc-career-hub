import { useEffect, useMemo, useState } from "react";
import { Goal, Loader2, Medal, Save, ShieldAlert, Target, Trophy, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

interface NumberFieldProps {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  tone?: "primary" | "warning" | "destructive" | "neutral";
  icon?: React.ElementType;
  min?: number;
  max?: number;
  placeholder?: string;
}

const toneFieldClass = {
  primary: "border-primary/25 focus:ring-primary text-primary",
  warning: "border-[hsl(var(--warning)/0.25)] focus:ring-[hsl(var(--warning))] text-[hsl(var(--warning))]",
  destructive: "border-destructive/25 focus:ring-destructive text-destructive",
  neutral: "border-border focus:ring-primary text-foreground",
};

function NumberField({
  label,
  value,
  onChange,
  tone = "neutral",
  icon: Icon,
  min = 0,
  max,
  placeholder = "0",
}: NumberFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon size={10} />}
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
        className={`w-full rounded-md border bg-background/55 px-3 py-3 text-center font-display text-2xl font-bold tabular-nums outline-none transition-shadow focus:ring-1 ${toneFieldClass[tone]}`}
      />
    </label>
  );
}

const asNumber = (value: number | "") => value === "" ? 0 : value;

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

  const derived = useMemo(() => {
    const wins = asNumber(form.wins);
    const draws = asNumber(form.draws);
    const losses = asNumber(form.losses);
    const goalsPro = asNumber(form.goalsPro);
    const goalsAgainst = asNumber(form.goalsAgainst);
    const matches = wins + draws + losses;
    const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
    const goalDiff = goalsPro - goalsAgainst;
    const points = wins * 3 + draws;

    return { wins, draws, losses, goalsPro, goalsAgainst, matches, winRate, goalDiff, points };
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submissionForm = {
      ...form,
      goalsPro: asNumber(form.goalsPro),
      goalsAgainst: asNumber(form.goalsAgainst),
      wins: asNumber(form.wins),
      draws: asNumber(form.draws),
      losses: asNumber(form.losses),
      leaguePosition: form.leaguePosition === "" ? null : form.leaguePosition,
    };

    setIsSubmitting(true);
    try {
      await onSave(submissionForm as StatsForm);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(extractErrorMessage(err), { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!stat) return null;

  const isLeague = stat.competition?.type === "League";
  const competitionName = stat.competition?.name ?? "Competição";
  const resultLabel = isLeague
    ? form.leaguePosition === "" ? "Posição pendente" : `${form.leaguePosition}º lugar`
    : CUP_OPTIONS.find((opt) => opt.value === form.cupResult)?.label ?? "Resultado pendente";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-border bg-card p-0">
        <div className="border-b border-border bg-background/35 px-5 py-4">
          <DialogHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Trophy size={15} />
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Editar estatísticas
                  </span>
                </div>
                <DialogTitle className="truncate font-display text-2xl leading-none">
                  {competitionName}
                </DialogTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isLeague ? "Liga" : "Copa"} · {resultLabel}
                </p>
              </div>

              <div className="grid min-w-[210px] grid-cols-3 gap-2 rounded-md border border-border bg-card/80 p-2">
                <div className="text-center">
                  <p className="font-display text-xl font-bold text-primary">{derived.matches}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Jogos</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl font-bold text-[hsl(var(--warning))]">{derived.points}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pts</p>
                </div>
                <div className="text-center">
                  <p className={`font-display text-xl font-bold ${derived.goalDiff >= 0 ? "text-primary" : "text-destructive"}`}>
                    {derived.goalDiff > 0 ? `+${derived.goalDiff}` : derived.goalDiff}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Saldo</p>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(90vh-104px)] overflow-y-auto">
          <div className="space-y-5 p-5">
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Campanha</p>
                  <p className="mt-1 text-xs text-muted-foreground">Atualize o record principal da competição.</p>
                </div>
                <span className="rounded-md border border-border bg-background/30 px-2 py-1 font-display text-sm font-bold text-muted-foreground">
                  {derived.winRate}% aprov.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <NumberField label="Vitórias" value={form.wins} tone="primary" onChange={(v) => setForm({ ...form, wins: v })} />
                <NumberField label="Empates" value={form.draws} tone="warning" onChange={(v) => setForm({ ...form, draws: v })} />
                <NumberField label="Derrotas" value={form.losses} tone="destructive" onChange={(v) => setForm({ ...form, losses: v })} />
              </div>
            </section>

            <section>
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Gols</p>
                <p className="mt-1 text-xs text-muted-foreground">Use o placar agregado da competição inteira.</p>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                <NumberField
                  label="Marcados"
                  value={form.goalsPro}
                  icon={Target}
                  onChange={(v) => setForm({ ...form, goalsPro: v })}
                />
                <span className="mb-4 font-display text-xl font-bold text-muted-foreground">:</span>
                <NumberField
                  label="Sofridos"
                  value={form.goalsAgainst}
                  icon={ShieldAlert}
                  onChange={(v) => setForm({ ...form, goalsAgainst: v })}
                />
              </div>
            </section>

            <section>
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {isLeague ? "Tabela" : "Resultado final"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isLeague ? "Informe a colocação final ou atual." : "Escolha a fase atingida nesta copa."}
                </p>
              </div>

              {isLeague ? (
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Medal size={10} /> Posição
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-display text-sm font-bold text-muted-foreground">
                      #
                    </span>
                    <input
                      type="number"
                      className="w-full rounded-md border border-border bg-background/55 py-3 pl-8 pr-3 font-display text-2xl font-bold tabular-nums text-foreground outline-none transition-shadow focus:ring-1 focus:ring-primary"
                      value={form.leaguePosition}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          leaguePosition: e.target.value === "" ? "" : parseInt(e.target.value, 10),
                        })
                      }
                      min={1}
                      max={30}
                      placeholder="1"
                    />
                  </div>
                </label>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CUP_OPTIONS.map((opt) => {
                    const isSelected = form.cupResult === opt.value;
                    const isChampion = opt.value === "Campeao";
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm({ ...form, cupResult: opt.value })}
                        className={[
                          "min-h-[42px] rounded-md border px-3 py-2 text-left text-xs font-semibold transition-colors",
                          isSelected && isChampion
                            ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold))]"
                            : isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background/30 text-muted-foreground hover:text-foreground",
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border bg-background/35 p-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <X size={14} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 font-display text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar estatísticas
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StatsModal;
