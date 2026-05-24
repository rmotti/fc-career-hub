import { useEffect, useState, type FormEvent } from "react";
import type React from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  BadgeEuro,
  BarChart3,
  CircleDollarSign,
  IdCard,
  Loader2,
  Save,
  ShieldCheck,
  Shirt,
  Target,
  UserRound,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { type ApiPlayer, type PlayerPosition, extractErrorMessage } from "@/shared/api/client";
import { useUpdatePlayerStats } from "@/features/squad/model/usePlayers";
import { toast } from "sonner";
import { getBadge } from "@/entities/player/model/playerBadge";
import Flag from "react-world-flags";
import { COUNTRIES } from "@/shared/lib/countries";
import { PLAYER_POSITIONS, getAlternativePositions, normalizeAlternativePositions } from "@/shared/lib/playerPositions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: ApiPlayer | null;
  onSave: (data: any, playerId?: string) => Promise<void>;
  saveId: string;
}

const CLEAN_SHEETS_POSITIONS = new Set(["GOL", "ZAG", "LD", "LE", "VOL"]);

const EMPTY_PLAYER = {
  name: "", nation: "" as string, position: "MC" as string, age: 20 as number | "", status: "Important" as string, ovr: 70 as number | "",
  alternativePositions: [] as PlayerPosition[],
  salary: "" as number | "", marketValue: "" as number | "",
  potential: "" as number | "", shirtNumber: "" as number | "",
  goals: 0 as number | "", assists: 0 as number | "", yellowCards: 0 as number | "", redCards: 0 as number | "", matches: 0 as number | "", cleanSheets: 0 as number | "",
};

const inputClass = "h-10 w-full rounded-md border border-border bg-background/40 px-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary/60 focus:ring-1 focus:ring-primary/30 disabled:opacity-60";
const labelClass = "mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground";

const PlayerModal = ({ open, onOpenChange, player, onSave, saveId }: Props) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_PLAYER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!player;
  const updateStats = useUpdatePlayerStats();
  const badge = player ? getBadge(player) : null;
  const selectedCountry = COUNTRIES.find((country) => country.code === form.nation);

  useEffect(() => {
    if (open) {
      if (player) {
        const stats = player.currentSeasonStats || player.totalStats;
        setForm({
          name: player.name,
          nation: player.nation ?? "",
          position: player.position,
          alternativePositions: getAlternativePositions(player),
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const { alternativePositions, ...baseForm } = form;
    const submissionForm = {
      ...baseForm,
      alternativePosition: {
        positions: normalizeAlternativePositions(alternativePositions, form.position),
      },
      nation: form.nation === "" ? undefined : form.nation,
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

    const statsChanged = player ? (() => {
      const stats = player.currentSeasonStats || player.totalStats;
      return (
        form.goals !== (stats?.goals ?? 0) ||
        form.assists !== (stats?.assists ?? 0) ||
        form.yellowCards !== (stats?.yellowCards ?? 0) ||
        form.redCards !== (stats?.redCards ?? 0) ||
        form.matches !== (stats?.matches ?? 0) ||
        form.cleanSheets !== (stats?.cleanSheets ?? 0)
      );
    })() : false;

    const previousAlternativePositions = player ? getAlternativePositions(player) : [];
    const alternativePositionsChanged = player ? (
      submissionForm.alternativePosition.positions.length !== previousAlternativePositions.length ||
      submissionForm.alternativePosition.positions.some((position, index) => position !== previousAlternativePositions[index])
    ) : true;

    const playerDataChanged = player ? (
      form.name !== player.name ||
      form.nation !== (player.nation ?? "") ||
      form.position !== player.position ||
      alternativePositionsChanged ||
      form.age !== player.age ||
      form.status !== player.status ||
      form.ovr !== player.ovr ||
      form.salary !== (player.salary ?? "") ||
      form.marketValue !== (player.marketValue ?? "") ||
      form.potential !== (player.potential ?? "") ||
      form.shirtNumber !== (player.shirtNumber ?? "")
    ) : true;

    setIsSubmitting(true);
    try {
      if (!player || playerDataChanged) {
        await onSave(submissionForm, player?.id);
      }

      if (player && statsChanged) {
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
        toast.success("Stats updated!", { duration: 3000 });
      }
      setForm(EMPTY_PLAYER);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(extractErrorMessage(err), { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent data-tour="player-modal" className="max-w-4xl border-border bg-card p-0" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="border-b border-border px-6 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {isEdit ? t("playerModal.editTitle") : t("playerModal.addTitle")}
          </p>
          <DialogTitle className="font-display text-2xl leading-none">
            {isEdit ? t("playerModal.editTitle") : t("playerModal.addTitle")}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            Player data, season stats and market information in one place.
            {badge && (
              <span
                className="rounded px-2 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: badge.color + "22", color: badge.color, border: `1px solid ${badge.color}44` }}
              >
                {badge.icon} {badge.label}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5">
          <fieldset className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.9fr]" disabled={isSubmitting}>
            <FormSection dataTour="player-modal-identity" icon={UserRound} title="Identity">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.35fr]">
                <Field label="Name">
                  <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </Field>
                <Field label="Nation">
                  <Select value={form.nation || "none"} onValueChange={(value) => setForm({ ...form, nation: value === "none" ? "" : value })}>
                    <SelectTrigger className="h-10 border-border bg-background/40 text-left text-sm text-foreground transition-colors hover:border-primary/40 focus:ring-primary/30 [&>span:first-child]:!flex [&>span:first-child]:min-w-0 [&>span:first-child]:flex-1 [&>span:first-child]:items-center [&>span:first-child]:justify-start">
                      {selectedCountry ? (
                        <span className="flex min-w-0 items-center justify-start gap-2 text-left">
                          <Flag code={selectedCountry.code} style={{ width: 20, height: 14, borderRadius: 3, objectFit: "cover" }} />
                          <span className="truncate">{selectedCountry.name}</span>
                        </span>
                      ) : (
                        <SelectValue placeholder="Select" />
                      )}
                    </SelectTrigger>
                    <SelectContent className="max-h-72 border-border bg-card text-foreground shadow-xl shadow-black/30">
                      <SelectItem value="none" className="text-muted-foreground focus:bg-muted focus:text-foreground">
                        Select
                      </SelectItem>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code} className="focus:bg-primary/10 focus:text-primary">
                          <span className="flex min-w-0 items-center gap-2">
                            <Flag code={country.code} style={{ width: 18, height: 13, borderRadius: 2, objectFit: "cover" }} />
                            <span className="truncate">{country.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-[0.85fr_1.35fr_0.8fr_0.8fr]">
                <Field label="Position" icon={Shirt}>
                  <Select
                    value={form.position}
                    onValueChange={(value) => setForm({
                      ...form,
                      position: value,
                      alternativePositions: normalizeAlternativePositions(form.alternativePositions, value),
                    })}
                  >
                    <SelectTrigger className="h-10 border-border bg-background/40 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 focus:ring-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card text-foreground shadow-xl shadow-black/30">
                      {PLAYER_POSITIONS.map((pos) => (
                        <SelectItem key={pos} value={pos} className="font-semibold focus:bg-primary/10 focus:text-primary">
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status" icon={IdCard}>
                  <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                    <SelectTrigger className="h-10 min-w-0 border-border bg-background/40 text-sm text-foreground transition-colors hover:border-primary/40 focus:ring-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card text-foreground shadow-xl shadow-black/30">
                      <SelectItem value="Crucial" className="focus:bg-primary/10 focus:text-primary">{t("playerModal.status.Crucial")}</SelectItem>
                      <SelectItem value="Important" className="focus:bg-primary/10 focus:text-primary">{t("playerModal.status.Important")}</SelectItem>
                      <SelectItem value="Role" className="focus:bg-primary/10 focus:text-primary">{t("playerModal.status.Role")}</SelectItem>
                      <SelectItem value="Sporadic" className="focus:bg-primary/10 focus:text-primary">{t("playerModal.status.Sporadic")}</SelectItem>
                      <SelectItem value="Promising" className="focus:bg-primary/10 focus:text-primary">{t("playerModal.status.Promising")}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Age">
                  <input type="number" className={inputClass} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value === "" ? "" : parseInt(e.target.value) })} min={15} max={45} />
                </Field>
                <Field label="Shirt">
                  <input type="number" className={inputClass} value={form.shirtNumber} onChange={(e) => setForm({ ...form, shirtNumber: e.target.value === "" ? "" : parseInt(e.target.value) })} min={1} max={99} placeholder="—" />
                </Field>
              </div>

              {form.position !== "GOL" && (
                <Field label="Alternative positions">
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {PLAYER_POSITIONS.filter((pos) => pos !== form.position && pos !== "GOL").map((pos) => {
                      const isSelected = form.alternativePositions.includes(pos);

                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => {
                            const nextPositions = isSelected
                              ? form.alternativePositions.filter((position) => position !== pos)
                              : [...form.alternativePositions, pos];
                            setForm({
                              ...form,
                              alternativePositions: normalizeAlternativePositions(nextPositions, form.position),
                            });
                          }}
                          className={`h-9 rounded-md border text-xs font-bold transition-[background-color,border-color,color,transform] active:scale-[0.97] ${
                            isSelected
                              ? "border-primary/45 bg-primary/15 text-primary"
                              : "border-border bg-background/35 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                          }`}
                          aria-pressed={isSelected}
                        >
                          {pos}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              )}
            </FormSection>

            <FormSection dataTour="player-modal-development" icon={Activity} title="Development" compact>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Current OVR">
                  <input type="number" className={inputClass} value={form.ovr} onChange={(e) => setForm({ ...form, ovr: e.target.value === "" ? "" : parseInt(e.target.value) })} min={40} max={99} />
                </Field>
                <Field label="Potential">
                  <input type="number" className={inputClass} value={form.potential} onChange={(e) => setForm({ ...form, potential: e.target.value === "" ? "" : parseInt(e.target.value) })} min={40} max={99} placeholder="—" />
                </Field>
              </div>
            </FormSection>

            <FormSection dataTour="player-modal-stats" icon={BarChart3} title="Season Stats">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Field label="Apps">
                  <input type="number" className={inputClass} value={form.matches} onChange={(e) => setForm({ ...form, matches: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
                </Field>
                <Field label="Goals" icon={Target}>
                  <input type="number" className={inputClass} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
                </Field>
                <Field label="Assists">
                  <input type="number" className={inputClass} value={form.assists} onChange={(e) => setForm({ ...form, assists: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
                </Field>
                {CLEAN_SHEETS_POSITIONS.has(form.position) && (
                  <Field label="Clean sheets" icon={ShieldCheck}>
                    <input type="number" className={inputClass} value={form.cleanSheets} onChange={(e) => setForm({ ...form, cleanSheets: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
                  </Field>
                )}
                <Field label="Yellow cards">
                  <input type="number" className={inputClass} value={form.yellowCards} onChange={(e) => setForm({ ...form, yellowCards: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
                </Field>
                <Field label="Red cards">
                  <input type="number" className={inputClass} value={form.redCards} onChange={(e) => setForm({ ...form, redCards: e.target.value === "" ? "" : parseInt(e.target.value) })} min={0} />
                </Field>
              </div>
            </FormSection>

            <FormSection dataTour="player-modal-market" icon={CircleDollarSign} title="Market" compact>
              <div className="grid grid-cols-1 gap-3">
                <Field label="Weekly salary" icon={BadgeEuro}>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min={0}
                      className={`${inputClass} pr-11`}
                      value={form.salary ?? ""}
                      onChange={(e) => setForm({ ...form, salary: e.target.value ? parseFloat(e.target.value) : "" })}
                      placeholder="75"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">K€</span>
                  </div>
                </Field>
                <Field label="Market value">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      className={`${inputClass} pr-11`}
                      value={form.marketValue ?? ""}
                      onChange={(e) => setForm({ ...form, marketValue: e.target.value ? parseFloat(e.target.value) : "" })}
                      placeholder="35"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">M€</span>
                  </div>
                </Field>
              </div>
            </FormSection>

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end lg:col-span-2">
              <button
                data-tour="player-modal-cancel"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-md bg-muted px-5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <X size={14} />
                {t("common.cancel")}
              </button>
              <button
                data-tour="player-modal-save"
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-[opacity,transform] hover:opacity-90 active:scale-[0.97] disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={15} />}
                {isEdit ? t("common.save") : t("playerModal.addTitle")}
              </button>
            </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
};

function FormSection({
  icon: Icon,
  title,
  children,
  compact = false,
  dataTour,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  compact?: boolean;
  dataTour?: string;
}) {
  return (
    <section data-tour={dataTour} className={`rounded-lg border border-border bg-muted/20 p-4 ${compact ? "lg:self-start" : ""}`}>
      <div className="mb-4 flex items-center gap-2">
        <Icon size={15} className="text-primary" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>
        {Icon && <Icon size={12} className="mr-1 inline text-muted-foreground" />}
        {label}
      </label>
      {children}
    </div>
  );
}

export default PlayerModal;
