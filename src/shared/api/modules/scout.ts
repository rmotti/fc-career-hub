import { type Money } from "@/shared/lib/money";
import { appendNumberParam, request } from "../http";
import { type Fc26FitConfidence, type Fc26PlayerFilters, type Fc26PlayerPosition, type Fc26PlayersResponse } from "./fc26-players";
import { type PlayerPosition } from "./players";

// ─── Scout Playbooks ────────────────────────────────────────────────

export type PlaybookObjective = "balanced" | "title" | "youth" | "rebuild";
export type ScoutScoreConfidence = "high" | "medium" | "low" | "fallback";

export interface PlaybookWeights {
  overall?: number;
  age?: number;
  historicalFit?: number;
  potential?: number;
  marketValue?: number;
  wage?: number;
}

export interface PlaybookPreferences {
  objective?: PlaybookObjective;
  // `idealAgeMin`/`idealAgeMax` were discontinued in the B-003 scoring redesign:
  // age is now a fixed "younger is better" curve, so there is no ideal range. The
  // API still accepts them for backwards compatibility but ignores them.
  maxMarketValue?: number;
  maxWage?: number;
}

export interface ApiPlaybook {
  id: string | null;
  saveId: string | null;
  name: string;
  weights: PlaybookWeights;
  preferences: PlaybookPreferences;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlaybooksListResponse {
  defaultPlaybook: ApiPlaybook;
  playbooks: ApiPlaybook[];
}

export interface ScoutScoreBreakdownItem {
  key: string;
  label: string;
  weight: number;
  score: number | null;
  value: number | null;
  available: boolean;
  weightedScore?: number;
  confidence?: string;
  profileSize?: number;
  reason?: string;
}

export const playbooksApi = {
  list: (saveId: string) =>
    request<PlaybooksListResponse>(`/scout/playbooks?saveId=${saveId}`),
  get: (playbookId: string) =>
    request<ApiPlaybook>(`/scout/playbooks/${playbookId}`),
  create: (data: {
    saveId: string;
    name: string;
    weights: PlaybookWeights;
    preferences?: PlaybookPreferences;
    isDefault?: boolean;
  }) =>
    request<ApiPlaybook>("/scout/playbooks", { method: "POST", body: JSON.stringify(data) }),
  update: (
    playbookId: string,
    data: { name?: string; weights?: PlaybookWeights; preferences?: PlaybookPreferences; isDefault?: boolean },
  ) =>
    request<ApiPlaybook>(`/scout/playbooks/${playbookId}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (playbookId: string) =>
    request<void>(`/scout/playbooks/${playbookId}`, { method: "DELETE" }),
};

// ─── Shortlist ──────────────────────────────────────────────────────

export type ShortlistPriority = "LOW" | "MEDIUM" | "HIGH";

// Subset of Fc26Player fields the API embeds on a shortlist row (see the
// `fc26Player` select in the API's shortlist.service). Only present on the list
// (GET) response — create/update return the bare item without it. Money fields
// carry the same units as the full Fc26Player.
//
// The fit fields are computed by the list endpoint with the save's active club +
// default-playbook objective (same number shown on the scouting screen). They are
// fail-open: present but null when there's no active club or the fit service is
// unavailable.
export interface ShortlistFc26Player {
  id: number;
  sofifaId: number;
  name: string;
  longName: string | null;
  age: number;
  ovr: number;
  potential: number;
  positions: Fc26PlayerPosition[];
  nation: string | null;
  club: string | null;
  league: string | null;
  marketValue: Money<"M"> | null;
  wage: Money<"k"> | null;
  playerFaceUrl: string | null;
  fitScore?: number | null;
  fitConfidence?: Fc26FitConfidence | null;
  fitProfileSize?: number | null;
}

export interface ApiShortlistItem {
  id: string;
  saveId: string;
  fc26PlayerId: number;
  notes: string | null;
  priority: ShortlistPriority | null;
  createdAt: string;
  fc26Player?: ShortlistFc26Player;
}

export const shortlistApi = {
  list: (saveId: string) =>
    request<{ items: ApiShortlistItem[] }>(`/saves/${saveId}/shortlist`),
  add: (saveId: string, data: { fc26PlayerId: number; notes?: string | null; priority?: ShortlistPriority | null }) =>
    request<ApiShortlistItem>(`/saves/${saveId}/shortlist`, { method: "POST", body: JSON.stringify(data) }),
  update: (saveId: string, itemId: string, data: { notes?: string | null; priority?: ShortlistPriority | null }) =>
    request<ApiShortlistItem>(`/saves/${saveId}/shortlist/${itemId}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (saveId: string, itemId: string) =>
    request<void>(`/saves/${saveId}/shortlist/${itemId}`, { method: "DELETE" }),
};

// ─── Saved Searches ─────────────────────────────────────────────────

export interface ApiSavedSearch {
  id: string;
  saveId: string;
  name: string;
  filters: Fc26PlayerFilters;
  createdAt: string;
  updatedAt: string;
}

export const savedSearchesApi = {
  list: (saveId: string) =>
    request<{ items: ApiSavedSearch[] }>(`/saves/${saveId}/saved-searches`),
  create: (saveId: string, data: { name: string; filters: Fc26PlayerFilters }) =>
    request<ApiSavedSearch>(`/saves/${saveId}/saved-searches`, { method: "POST", body: JSON.stringify(data) }),
  update: (saveId: string, id: string, data: { name?: string; filters?: Fc26PlayerFilters }) =>
    request<ApiSavedSearch>(`/saves/${saveId}/saved-searches/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (saveId: string, id: string) =>
    request<void>(`/saves/${saveId}/saved-searches/${id}`, { method: "DELETE" }),
};

// ─── Scouting (squad gaps, transfer targets, signing evaluation) ────

export type ScoutFormation = "4-3-3" | "4-2-3-1";
export type ScoutGapSeverity = "critical" | "moderate" | "low";
export type SigningVerdict = "strong" | "reasonable" | "poor";

export interface ApiScoutGap {
  position: PlayerPosition;
  severity: ScoutGapSeverity;
  count: number;
  ideal: number;
  min: number;
  avgAge: number | null;
  avgOvr: number | null;
  bestOvr: number | null;
  reason: string;
}

// `position` here is the dataset player's joined position list (e.g. "ST/CF"),
// not a single PlayerPosition.
export interface ApiSigningAlternative {
  sofifaId: number;
  name: string;
  position: string;
  ovr: number;
  potential: number;
  age: number;
  marketValue: Money<"M"> | null;
  club: string | null;
}

export interface ApiSigningEvaluation {
  verdict: SigningVerdict;
  player: {
    name: string;
    position: string;
    ovr: number;
    potential: number;
    age: number;
    marketValue: Money<"M"> | null;
    club: string | null;
  };
  costAnalysis: {
    marketValue: Money<"M"> | null;
    budget: Money<"eur"> | null;
    affordable: boolean;
    pctOfBudget: number | null;
  };
  fitAnalysis: {
    samePositionCount: number;
    bestSquadOvr: number | null;
    avgSquadAge: number | null;
    ovrDelta: number | null;
    ageDelta: number | null;
    note: string;
  };
  alternatives: ApiSigningAlternative[];
}

export interface ScoutTransferTargetParams {
  position: PlayerPosition;
  maxAge?: number;
  minOverall?: number;
  maxValue?: number;
  saveId?: string;
}

export const scoutingApi = {
  gaps: (saveId: string, formation?: ScoutFormation) =>
    request<{ gaps: ApiScoutGap[] }>(
      `/scouting/saves/${saveId}/gaps${formation ? `?formation=${formation}` : ""}`,
    ),
  transferTargets: (params: ScoutTransferTargetParams) => {
    const search = new URLSearchParams({ position: params.position });
    appendNumberParam(search, "maxAge", params.maxAge);
    appendNumberParam(search, "minOverall", params.minOverall);
    appendNumberParam(search, "maxValue", params.maxValue);
    if (params.saveId) search.set("saveId", params.saveId);
    return request<Fc26PlayersResponse>(`/scouting/transfer-targets?${search.toString()}`);
  },
  evaluate: (saveId: string, sofifaId: number) =>
    request<ApiSigningEvaluation>(`/scouting/saves/${saveId}/evaluate/${sofifaId}`),
};
