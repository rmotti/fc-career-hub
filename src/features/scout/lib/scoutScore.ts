import { createContext, useContext } from "react";
import type { ApiPlaybook, Fc26Player } from "@/shared/api/client";
import { FIT_CONFIDENCE_LABELS } from "@/features/scout/config/options";
import { formatMarketValue, formatWage, scoreToneClass as _scoreToneClass } from "./format";
import { k, m } from "@/shared/lib/money";

export interface ScoutScoreContextValue {
  budgetMillions: number | null;
  openBreakdown: (player: Fc26Player) => void;
}

export const ScoutScoreContext = createContext<ScoutScoreContextValue>({
  budgetMillions: null,
  openBreakdown: () => {},
});

export function useScoutScoreContext() {
  return useContext(ScoutScoreContext);
}

export type ScoutComponentKey = "overall" | "potential" | "age" | "historicalFit" | "marketValue" | "wage";

export interface ScoutScoreComponent {
  key: ScoutComponentKey;
  label: string;
  help: string;
  weight: number;
  share: number | null;
  score: number | null;
  weightedScore: number | null;
  valueLabel: string;
  available: boolean;
  reason?: string;
}

export interface ScoutScoreResult {
  score: number | null;
  components: ScoutScoreComponent[];
}

export const SCOUT_COMPONENT_META: Record<ScoutComponentKey, { label: string; help: string }> = {
  overall: { label: "Overall", help: "Normalized level (OVR 50→0, 95→100)" },
  potential: { label: "Potential", help: "Normalized ceiling (POT 50→0, 95→100)" },
  age: { label: "Age", help: "Younger scores higher (fixed curve)" },
  historicalFit: { label: "Historical fit", help: "Percentil de fit (0–100; 50 ≈ contratação típica do clube nesta posição)" },
  marketValue: { label: "Market value", help: "Budget slack — cheaper scores higher" },
  wage: { label: "Wage", help: "Opt-in — needs a max wage" },
};

const clampScore = (value: number) => Math.max(0, Math.min(100, value));

export function ageCurveScore(age: number) {
  return clampScore(100 - 1.04 * Math.pow(Math.max(0, age - 16), 1.45));
}

export function buildScoutScore(
  player: Fc26Player,
  playbook: ApiPlaybook | null | undefined,
  budgetMillions?: number | null,
): ScoutScoreResult {
  if (!playbook) return { score: null, components: [] };
  const weights = playbook.weights ?? {};
  const prefs = playbook.preferences ?? {};

  type Raw = Pick<ScoutScoreComponent, "key" | "weight" | "score" | "valueLabel" | "available" | "reason">;
  const raw: Raw[] = [];

  if ((weights.overall ?? 0) > 0) {
    raw.push({
      key: "overall",
      weight: weights.overall!,
      score: clampScore(((player.ovr - 50) / 45) * 100),
      valueLabel: `${player.ovr} OVR`,
      available: true,
    });
  }
  if ((weights.potential ?? 0) > 0) {
    if (player.potential != null) {
      raw.push({
        key: "potential",
        weight: weights.potential!,
        score: clampScore(((player.potential - 50) / 45) * 100),
        valueLabel: `${player.potential} POT`,
        available: true,
      });
    } else {
      raw.push({ key: "potential", weight: weights.potential!, score: null, valueLabel: "—", available: false, reason: "Potential unknown for this player." });
    }
  }
  if ((weights.age ?? 0) > 0) {
    raw.push({ key: "age", weight: weights.age!, score: ageCurveScore(player.age), valueLabel: `${player.age} yo`, available: true });
  }
  if ((weights.historicalFit ?? 0) > 0) {
    const fitLoaded = typeof player.fitScore === "number" && Number.isFinite(player.fitScore);
    if (player.fitConfidence === "none") {
      raw.push({ key: "historicalFit", weight: weights.historicalFit!, score: 0, valueLabel: "No profile", available: true, reason: "No historical profile yet — counts as 0." });
    } else if (fitLoaded) {
      const fitPct = Math.round(clampScore(player.fitScore!));
      const lowConfidence = player.fitConfidence && player.fitConfidence !== "high";
      raw.push({
        key: "historicalFit",
        weight: weights.historicalFit!,
        score: fitPct,
        valueLabel: `${fitPct}% fit`,
        available: true,
        reason: lowConfidence ? `Low-confidence fit (${FIT_CONFIDENCE_LABELS[player.fitConfidence!]}).` : undefined,
      });
    } else {
      raw.push({ key: "historicalFit", weight: weights.historicalFit!, score: null, valueLabel: "Not loaded", available: false, reason: "Fit isn't loaded for this player — open it from a scout search to include it." });
    }
  }
  if ((weights.marketValue ?? 0) > 0) {
    const capMillions = prefs.maxMarketValue ?? budgetMillions ?? null;
    if (player.marketValue != null && capMillions && capMillions > 0) {
      raw.push({
        key: "marketValue",
        weight: weights.marketValue!,
        score: clampScore(100 * (1 - player.marketValue / capMillions)),
        valueLabel: `${formatMarketValue(player.marketValue)} of ${formatMarketValue(m(capMillions))}`,
        available: true,
      });
    } else if (player.marketValue == null) {
      raw.push({ key: "marketValue", weight: weights.marketValue!, score: null, valueLabel: "—", available: false, reason: "No market value on record." });
    } else {
      raw.push({ key: "marketValue", weight: weights.marketValue!, score: null, valueLabel: formatMarketValue(player.marketValue), available: false, reason: "Set a max value, or open a save with a budget, to score market value." });
    }
  }
  if ((weights.wage ?? 0) > 0) {
    if (prefs.maxWage && prefs.maxWage > 0 && player.wage != null) {
      raw.push({
        key: "wage",
        weight: weights.wage!,
        score: clampScore(100 * (1 - player.wage / prefs.maxWage)),
        valueLabel: `${formatWage(player.wage)} of ${formatWage(k(prefs.maxWage))}`,
        available: true,
      });
    } else {
      raw.push({ key: "wage", weight: weights.wage!, score: null, valueLabel: player.wage != null ? formatWage(player.wage) : "—", available: false, reason: "Set a max wage in the playbook to evaluate wage." });
    }
  }

  const availableWeight = raw.reduce((s, r) => s + (r.available ? r.weight : 0), 0);
  const components: ScoutScoreComponent[] = raw.map((r) => {
    const share = r.available && availableWeight > 0 ? (r.weight / availableWeight) * 100 : null;
    const weightedScore = share != null && r.score != null ? (share / 100) * r.score : null;
    return { ...r, label: SCOUT_COMPONENT_META[r.key].label, help: SCOUT_COMPONENT_META[r.key].help, share, weightedScore };
  });
  const score = availableWeight > 0 ? Math.round(components.reduce((s, c) => s + (c.weightedScore ?? 0), 0)) : null;
  return { score, components };
}

export function computeScoutScore(
  player: Fc26Player,
  playbook: ApiPlaybook | null | undefined,
  budgetMillions?: number | null,
): number | null {
  return buildScoutScore(player, playbook, budgetMillions).score;
}
