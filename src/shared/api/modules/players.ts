import { type Money } from "@/shared/lib/money";
import { request } from "../http";

export type PlayerPosition = "GOL" | "LD" | "LE" | "ZAG" | "VOL" | "MC" | "ME" | "MD" | "MEI" | "PE" | "PD" | "SA" | "ATA";

export interface ApiPlayerAlternativePosition {
  positions: PlayerPosition[];
}

export interface ApiPlayer {
  id: string;
  saveId: string;
  clubStintId: string;
  name: string;
  nation?: string | null;
  position: PlayerPosition;
  alternativePosition?: ApiPlayerAlternativePosition;
  age: number;
  status: "Crucial" | "Important" | "Role" | "Sporadic" | "Promising" | "Loan";
  ovr: number;
  salary?: Money<"k"> | null;
  salaryFormatted?: string | null;
  marketValue?: Money<"M"> | null;
  marketValueFormatted?: string | null;
  potential?: number | null;
  shirtNumber?: number | null;
  ovrDelta?: number | null;
  marketValueDelta?: Money<"M"> | null;
  loanedTo?: string | null;
  loanSeason?: string | null;
  ovrHistory?: Array<{ season: string; ovr: number; marketValue?: Money<"M"> }>;
  isActive: boolean;
  currentSeasonStats?: ApiPlayerSeasonStats;
  totalStats?: { goals: number; assists: number; yellowCards: number; redCards: number; matches?: number; goalContributions?: number; cleanSheets: number; };
  history?: Array<{ season: string; goals: number; assists: number; yellowCards: number; redCards: number; matches?: number; goalContributions?: number; cleanSheets: number; }>;
  /** Distinct clubs the player appeared for in this save, in chronological order. Only present in the default list variant (no ?active / ?loaned). */
  clubs?: string[];
  // Enriched on the detail endpoint (GET /saves/:saveId/players/:playerId).
  // `seasons` is the merged, chronologically-ordered (oldest → newest) source of
  // truth for the trajectory chart and per-season table. `loanSpells` is purely
  // informative and never counts toward totalStats / records.
  seasons?: ApiPlayerSeason[];
  loanSpells?: ApiPlayerLoanSpell[];
}

export interface ApiPlayerSeasonClubStats {
  club: string;
  goals: number;
  assists: number;
  matches: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  goalContributions: number;
}

export interface ApiPlayerSeason {
  season: string;
  /** Season-end OVR snapshot, or null when no snapshot exists for the season. */
  ovr: number | null;
  /** Market value in millions of € (40 = €40M), or null when no snapshot exists. */
  marketValue: Money<"M"> | null;
  /** Usually one club; 2+ when the player changed clubs mid-season. May be empty. */
  clubs: ApiPlayerSeasonClubStats[];
}

export interface ApiPlayerLoanSpell {
  season: string;
  loanClub: string;
  goals: number;
  assists: number;
  matches: number;
  goalContributions: number;
}

export interface ApiPlayerSeasonStats {
  id?: string;
  playerId?: string;
  season?: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matches?: number;
  goalContributions?: number;
  cleanSheets: number;
}

export interface ApiLoanStats {
  id: string;
  saveId: string;
  playerId: string;
  transferId: string;
  loanClub: string;
  season: string;
  goals: number;
  assists: number;
  matches: number;
  goalContributions: number;
  createdAt: string;
  updatedAt: string;
}

export const playersApi = {
  list: (saveId: string, active?: boolean, season?: string, loaned?: boolean) => {
    const params = new URLSearchParams();
    if (active) params.append("active", "true");
    if (loaned) params.append("loaned", "true");
    if (season) params.append("season", season);
    const qs = params.toString();
    return request<ApiPlayer[]>(`/saves/${saveId}/players${qs ? `?${qs}` : ""}`);
  },
  get: (saveId: string, playerId: string) =>
    request<ApiPlayer>(`/saves/${saveId}/players/${playerId}`),
  create: (saveId: string, data: { name: string; nation?: string; position: string; alternativePosition?: ApiPlayerAlternativePosition; age: number; status: string; ovr: number; salary?: number; marketValue?: number; potential?: number; shirtNumber?: number; seasonStats?: { goals: number; assists: number; yellowCards: number; redCards: number; matches?: number; } }) =>
    request<ApiPlayer>(`/saves/${saveId}/players`, { method: "POST", body: JSON.stringify(data) }),
  update: (saveId: string, playerId: string, data: { name?: string; nation?: string; position?: string; alternativePosition?: ApiPlayerAlternativePosition; age?: number; status?: string; ovr?: number; salary?: number; marketValue?: number; potential?: number | null; shirtNumber?: number | null; isActive?: boolean }) =>
    request<ApiPlayer>(`/saves/${saveId}/players/${playerId}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStats: (saveId: string, playerId: string, data: { goals?: number; assists?: number; yellowCards?: number; redCards?: number; matches?: number; cleanSheets?: number; }) =>
    request<ApiPlayerSeasonStats>(`/saves/${saveId}/players/${playerId}/stats`, { method: "PATCH", body: JSON.stringify(data) }),
  release: (saveId: string, playerId: string) =>
    request<void>(`/saves/${saveId}/players/${playerId}/release`, { method: "DELETE" }),
  importFc26: (saveId: string) =>
    request<{ imported: number; skipped: number; total: number }>(
      `/saves/${saveId}/players/import-fc26`,
      { method: "POST" },
    ),
  recall: (saveId: string, playerId: string) =>
    request<ApiPlayer>(`/saves/${saveId}/players/${playerId}/recall`, { method: "POST" }),
  getLoanStats: (saveId: string, playerId: string) =>
    request<ApiLoanStats[]>(`/saves/${saveId}/players/${playerId}/loan-stats`),
  updateLoanStats: (saveId: string, playerId: string, data: { goals?: number; assists?: number; matches?: number }) =>
    request<ApiLoanStats>(`/saves/${saveId}/players/${playerId}/loan-stats`, { method: "PATCH", body: JSON.stringify(data) }),
};
