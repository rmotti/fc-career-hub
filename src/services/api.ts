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

  if (status === 400 || status === 401 || status === 403 || status === 404 || status === 409) {
    return apiError || err.message;
  }
  if (status >= 500) {
    return "Erro interno. Tente novamente em instantes.";
  }

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
  signUp: (data: { name: string; email: string; password: string }) =>
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

export interface ApiPlayer {
  id: string;
  saveId: string;
  clubStintId: string;
  name: string;
  nation?: string | null;
  position: PlayerPosition;
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

export interface ApiTeamStats {
  id: string;
  saveId: string;
  clubStintId: string;
  season: string;
  club: string;
  goalsPro: number;
  goalsAgainst: number;
  wins: number;
  draws: number;
  losses: number;
  leaguePosition?: number;
  europeanCupResult?: string;
  nationalCupResult?: string;
}

export interface ApiTransfer {
  id: string;
  saveId: string;
  playerName: string;
  type: "compra" | "venda" | "emprestimo_entrada" | "emprestimo_saida";
  from: string;
  to: string;
  fee?: number;
  feeFormatted?: string;
  season: string;
  playerId?: string;
}

export interface ApiTrophy {
  id: string;
  saveId: string;
  clubStintId: string;
  name: string;
  year: number;
  club?: string;
}

// ─── Clubs ──────────────────────────────────────────────────────────

export const clubsApi = {
  list: () => request<string[]>("/clubs"),
  byLeague: () => request<Record<string, string[]>>("/clubs/by-league"),
};

// ─── Saves ──────────────────────────────────────────────────────────

export const savesApi = {
  list: () => request<ApiSave[]>("/saves"),
  get: (saveId: string) => request<ApiSave>(`/saves/${saveId}`),
  create: (data: { name: string; club: string; budget: string }) =>
    request<ApiSave>("/saves", { method: "POST", body: JSON.stringify(data) }),
  update: (saveId: string, data: { currentYear?: number; currentSeason?: string; budget?: string; balance?: string }) =>
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
  create: (saveId: string, data: { name: string; nation?: string; position: string; age: number; status: string; ovr: number; salary?: number; marketValue?: number; potential?: number; shirtNumber?: number; seasonStats?: { goals: number; assists: number; yellowCards: number; redCards: number; matches?: number; } }) =>
    request<ApiPlayer>(`/saves/${saveId}/players`, { method: "POST", body: JSON.stringify(data) }),
  update: (saveId: string, playerId: string, data: { name?: string; nation?: string; position?: string; age?: number; status?: string; ovr?: number; salary?: number; marketValue?: number; potential?: number | null; shirtNumber?: number | null }) =>
    request<ApiPlayer>(`/saves/${saveId}/players/${playerId}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStats: (saveId: string, playerId: string, data: { goals?: number; assists?: number; yellowCards?: number; redCards?: number; matches?: number; cleanSheets?: number; }) =>
    request<ApiPlayerSeasonStats>(`/saves/${saveId}/players/${playerId}/stats`, { method: "PATCH", body: JSON.stringify(data) }),
  release: (saveId: string, playerId: string) =>
    request<void>(`/saves/${saveId}/players/${playerId}/release`, { method: "DELETE" }),
};

// ─── Team Stats ─────────────────────────────────────────────────────

export const teamStatsApi = {
  list: (saveId: string, season?: string) =>
    request<ApiTeamStats[]>(`/saves/${saveId}/team-stats${season ? `?season=${season}` : ""}`),
  update: (saveId: string, statsId: string, data: { goalsPro?: number; goalsAgainst?: number; wins?: number; draws?: number; losses?: number; leaguePosition?: number; europeanCupResult?: string; nationalCupResult?: string }) =>
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
  create: (saveId: string, data: { name: string; year: number }) =>
    request<ApiTrophy>(`/saves/${saveId}/trophies`, { method: "POST", body: JSON.stringify(data) }),
  delete: (saveId: string, trophyId: string) =>
    request<void>(`/saves/${saveId}/trophies/${trophyId}`, { method: "DELETE" }),
};
