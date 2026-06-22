import type { ElementType, ReactNode } from "react";
import type { Fc26FitObjective, Fc26Player, Fc26PlayerFilters, PlayerPosition } from "@/shared/api/client";

export type ScoutSection = "ai" | "filters" | "archive" | "shortlist";

export type AttributeRangeDraft = Record<string, { min: string; max: string }>;

export type DraftFilters = {
  primaryPositions: PlayerPosition[];
  secondaryPositions: PlayerPosition[];
  nations: string[];
  leagues: string[];
  clubs: string[];
  minOvr: string;
  maxOvr: string;
  minAge: string;
  maxAge: string;
  minPotential: string;
  maxPotential: string;
  minMarketValue: string;
  maxMarketValue: string;
  preferredFoot: "" | "Left" | "Right";
  objective: Fc26FitObjective;
  playStyles: string[];
  playStylesPlus: string[];
  attributeRanges: AttributeRangeDraft;
  limit: string;
};

export type AppliedScoutFilters = Fc26PlayerFilters & {
  primaryPositions?: PlayerPosition[];
  secondaryPositions?: PlayerPosition[];
};

export type SavedScoutQuerySource = "assistant" | "manual";

export interface SavedScoutQuery {
  id: string;
  title: string;
  description: string;
  source: SavedScoutQuerySource;
  club: string;
  season: string;
  createdAt: string;
  filters: AppliedScoutFilters;
  results: Fc26Player[];
  total: number;
}

export interface ShortlistPositionGroup {
  position: PlayerPosition;
  players: Fc26Player[];
}

export type ScoutSortBy = NonNullable<Fc26PlayerFilters["sortBy"]>;
export type ScoutSortOrder = NonNullable<Fc26PlayerFilters["sortOrder"]>;

export type ComparisonDirection = "higher" | "lower";

export interface ComparisonMetricConfig {
  label: string;
  render: (player: Fc26Player) => ReactNode;
  score?: (player: Fc26Player) => number | null | undefined;
  better?: ComparisonDirection;
}

export interface PlayerComparisonGroupConfig {
  title: string;
  icon: ElementType;
  metrics: ComparisonMetricConfig[];
}
