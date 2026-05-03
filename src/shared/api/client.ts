const DEFAULT_API_URL = "https://career-hub-api.vercel.app";

function resolveBaseUrl() {
  const env = import.meta.env as ImportMetaEnv & {
    NEXT_PUBLIC_API_URL?: string;
    VITE_API_URL?: string;
  };
  const configuredBaseUrl = env.NEXT_PUBLIC_API_URL || env.VITE_API_URL || DEFAULT_API_URL;
  const normalizedBaseUrl = configuredBaseUrl.replace(/\/$/, "");

  return normalizedBaseUrl.endsWith("/api")
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/api`;
}

const BASE_URL = resolveBaseUrl();

let unauthorizedHandler: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  status?: number;
  data?: any;
  isNetworkError?: boolean;

  constructor(message: string, status?: number, data?: any, isNetworkError?: boolean) {
    super(message);
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
    this.name = "ApiError";
  }
}

export type UserRole = "ADMIN" | "USER";
export type UserPlan = "FREE" | "PRO" | "PREMIUM";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: UserRole;
  plan: UserPlan;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSession {
  id: string;
  expiresAt: string;
  userId: string;
}

export interface AuthSuccessResponse {
  token: string;
  user: ApiUser;
}

export interface SessionResponse {
  session: ApiSession;
  user: ApiUser;
}

export function extractErrorMessage(err: any): string {
  if (err?.isNetworkError || err?.message === "Failed to fetch" || err?.message?.includes("NetworkError")) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão.";
  }

  if (err?.data?.error === "SHIRT_NUMBER_CONFLICT") {
    return err.data.message;
  }

  const status = err?.status || err?.response?.status;
  const apiError = err?.data?.error || err?.response?.data?.error;

  if (status === 400) return apiError || err.message || "Dados inválidos. Verifique as informações e tente novamente.";
  if (status === 401) return apiError || err.message || "Sessão expirada. Faça login novamente.";
  if (status === 403) return apiError || err.message || "Você não tem permissão para realizar esta ação.";
  if (status === 404) return apiError || err.message || "Recurso não encontrado.";
  if (status === 409) return apiError || err.message || "Conflito ao salvar os dados. Tente novamente.";
  if (status >= 500) return "Erro interno. Tente novamente em instantes.";

  return apiError || err?.message || "Erro inesperado. Tente novamente.";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined"
    ? window.localStorage.getItem("session_token")
    : null;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch (err: any) {
    // throw network error
    throw new ApiError(err.message, undefined, undefined, true);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    if (
      res.status === 401 &&
      !path.startsWith("/auth/sign-in") &&
      !path.startsWith("/auth/sign-up")
    ) {
      unauthorizedHandler?.();
    }
    throw new ApiError(err.error || `HTTP ${res.status}`, res.status, err);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Auth ───────────────────────────────────────────────────────────

export const authApi = {
  signUp: (data: { name: string; email: string; password: string; plan?: UserPlan }) =>
    request<AuthSuccessResponse>("/auth/sign-up/email", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  signIn: (data: { email: string; password: string }) =>
    request<AuthSuccessResponse>("/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getSession: () =>
    request<SessionResponse | null>("/auth/session"),
  signOut: () =>
    request<{ success: true }>("/auth/sign-out", {
      method: "POST",
    }),
};

// ─── Types (API response shapes) ────────────────────────────────────

export interface ApiSave {
  id: string;
  name: string;
  currentYear: number;
  currentSeason: string;
  europeanCompetitionId?: string | null;
  budget: number;
  budgetFormatted?: string;
  balance: number;
  balanceFormatted?: string;
  currentClubStint?: ApiClubStint;
  createdAt?: string;
  updatedAt?: string;
  availableSeasons?: string[];
}

export interface ApiClubStint {
  id: string;
  saveId: string;
  club: string;
  startYear: number;
  endYear?: number | null;
  isCurrent: boolean;
}

export type PlayerPosition = "GOL" | "LD" | "LE" | "ZAG" | "VOL" | "MC" | "ME" | "MD" | "MEI" | "PE" | "PD" | "SA" | "ATA";

export type Fc26PlayerPosition = PlayerPosition;

export interface Fc26Player {
  id: number;
  sofifaId: number;
  name: string;
  positions: Fc26PlayerPosition[];
  age: number;
  ovr: number;
  potential: number;
  marketValue: number | null;
  nation: string | null;
  club: string | null;
  league: string | null;
  wage: number | null;
  longName: string | null;
  dob: string | null;
  height: number | null;
  weight: number | null;
  playerFaceUrl: string | null;
  contractUntil: number | null;
  releaseClause: number | null;
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
  sortBy?: "ovr" | "potential";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
} & Partial<Record<Fc26NumericFilterKey, number>>;

export interface Fc26PlayerFilterMetadata {
  positions: Fc26PlayerPosition[];
  nations: string[];
  leagues: string[];
  clubsByLeague: Record<string, string[]>;
}

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
  status: "Crucial" | "Important" | "Role" | "Sporadic" | "Promising";
  ovr: number;
  salary?: number;
  salaryFormatted?: string;
  marketValue?: number;
  marketValueFormatted?: string;
  potential?: number | null;
  shirtNumber?: number | null;
  ovrDelta?: number | null;
  marketValueDelta?: number | null;
  ovrHistory?: Array<{ season: string; ovr: number; marketValue?: number }>;
  isActive: boolean;
  currentSeasonStats?: ApiPlayerSeasonStats;
  totalStats?: { goals: number; assists: number; yellowCards: number; redCards: number; matches?: number; goalContributions?: number; cleanSheets: number; };
  history?: Array<{ season: string; goals: number; assists: number; yellowCards: number; redCards: number; matches?: number; goalContributions?: number; cleanSheets: number; }>;
}

export interface ApiPlayerSeasonStats {
  id: string;
  playerId: string;
  season: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matches?: number;
  goalContributions?: number;
  cleanSheets: number;
}

export type CompetitionType = "League" | "NationalCup" | "SuperCup" | "EuropeanCup";

export interface ApiCompetition {
  id: string;
  name: string;
  type: CompetitionType;
  country: string | null;
}

export interface ApiTeamStats {
  id: string;
  saveId: string;
  clubStintId: string;
  competitionId: string;
  competition: ApiCompetition | null;
  season: string;
  goalsPro: number;
  goalsAgainst: number;
  wins: number;
  draws: number;
  losses: number;
  leaguePosition?: number | null;
  cupResult?: string | null;
  europeanCupResult?: string | null;
  nationalCupResult?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiTransfer {
  id: string;
  saveId: string;
  clubStintId?: string | null;
  playerName: string;
  type: "compra" | "venda" | "emprestimo_entrada" | "emprestimo_saida";
  from: string;
  to: string;
  fee?: number;
  feeFormatted?: string;
  season: string;
  playerId?: string;
  player?: ApiPlayer;
  createdAt?: string;
}

export interface ApiTrophy {
  id: string;
  saveId: string;
  clubStintId: string;
  competition: Pick<ApiCompetition, "id" | "name" | "type">;
  year: number;
  club?: string;
  createdAt?: string;
}

// ─── Clubs ──────────────────────────────────────────────────────────

export const clubsApi = {
  list: () => request<string[]>("/clubs"),
  byLeague: () => request<Record<string, string[]>>("/clubs/by-league"),
};

// ─── Competitions ───────────────────────────────────────────────────

export const competitionsApi = {
  list: () => request<ApiCompetition[]>("/competitions"),
  european: () => request<ApiCompetition[]>("/competitions/european"),
};

// ─── Saves ──────────────────────────────────────────────────────────

export const savesApi = {
  list: () => request<ApiSave[]>("/saves"),
  get: (saveId: string) => request<ApiSave>(`/saves/${saveId}`),
  create: (data: { name: string; club: string; budget: string; europeanCompetitionId?: string | null }) =>
    request<ApiSave>("/saves", { method: "POST", body: JSON.stringify(data) }),
  update: (saveId: string, data: { currentYear?: number; currentSeason?: string; budget?: string; balance?: string; europeanCompetitionId?: string | null }) =>
    request<ApiSave>(`/saves/${saveId}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (saveId: string) =>
    request<void>(`/saves/${saveId}`, { method: "DELETE" }),
};

// ─── Club Stints ────────────────────────────────────────────────────

export const clubStintsApi = {
  list: (saveId: string) =>
    request<ApiClubStint[]>(`/saves/${saveId}/club-stints`),
  getCurrent: (saveId: string) =>
    request<ApiClubStint>(`/saves/${saveId}/club-stints/current`),
  changeClub: (saveId: string, data: { club: string }) =>
    request<ApiClubStint>(`/saves/${saveId}/club-stints`, { method: "POST", body: JSON.stringify(data) }),
  update: (saveId: string, stintId: string, data: { club?: string; startYear?: number; endYear?: number }) =>
    request<ApiClubStint>(`/saves/${saveId}/club-stints/${stintId}`, { method: "PATCH", body: JSON.stringify(data) }),
};

// ─── Players ────────────────────────────────────────────────────────

export const playersApi = {
  list: (saveId: string, active?: boolean, season?: string) => {
    const params = new URLSearchParams();
    if (active) params.append("active", "true");
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
};

// ─── FC26 Players Dataset ───────────────────────────────────────────

function appendNumberParam(params: URLSearchParams, key: string, value: number | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    params.set(key, String(value));
  }
}

function appendCsvParam(params: URLSearchParams, key: string, values: readonly string[] | undefined) {
  const normalizedValues = values?.map((value) => value.trim()).filter(Boolean);
  if (normalizedValues?.length) {
    params.set(key, normalizedValues.join(","));
  }
}

function toRangeParamKey(prefix: "min" | "max", base: Fc26NumericFilterBase): Fc26NumericFilterKey {
  return `${prefix}${base.charAt(0).toUpperCase()}${base.slice(1)}` as Fc26NumericFilterKey;
}

function toFc26PlayersQuery(filters: Fc26PlayerFilters = {}) {
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
  if (filters.sortBy) {
    params.set("sortBy", filters.sortBy);
  }
  if (filters.sortOrder) {
    params.set("sortOrder", filters.sortOrder);
  }
  appendNumberParam(params, "limit", Math.min(Math.max(filters.limit ?? 20, 1), 100));
  appendNumberParam(params, "offset", Math.max(filters.offset ?? 0, 0));

  return params.toString();
}

export const fc26PlayersApi = {
  list: (filters?: Fc26PlayerFilters) => {
    const qs = toFc26PlayersQuery(filters);
    return request<Fc26PlayersResponse>(`/fc26-players${qs ? `?${qs}` : ""}`);
  },
  filters: () =>
    request<Fc26PlayerFilterMetadata>("/fc26-players/filters"),
  get: (sofifaId: number) =>
    request<Fc26Player>(`/fc26-players/${sofifaId}`),
};

// ─── Team Stats ─────────────────────────────────────────────────────

export const teamStatsApi = {
  list: (saveId: string, season?: string) =>
    request<ApiTeamStats[]>(`/saves/${saveId}/team-stats${season ? `?season=${season}` : ""}`),
  update: (saveId: string, statsId: string, data: { goalsPro?: number; goalsAgainst?: number; wins?: number; draws?: number; losses?: number; leaguePosition?: number | null; cupResult?: string | null }) =>
    request<ApiTeamStats>(`/saves/${saveId}/team-stats/${statsId}`, { method: "PATCH", body: JSON.stringify(data) }),
};

// ─── Transfers ──────────────────────────────────────────────────────

export const transfersApi = {
  list: (saveId: string, season?: "current") =>
    request<ApiTransfer[]>(`/saves/${saveId}/transfers${season ? `?season=${season}` : ""}`),
  create: (saveId: string, data: { playerName: string; type: string; from: string; to: string; season: string; fee?: number; playerId?: string }) =>
    request<{ transfer: ApiTransfer; playerId: string | null; save: ApiSave }>(`/saves/${saveId}/transfers`, { method: "POST", body: JSON.stringify(data) }),
  update: (saveId: string, transferId: string, data: { playerName?: string; type?: string; from?: string; to?: string; fee?: string; season?: string }) =>
    request<ApiTransfer>(`/saves/${saveId}/transfers/${transferId}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (saveId: string, transferId: string) =>
    request<void>(`/saves/${saveId}/transfers/${transferId}`, { method: "DELETE" }),
};

// ─── Trophies ───────────────────────────────────────────────────────

export const trophiesApi = {
  list: (saveId: string) =>
    request<ApiTrophy[]>(`/saves/${saveId}/trophies`),
  create: (saveId: string, data: { competitionId: string; year: number }) =>
    request<ApiTrophy>(`/saves/${saveId}/trophies`, { method: "POST", body: JSON.stringify(data) }),
  delete: (saveId: string, trophyId: string) =>
    request<void>(`/saves/${saveId}/trophies/${trophyId}`, { method: "DELETE" }),
};
