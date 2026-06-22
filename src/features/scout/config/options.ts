import type { Fc26FitConfidence, Fc26FitObjective } from "@/shared/api/client";
import type { DraftFilters } from "@/features/scout/ui/types";
import { ATTRIBUTE_FILTER_FIELDS } from "./attributeFilters";

export const LIMIT_OPTIONS = ["20", "40", "60", "100"];

export const FOOT_LABELS: Record<"Left" | "Right", string> = {
  Left: "Left",
  Right: "Right",
};

export const FIT_OBJECTIVE_LABELS: Record<Fc26FitObjective, string> = {
  balanced: "Balanced",
  title: "Title contender",
  youth: "Youth development",
  rebuild: "Rebuild",
};

export const FIT_OBJECTIVE_OPTIONS: Array<{ value: Fc26FitObjective; label: string }> = [
  { value: "balanced", label: FIT_OBJECTIVE_LABELS.balanced },
  { value: "title", label: FIT_OBJECTIVE_LABELS.title },
  { value: "youth", label: FIT_OBJECTIVE_LABELS.youth },
  { value: "rebuild", label: FIT_OBJECTIVE_LABELS.rebuild },
];

export const FIT_CONFIDENCE_LABELS: Record<Fc26FitConfidence, string> = {
  high: "high confidence",
  medium: "medium confidence",
  low: "low confidence",
  none: "insufficient history",
};

export const PLAYSTYLE_OPTIONS = [
  "Acrobatic",
  "Aerial",
  "Anticipate",
  "Block",
  "Bruiser",
  "Chip Shot",
  "Dead Ball",
  "Finesse Shot",
  "First Touch",
  "Flair",
  "Incisive Pass",
  "Intercept",
  "Jockey",
  "Long Ball Pass",
  "Long Throw",
  "Pinged Pass",
  "Power Header",
  "Power Shot",
  "Press Proven",
  "Quick Step",
  "Rapid",
  "Relentless",
  "Slide Tackle",
  "Technical",
  "Tiki Taka",
  "Trivela",
  "Whipped Pass",
];

export const PLAYSTYLE_PLUS_OPTIONS = PLAYSTYLE_OPTIONS.map((playStyle) => `${playStyle} +`);

export const GENERAL_RATING_FIELDS = ["pace", "shooting", "passing", "dribbling", "defending", "physic"] as const;

export const COMPARISON_RADAR_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--gold))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
];

export const DEFAULT_APPLIED_FILTERS = {
  limit: 20,
  offset: 0,
};

export function createDefaultAttributeRanges(): Record<string, { min: string; max: string }> {
  return Object.fromEntries(ATTRIBUTE_FILTER_FIELDS.map((filter) => [filter.field, { min: "", max: "" }]));
}

export const createDefaultDraft = (): DraftFilters => ({
  primaryPositions: [],
  secondaryPositions: [],
  nations: [],
  leagues: [],
  clubs: [],
  minOvr: "",
  maxOvr: "",
  minAge: "",
  maxAge: "",
  minPotential: "",
  maxPotential: "",
  minMarketValue: "",
  maxMarketValue: "",
  preferredFoot: "",
  objective: "balanced",
  playStyles: [],
  playStylesPlus: [],
  attributeRanges: createDefaultAttributeRanges(),
  limit: "20",
});
