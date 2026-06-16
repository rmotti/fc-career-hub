import { useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Plus,
  Shield,
  Sliders,
  Star,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Slider } from "@/shared/ui/slider";
import { Switch } from "@/shared/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import {
  extractErrorMessage,
  type ApiPlaybook,
  type PlaybookObjective,
  type PlaybookPreferences,
  type PlaybookWeights,
} from "@/shared/api/client";
import {
  useCreatePlaybook,
  useDeletePlaybook,
  usePlaybooks,
  useSetDefaultPlaybook,
  useUpdatePlaybook,
} from "@/features/playbooks/model/usePlaybooks";

interface Props {
  saveId?: string | null;
  currentClub: string;
  currentSeason: string;
}

const OBJECTIVE_OPTIONS: Array<{ value: PlaybookObjective; label: string; color: string }> = [
  { value: "balanced", label: "Balanced", color: "text-primary bg-primary/10 border-primary/25" },
  { value: "title", label: "Title contender", color: "text-orange-400 bg-orange-400/10 border-orange-400/25" },
  { value: "youth", label: "Youth development", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25" },
  { value: "rebuild", label: "Rebuild", color: "text-blue-400 bg-blue-400/10 border-blue-400/25" },
];

const WEIGHT_COMPONENTS: Array<{ key: keyof PlaybookWeights; label: string; description: string; defaultVal: number }> = [
  { key: "overall", label: "Overall", description: "Player OVR (0–99)", defaultVal: 35 },
  { key: "potential", label: "Potential", description: "Player potential (0–99)", defaultVal: 20 },
  { key: "age", label: "Age", description: "Penalizes outside ideal range", defaultVal: 20 },
  { key: "historicalFit", label: "Historical fit", description: "ML score based on club/position", defaultVal: 25 },
  { key: "marketValue", label: "Market value", description: "Active only with limit defined", defaultVal: 0 },
  { key: "wage", label: "Wage", description: "Active only with limit defined", defaultVal: 0 },
];

const OBJECTIVE_AGE_DEFAULTS: Record<PlaybookObjective, { min: number; max: number }> = {
  balanced: { min: 21, max: 29 },
  title: { min: 24, max: 31 },
  youth: { min: 16, max: 23 },
  rebuild: { min: 18, max: 25 },
};

const OBJECTIVE_WEIGHT_PRESETS: Record<PlaybookObjective, Record<keyof PlaybookWeights, number>> = {
  balanced: { overall: 35, potential: 20, age: 20, historicalFit: 25, marketValue: 0, wage: 0 },
  title:    { overall: 45, potential: 15, age: 15, historicalFit: 25, marketValue: 0, wage: 0 },
  youth:    { overall: 15, potential: 35, age: 35, historicalFit: 15, marketValue: 0, wage: 0 },
  rebuild:  { overall: 25, potential: 30, age: 25, historicalFit: 20, marketValue: 0, wage: 0 },
};

interface FormState {
  name: string;
  objective: PlaybookObjective;
  weights: Record<keyof PlaybookWeights, string>;
  idealAgeMin: string;
  idealAgeMax: string;
  maxMarketValue: string;
  maxWage: string;
  isDefault: boolean;
}

function buildDefaultForm(): FormState {
  return {
    name: "",
    objective: "balanced",
    weights: { overall: "35", age: "20", historicalFit: "25", potential: "20", marketValue: "0", wage: "0" },
    idealAgeMin: "",
    idealAgeMax: "",
    maxMarketValue: "",
    maxWage: "",
    isDefault: false,
  };
}

function playbookToForm(p: ApiPlaybook): FormState {
  return {
    name: p.name,
    objective: p.preferences?.objective ?? "balanced",
    weights: {
      overall: String(p.weights?.overall ?? 0),
      age: String(p.weights?.age ?? 0),
      historicalFit: String(p.weights?.historicalFit ?? 0),
      potential: String(p.weights?.potential ?? 0),
      marketValue: String(p.weights?.marketValue ?? 0),
      wage: String(p.weights?.wage ?? 0),
    },
    idealAgeMin: p.preferences?.idealAgeMin != null ? String(p.preferences.idealAgeMin) : "",
    idealAgeMax: p.preferences?.idealAgeMax != null ? String(p.preferences.idealAgeMax) : "",
    maxMarketValue: p.preferences?.maxMarketValue != null ? String(p.preferences.maxMarketValue) : "",
    maxWage: p.preferences?.maxWage != null ? String(p.preferences.maxWage) : "",
    isDefault: p.isDefault ?? false,
  };
}

function formToApiPayload(form: FormState, saveId: string) {
  const weights: PlaybookWeights = {};
  for (const comp of WEIGHT_COMPONENTS) {
    const val = parseInt(form.weights[comp.key] ?? "0", 10);
    if (!isNaN(val) && val > 0) weights[comp.key] = val;
  }

  const preferences: PlaybookPreferences = { objective: form.objective };
  const ageMin = parseInt(form.idealAgeMin, 10);
  const ageMax = parseInt(form.idealAgeMax, 10);
  if (!isNaN(ageMin)) preferences.idealAgeMin = ageMin;
  if (!isNaN(ageMax)) preferences.idealAgeMax = ageMax;
  const mv = parseFloat(form.maxMarketValue);
  if (!isNaN(mv) && mv > 0) preferences.maxMarketValue = mv;
  const wage = parseFloat(form.maxWage);
  if (!isNaN(wage) && wage > 0) preferences.maxWage = wage;

  return { saveId, name: form.name.trim(), weights, preferences, isDefault: form.isDefault };
}

function getObjectiveOption(objective?: PlaybookObjective) {
  return OBJECTIVE_OPTIONS.find((o) => o.value === objective) ?? OBJECTIVE_OPTIONS[0];
}

function totalWeight(weights: Record<keyof PlaybookWeights, string>) {
  return WEIGHT_COMPONENTS.reduce((sum, comp) => {
    const v = parseInt(weights[comp.key] ?? "0", 10);
    return sum + (isNaN(v) || v < 0 ? 0 : v);
  }, 0);
}

function activeWeightCount(weights: Record<keyof PlaybookWeights, string>) {
  return WEIGHT_COMPONENTS.filter((comp) => {
    const v = parseInt(weights[comp.key] ?? "0", 10);
    return !isNaN(v) && v > 0;
  }).length;
}

// ─── SummaryPill ────────────────────────────────────────────────────

function SummaryPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2">
      {Icon && <Icon size={14} className="shrink-0 text-muted-foreground" />}
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="font-display text-sm font-bold leading-none text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ─── ObjectiveBadge ────────────────────────────────────────────────

function ObjectiveBadge({ objective }: { objective?: PlaybookObjective }) {
  const opt = getObjectiveOption(objective);
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${opt.color}`}
    >
      {opt.label}
    </span>
  );
}

// ─── WeightBar ──────────────────────────────────────────────────────

function WeightBar({ label, weight, total }: { label: string; weight: number; total: number }) {
  const pct = total > 0 ? Math.round((weight / total) * 100) : 0;
  const isActive = weight > 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground/50"}`}>{label}</p>
        <p className={`font-display text-xs font-bold ${isActive ? "text-foreground" : "text-muted-foreground/50"}`}>
          {isActive ? `${weight} pts` : "—"}
        </p>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${isActive ? "bg-primary" : "bg-transparent"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── PlaybookCard ──────────────────────────────────────────────────

interface PlaybookCardProps {
  playbook: ApiPlaybook;
  isSystem?: boolean;
  onEdit?: (playbook: ApiPlaybook) => void;
  onDelete?: (playbook: ApiPlaybook) => void;
  onSetDefault?: (playbook: ApiPlaybook) => void;
  settingDefault?: boolean;
}

function PlaybookCard({ playbook, isSystem, onEdit, onDelete, onSetDefault, settingDefault }: PlaybookCardProps) {
  const [expanded, setExpanded] = useState(false);
  const weights = playbook.weights ?? {};
  const total = Object.values(weights).reduce<number>((s, v) => s + (v ?? 0), 0);

  return (
    <div
      className={`card-gamer flex flex-col overflow-hidden ${
        isSystem
          ? "border-primary/30 shadow-[0_0_0_1px_hsl(var(--primary)/0.12)]"
          : ""
      } ${playbook.isDefault && !isSystem ? "border-primary/40 shadow-[0_0_0_1px_hsl(var(--primary)/0.18)]" : ""}`}
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-display text-base font-bold text-foreground">{playbook.name}</h3>
              {isSystem && (
                <span className="inline-flex items-center gap-1 rounded-md border border-muted/50 bg-muted/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Shield size={10} /> Sistema
                </span>
              )}
              {playbook.isDefault && !isSystem && (
                <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  <Star size={10} /> Default
                </span>
              )}
            </div>
            <div className="mt-1.5">
              <ObjectiveBadge objective={playbook.preferences?.objective} />
            </div>
          </div>

          {!isSystem && (
            <div className="flex shrink-0 items-center gap-1">
              {!playbook.isDefault && (
                <button
                  onClick={() => onSetDefault?.(playbook)}
                  disabled={settingDefault}
                  title="Set as default"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                >
                  {settingDefault ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                </button>
              )}
              <button
                onClick={() => onEdit?.(playbook)}
                title="Edit playbook"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete?.(playbook)}
                title="Delete playbook"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive-text"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {WEIGHT_COMPONENTS.filter((c) => (weights[c.key] ?? 0) > 0).map((comp) => (
            <WeightBar key={comp.key} label={comp.label} weight={weights[comp.key] ?? 0} total={total} />
          ))}
          {WEIGHT_COMPONENTS.filter((c) => (weights[c.key] ?? 0) > 0).length === 0 && (
            <p className="text-xs text-muted-foreground">No weights configured.</p>
          )}
        </div>
      </div>

      {(playbook.preferences?.idealAgeMin != null ||
        playbook.preferences?.idealAgeMax != null ||
        playbook.preferences?.maxMarketValue != null ||
        playbook.preferences?.maxWage != null) && (
        <div className="border-t border-border">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Preferences
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {expanded && (
            <div className="grid grid-cols-2 gap-2 px-4 pb-4 text-xs">
              {playbook.preferences?.idealAgeMin != null && (
                <Pref label="Min age" value={playbook.preferences.idealAgeMin} />
              )}
              {playbook.preferences?.idealAgeMax != null && (
                <Pref label="Max age" value={playbook.preferences.idealAgeMax} />
              )}
              {playbook.preferences?.maxMarketValue != null && (
                <Pref label="Max value" value={`€${playbook.preferences.maxMarketValue}M`} />
              )}
              {playbook.preferences?.maxWage != null && (
                <Pref label="Max wage" value={playbook.preferences.maxWage} />
              )}
            </div>
          )}
        </div>
      )}

      {!isSystem && playbook.updatedAt && (
        <div className="border-t border-border px-4 py-2">
          <p className="text-[10px] text-muted-foreground/60">
            Updated on {new Date(playbook.updatedAt).toLocaleDateString("en-US")}
          </p>
        </div>
      )}
    </div>
  );
}

function Pref({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-background/35 px-2.5 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-display text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

// ─── WeightInput ────────────────────────────────────────────────────

function WeightInput({
  label,
  description,
  value,
  onChange,
  totalWeight,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  totalWeight: number;
}) {
  const numVal = Math.max(0, parseInt(value, 10) || 0);
  const isActive = numVal > 0;
  const remaining = 100 - totalWeight; // budget left (can be negative if somehow over)
  const budgetExhausted = remaining <= 0 && numVal === 0;

  return (
    <div
      className={`rounded-md border p-3 transition-colors ${
        isActive ? "border-border bg-background/35" : "border-border/40 bg-background/15"
      } ${budgetExhausted ? "opacity-40" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-xs font-semibold ${isActive ? "text-foreground" : "text-muted-foreground/60"}`}>
            {label}
          </p>
          <p className="truncate text-[10px] text-muted-foreground/60">{description}</p>
        </div>
        <span
          className={`font-display text-xl font-bold leading-none tabular-nums ${
            isActive ? "text-foreground" : "text-muted-foreground/40"
          }`}
        >
          {numVal}
        </span>
      </div>
      <Slider
        value={[numVal]}
        onValueChange={([v]) => {
          // cap increase at budget; always allow decrease
          const capped = v > numVal ? Math.min(v, numVal + Math.max(0, remaining)) : v;
          onChange(String(capped));
        }}
        min={0}
        max={100}
        step={1}
        disabled={budgetExhausted}
        className="cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}

// ─── ObjectiveSelect ────────────────────────────────────────────────

function ObjectiveSelect({
  value,
  onChange,
}: {
  value: PlaybookObjective;
  onChange: (v: PlaybookObjective) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = getObjectiveOption(value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-background/35 px-3 py-2.5 text-sm transition-colors hover:border-primary/40"
      >
        <span className={`font-medium ${current.color.split(" ")[0]}`}>{current.label}</span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-card shadow-lg">
          {OBJECTIVE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent"
            >
              <span className={`font-medium ${opt.color.split(" ")[0]}`}>{opt.label}</span>
              {opt.value === value && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PlaybookSheet ──────────────────────────────────────────────────

interface PlaybookSheetProps {
  open: boolean;
  onClose: () => void;
  editingPlaybook: ApiPlaybook | null;
  saveId: string;
  form: FormState;
  onFormChange: (patch: Partial<FormState>) => void;
  onWeightChange: (key: keyof PlaybookWeights, value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

function PlaybookSheet({
  open,
  onClose,
  editingPlaybook,
  form,
  onFormChange,
  onWeightChange,
  onSubmit,
  isPending,
}: PlaybookSheetProps) {
  const total = totalWeight(form.weights);
  const active = activeWeightCount(form.weights);
  const isEditing = editingPlaybook !== null;
  const budgetWeightsActive =
    parseInt(form.weights.marketValue ?? "0", 10) > 0 ||
    parseInt(form.weights.wage ?? "0", 10) > 0;

  const handleObjectiveChange = (objective: PlaybookObjective) => {
    const ageDefaults = OBJECTIVE_AGE_DEFAULTS[objective];
    const weightPreset = OBJECTIVE_WEIGHT_PRESETS[objective];
    const patches: Partial<FormState> = {
      objective,
      weights: Object.fromEntries(
        Object.entries(weightPreset).map(([k, v]) => [k, String(v)])
      ) as FormState["weights"],
    };
    if (!form.idealAgeMin) patches.idealAgeMin = String(ageDefaults.min);
    if (!form.idealAgeMax) patches.idealAgeMax = String(ageDefaults.max);
    onFormChange(patches);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full max-w-[480px] flex-col overflow-hidden p-0"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="font-display text-lg">
              {isEditing ? "Edit playbook" : "New playbook"}
            </SheetTitle>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X size={15} />
            </button>
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1" viewportClassName="px-5 py-4" scrollbars="vertical">
          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Name *
              </label>
              <Input
                placeholder="E.g.: Youth focus, Title hunt..."
                value={form.name}
                maxLength={80}
                onChange={(e) => onFormChange({ name: e.target.value })}
              />
              <p className="text-right text-[10px] text-muted-foreground/60">{form.name.length}/80</p>
            </div>

            {/* Objective */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Objective
              </label>
              <ObjectiveSelect value={form.objective} onChange={handleObjectiveChange} />
            </div>

            {/* Weights */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Weights
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                      total > 0
                        ? "border-primary/25 bg-primary/10 text-primary"
                        : "border-destructive/25 bg-destructive/10 text-destructive-text"
                    }`}
                  >
                    Total: {total} pts
                  </span>
                  <span className="rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground">
                    {active} active
                  </span>
                </div>
              </div>

              {total === 0 && (
                <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs text-destructive-text">
                  At least one weight must be greater than zero.
                </p>
              )}

              <div className="space-y-2">
                {WEIGHT_COMPONENTS.map((comp) => (
                  <WeightInput
                    key={comp.key}
                    label={comp.label}
                    description={comp.description}
                    value={form.weights[comp.key]}
                    onChange={(v) => onWeightChange(comp.key, v)}
                    totalWeight={total}
                  />
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground/60">
                The backend normalizes automatically — the sum does not need to be 100.
              </p>
            </div>

            {/* Age range */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Ideal age range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-[10px] text-muted-foreground">Minimum</p>
                  <Input
                    type="number"
                    min={15}
                    max={45}
                    placeholder={String(OBJECTIVE_AGE_DEFAULTS[form.objective].min)}
                    value={form.idealAgeMin}
                    onChange={(e) => onFormChange({ idealAgeMin: e.target.value })}
                  />
                </div>
                <div>
                  <p className="mb-1 text-[10px] text-muted-foreground">Maximum</p>
                  <Input
                    type="number"
                    min={15}
                    max={45}
                    placeholder={String(OBJECTIVE_AGE_DEFAULTS[form.objective].max)}
                    value={form.idealAgeMax}
                    onChange={(e) => onFormChange({ idealAgeMax: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Budget (only relevant if marketValue/wage weights active) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Budget
                </label>
                {!budgetWeightsActive && (
                  <span className="text-[10px] text-muted-foreground/60">
                    Enable market/wage weights to take effect
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-[10px] text-muted-foreground">Max value (M€)</p>
                  <Input
                    type="number"
                    min={0}
                    placeholder="E.g.: 30"
                    value={form.maxMarketValue}
                    onChange={(e) => onFormChange({ maxMarketValue: e.target.value })}
                    disabled={!budgetWeightsActive}
                  />
                </div>
                <div>
                  <p className="mb-1 text-[10px] text-muted-foreground">Max wage</p>
                  <Input
                    type="number"
                    min={0}
                    placeholder="FC26 format"
                    value={form.maxWage}
                    onChange={(e) => onFormChange({ maxWage: e.target.value })}
                    disabled={!budgetWeightsActive}
                  />
                </div>
              </div>
            </div>

            {/* Set as default */}
            <div className="flex items-center justify-between rounded-md border border-border bg-background/35 px-3 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Set as default</p>
                <p className="text-xs text-muted-foreground">
                  Used automatically in scout searches
                </p>
              </div>
              <Switch
                checked={form.isDefault}
                onCheckedChange={(v) => onFormChange({ isDefault: v })}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isPending || !form.name.trim() || total === 0}
            className="min-w-[140px]"
          >
            {isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : isEditing ? (
              "Save changes"
            ) : (
              "Create playbook"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── PlaybooksScreen ────────────────────────────────────────────────

export default function PlaybooksScreen({ saveId, currentClub, currentSeason }: Props) {
  const { data, isLoading, isError, error } = usePlaybooks(saveId ?? null);
  const createMutation = useCreatePlaybook();
  const updateMutation = useUpdatePlaybook();
  const deleteMutation = useDeletePlaybook();
  const setDefaultMutation = useSetDefaultPlaybook();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState<ApiPlaybook | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiPlaybook | null>(null);
  const [form, setForm] = useState<FormState>(buildDefaultForm);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const defaultPlaybook = data?.defaultPlaybook;
  const userPlaybooks = data?.playbooks ?? [];

  const openCreate = () => {
    setEditingPlaybook(null);
    setForm(buildDefaultForm());
    setSheetOpen(true);
  };

  const openEdit = (playbook: ApiPlaybook) => {
    setEditingPlaybook(playbook);
    setForm(playbookToForm(playbook));
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingPlaybook(null);
  };

  const handleFormChange = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleWeightChange = (key: keyof PlaybookWeights, value: string) => {
    setForm((prev) => ({
      ...prev,
      weights: { ...prev.weights, [key]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!saveId) return;
    const payload = formToApiPayload(form, saveId);

    try {
      if (editingPlaybook?.id) {
        await updateMutation.mutateAsync({
          saveId,
          playbookId: editingPlaybook.id,
          data: { name: payload.name, weights: payload.weights, preferences: payload.preferences, isDefault: payload.isDefault },
        });
        toast.success("Playbook updated.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Playbook created.");
      }
      closeSheet();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleSetDefault = async (playbook: ApiPlaybook) => {
    if (!saveId || !playbook.id) return;
    setSettingDefaultId(playbook.id);
    try {
      await setDefaultMutation.mutateAsync({ saveId, playbookId: playbook.id });
      toast.success(`"${playbook.name}" set as default playbook.`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!saveId || !deleteTarget?.id) return;
    try {
      await deleteMutation.mutateAsync({ saveId, playbookId: deleteTarget.id });
      toast.success(`"${deleteTarget.name}" deleted.`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeleteTarget(null);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {currentClub} · {currentSeason} · PRO
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-3xl font-bold leading-none tracking-tight text-foreground">
              Playbooks
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Sliders size={13} />
              Evaluation profiles
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <SummaryPill label="Playbooks" value={userPlaybooks.length} icon={BookOpen} />
          <SummaryPill
            label="Ativo"
            value={userPlaybooks.find((p) => p.isDefault)?.name ?? "System default"}
            icon={Star}
          />
          <SummaryPill
            label="Default objective"
            value={getObjectiveOption(userPlaybooks.find((p) => p.isDefault)?.preferences?.objective ?? defaultPlaybook?.preferences?.objective).label}
            icon={Target}
          />
          <Button onClick={openCreate} size="sm" className="gap-1.5">
            <Plus size={15} />
            New playbook
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          Loading playbooks...
        </div>
      ) : isError ? (
        <div className="rounded-md border border-destructive/25 bg-destructive/10 p-5 text-sm text-destructive-text">
          {extractErrorMessage(error)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* System default */}
          {defaultPlaybook && (
            <section className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                System default
              </p>
              <div className="max-w-sm">
                <PlaybookCard playbook={defaultPlaybook} isSystem />
              </div>
            </section>
          )}

          {/* User playbooks */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Your playbooks
              </p>
              {userPlaybooks.length > 0 && (
                <p className="text-xs text-muted-foreground">{userPlaybooks.length} created</p>
              )}
            </div>

            {userPlaybooks.length === 0 ? (
              <button
                onClick={openCreate}
                className="card-gamer flex w-full max-w-sm flex-col items-center gap-3 rounded-lg border border-dashed border-border/60 p-8 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/30 text-muted-foreground">
                  <Plus size={22} />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-foreground">Create first playbook</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Configure custom weights to score players in the scout.
                  </p>
                </div>
              </button>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {userPlaybooks.map((playbook) => (
                  <PlaybookCard
                    key={playbook.id}
                    playbook={playbook}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                    onSetDefault={handleSetDefault}
                    settingDefault={settingDefaultId === playbook.id}
                  />
                ))}
                <button
                  onClick={openCreate}
                  className="card-gamer flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 p-8 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/30 text-muted-foreground">
                    <Plus size={18} />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">New playbook</p>
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Create/Edit Sheet */}
      <PlaybookSheet
        open={sheetOpen}
        onClose={closeSheet}
        editingPlaybook={editingPlaybook}
        saveId={saveId ?? ""}
        form={form}
        onFormChange={handleFormChange}
        onWeightChange={handleWeightChange}
        onSubmit={handleSubmit}
        isPending={isPending}
      />

      {/* Delete confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete playbook?</AlertDialogTitle>
            <AlertDialogDescription>
              The playbook <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong> will be permanently deleted.
              {deleteTarget?.isDefault && (
                <span className="mt-1 block text-orange-400">
                  Warning: this is the save's default playbook. The system will revert to the global default.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
