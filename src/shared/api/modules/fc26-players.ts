import { type Money } from "@/shared/lib/money";
import { appendCsvParam, appendNumberParam, request } from "../http";
import { type PlayerPosition } from "./players";

export type Fc26PlayerPosition = PlayerPosition;
export type Fc26FitObjective = "balanced" | "title" | "youth" | "rebuild";
export type Fc26FitConfidence = "high" | "medium" | "low" | "none";
export type Fc26PlayerSortBy = "ovr" | "potential" | "fitScore";

export interface Fc26Player {
  id: number;
  sofifaId: number;
  name: string;
  positions: Fc26PlayerPosition[];
  age: number;
  ovr: number;
  potential: number;
  marketValue: Money<"M"> | null;
  nation: string | null;
  club: string | null;
  league: string | null;
  wage: Money<"k"> | null;
  longName: string | null;
  dob: string | null;
  height: number | null;
  weight: number | null;
  playerFaceUrl: string | null;
  contractUntil: number | null;
  releaseClause: Money<"M"> | null;
  preferredFoot: "Right" | "Left" | null;
  weakFoot: number | null;
  skillMoves: number | null;
  internationalReputation: number | null;
  workRate: string | null;
  bodyType: string | null;
  playerTags: string[];
  playerTraits: string[];
  pace: number | null;
  shooting: number | null;
  passing: number | null;
  dribbling: number | null;
  defending: number | null;
  physic: number | null;
  attackingCrossing: number | null;
  attackingFinishing: number | null;
  attackingHeadingAccuracy: number | null;
  attackingShortPassing: number | null;
  attackingVolleys: number | null;
  skillDribbling: number | null;
  skillCurve: number | null;
  skillFkAccuracy: number | null;
  skillLongPassing: number | null;
  skillBallControl: number | null;
  movementAcceleration: number | null;
  movementSprintSpeed: number | null;
  movementAgility: number | null;
  movementReactions: number | null;
  movementBalance: number | null;
  powerShotPower: number | null;
  powerJumping: number | null;
  powerStamina: number | null;
  powerStrength: number | null;
  powerLongShots: number | null;
  mentalityAggression: number | null;
  mentalityInterceptions: number | null;
  mentalityPositioning: number | null;
  mentalityVision: number | null;
  mentalityPenalties: number | null;
  mentalityComposure: number | null;
  defendingMarkingAwareness: number | null;
  defendingStandingTackle: number | null;
  defendingSlidingTackle: number | null;
  goalkeepingDiving: number | null;
  goalkeepingHandling: number | null;
  goalkeepingKicking: number | null;
  goalkeepingPositioning: number | null;
  goalkeepingReflexes: number | null;
  goalkeepingSpeed: number | null;
  fitScore?: number | null;
  fitConfidence?: Fc26FitConfidence | null;
  fitProfileSize?: number | null;
}

export interface Fc26PlayersResponse {
  players: Fc26Player[];
  total: number;
  limit: number;
  offset: number;
}

const FC26_NUMERIC_FILTER_BASES = [
  "ovr",
  "age",
  "potential",
  "marketValue",
  "height",
  "weight",
  "weakFoot",
  "skillMoves",
  "internationalReputation",
  "pace",
  "shooting",
  "passing",
  "dribbling",
  "defending",
  "physic",
  "attackingCrossing",
  "attackingFinishing",
  "attackingHeadingAccuracy",
  "attackingShortPassing",
  "attackingVolleys",
  "skillDribbling",
  "skillCurve",
  "skillFkAccuracy",
  "skillLongPassing",
  "skillBallControl",
  "movementAcceleration",
  "movementSprintSpeed",
  "movementAgility",
  "movementReactions",
  "movementBalance",
  "powerShotPower",
  "powerJumping",
  "powerStamina",
  "powerStrength",
  "powerLongShots",
  "mentalityAggression",
  "mentalityInterceptions",
  "mentalityPositioning",
  "mentalityVision",
  "mentalityPenalties",
  "mentalityComposure",
  "defendingMarkingAwareness",
  "defendingStandingTackle",
  "defendingSlidingTackle",
  "goalkeepingDiving",
  "goalkeepingHandling",
  "goalkeepingKicking",
  "goalkeepingPositioning",
  "goalkeepingReflexes",
  "goalkeepingSpeed",
] as const;

type Fc26NumericFilterBase = typeof FC26_NUMERIC_FILTER_BASES[number];
type Fc26NumericFilterKey = `min${Capitalize<Fc26NumericFilterBase>}` | `max${Capitalize<Fc26NumericFilterBase>}`;

export type Fc26PlayerFilters = {
  positions?: Fc26PlayerPosition[];
  primaryPositions?: Fc26PlayerPosition[];
  secondaryPositions?: Fc26PlayerPosition[];
  nations?: string[];
  clubs?: string[];
  leagues?: string[];
  preferredFoot?: "Right" | "Left";
  traits?: string[];
  sortBy?: Fc26PlayerSortBy;
  sortOrder?: "asc" | "desc";
  objective?: Fc26FitObjective;
  limit?: number;
  offset?: number;
} & Partial<Record<Fc26NumericFilterKey, number>>;

export type Fc26PlayerListParams = Fc26PlayerFilters & {
  saveId?: string;
};

export interface Fc26PlayerFilterMetadata {
  positions: Fc26PlayerPosition[];
  nations: string[];
  leagues: string[];
  clubsByLeague: Record<string, string[]>;
}

function toRangeParamKey(prefix: "min" | "max", base: Fc26NumericFilterBase): Fc26NumericFilterKey {
  return `${prefix}${base.charAt(0).toUpperCase()}${base.slice(1)}` as Fc26NumericFilterKey;
}

function toFc26PlayersQuery(filters: Fc26PlayerListParams = {}) {
  const params = new URLSearchParams();

  appendCsvParam(params, "positions", filters.positions);
  appendCsvParam(params, "primaryPositions", filters.primaryPositions);
  appendCsvParam(params, "secondaryPositions", filters.secondaryPositions);
  appendCsvParam(params, "nations", filters.nations);
  appendCsvParam(params, "clubs", filters.clubs);
  appendCsvParam(params, "leagues", filters.leagues);

  FC26_NUMERIC_FILTER_BASES.forEach((base) => {
    const minKey = toRangeParamKey("min", base);
    const maxKey = toRangeParamKey("max", base);
    appendNumberParam(params, minKey, filters[minKey]);
    appendNumberParam(params, maxKey, filters[maxKey]);
  });

  if (filters.preferredFoot) {
    params.set("preferredFoot", filters.preferredFoot);
  }
  appendCsvParam(params, "traits", filters.traits);
  const canSendSortBy = filters.sortBy === "ovr" || filters.sortBy === "potential";
  if (canSendSortBy) {
    params.set("sortBy", filters.sortBy);
  }
  if (canSendSortBy && filters.sortOrder) {
    params.set("sortOrder", filters.sortOrder);
  }
  if (filters.saveId) {
    params.set("saveId", filters.saveId);
  }
  if (filters.objective) {
    params.set("objective", filters.objective);
  }
  appendNumberParam(params, "limit", Math.min(Math.max(filters.limit ?? 20, 1), 100));
  appendNumberParam(params, "offset", Math.max(filters.offset ?? 0, 0));

  return params.toString();
}

export const fc26PlayersApi = {
  list: (filters?: Fc26PlayerListParams) => {
    const qs = toFc26PlayersQuery(filters);
    return request<Fc26PlayersResponse>(`/fc26-players${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  },
  filters: () =>
    request<Fc26PlayerFilterMetadata>("/fc26-players/filters"),
  get: (sofifaId: number) =>
    request<Fc26Player>(`/fc26-players/${sofifaId}`),
};
