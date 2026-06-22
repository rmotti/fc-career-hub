import type { Fc26Player, Fc26FitConfidence } from "@/shared/api/client";
import type { Money } from "@/shared/lib/money";
import { m } from "@/shared/lib/money";
import { formatCurrencyInMillions, formatCurrencyInThousands } from "@/shared/lib/currency";
import { FOOT_LABELS, FIT_CONFIDENCE_LABELS, GENERAL_RATING_FIELDS } from "@/features/scout/config/options";

export function formatMarketValue(value: Money<"M"> | null | undefined) {
  if (value === null || value === undefined) return "—";
  return formatCurrencyInMillions(value);
}

export function formatWage(value: Money<"k"> | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${formatCurrencyInThousands(value)}/wk`;
}

export function formatRating(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : value;
}

export function formatHeight(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${value} cm`;
}

export function formatWeight(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${value} kg`;
}

export function formatPreferredFoot(value: Fc26Player["preferredFoot"]) {
  return value ? FOOT_LABELS[value] : "—";
}

export function formatStars(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${value}/5`;
}

export function formatPotentialGrowth(player: Fc26Player) {
  const growth = player.potential - player.ovr;
  return growth > 0 ? `+${growth}` : String(growth);
}

export function getGeneralRatingAverage(player: Fc26Player) {
  const values = GENERAL_RATING_FIELDS.map((field) => player[field]).filter((value): value is number => typeof value === "number");
  if (!values.length) return null;

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function formatAverageRating(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : value.toFixed(1);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

export function formatInteger(value: number) {
  return value.toLocaleString("pt-BR");
}

export function getVisibleFitScore(player: Pick<Fc26Player, "fitScore" | "fitConfidence">) {
  if (player.fitConfidence === "none") return null;
  if (typeof player.fitScore !== "number" || !Number.isFinite(player.fitScore)) return null;

  return Math.round(Math.min(Math.max(player.fitScore, 0), 1) * 100);
}

export function hasVisibleFitScore(player: Pick<Fc26Player, "fitScore" | "fitConfidence">) {
  return getVisibleFitScore(player) !== null;
}

export function getFitScoreTone(confidence: Fc26FitConfidence | null | undefined) {
  if (confidence === "low") return "border-warning/35 bg-warning/10 text-warning";
  if (confidence === "medium") return "border-accent/30 bg-accent/10 text-accent";
  return "border-primary/35 bg-primary/10 text-primary";
}

export function getFitScoreTitle(player: Pick<Fc26Player, "fitScore" | "fitConfidence" | "fitProfileSize">) {
  const score = getVisibleFitScore(player);
  if (score === null) return undefined;

  const confidence = player.fitConfidence ? FIT_CONFIDENCE_LABELS[player.fitConfidence] : "confidence not provided";
  const profileSize =
    typeof player.fitProfileSize === "number" && Number.isFinite(player.fitProfileSize)
      ? `, perfil com ${player.fitProfileSize} registro${player.fitProfileSize === 1 ? "" : "s"}`
      : "";

  return `Fit score ${score}/100, ${confidence}${profileSize}`;
}

export function getOvrClass(ovr: number) {
  if (ovr >= 88) return "text-gold";
  if (ovr >= 82) return "text-primary";
  if (ovr >= 76) return "text-accent";
  return "text-foreground";
}

export function formatFilterRange(label: string, min?: number, max?: number) {
  if (typeof min === "number" && typeof max === "number") return `${label}: ${min}-${max}`;
  if (typeof min === "number") return `${label}: ${min}+`;
  if (typeof max === "number") return `${label}: up to ${max}`;
  return null;
}

export function formatMarketValueFilterRange(min?: number, max?: number) {
  if (typeof min === "number" && typeof max === "number") return `Value: ${formatMarketValue(m(min))}-${formatMarketValue(m(max))}`;
  if (typeof min === "number") return `Value: ${formatMarketValue(m(min))}+`;
  if (typeof max === "number") return `Value: up to ${formatMarketValue(m(max))}`;
  return null;
}

export function formatSavedQueryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Undefined date";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function scoreToneClass(value: number | null) {
  if (value === null) return "text-muted-foreground";
  if (value >= 65) return "text-primary";
  if (value >= 45) return "text-yellow-400";
  return "text-muted-foreground";
}

export function formatScore(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}
