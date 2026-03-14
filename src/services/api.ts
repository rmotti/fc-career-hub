const BASE_URL = "https://career-hub-api.vercel.app/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Types (API response shapes) ────────────────────────────────────

export interface ApiSave {
  id: string;
  name: string;
  currentYear: number;
  currentSeason: string;
  budget: string;
  balance: string;
  currentClubStint?: ApiClubStint;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiClubStint {
  id: string;
  saveId: string;
  club: string;
  startYear: number;
  endYear?: number | null;
  isCurrent: boolean;
}

export interface ApiPlayer {
  id: string;
  saveId: string;
  clubStintId: string;
  name: string;
  position: "GOL" | "ZAG" | "MEI" | "ATA";
  age: number;
  status: "Crucial" | "Important" | "Role" | "Sporadic" | "Promising";
  ovr: number;
  salary?: string;
  marketValue?: string;
  isActive: boolean;
  seasonStats?: ApiPlayerSeasonStats;
  totalStats?: { goals: number; assists: number; yellowCards: number; redCards: number };
}

export interface ApiPlayerSeasonStats {
  id: string;
  playerId: string;
  season: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export interface ApiTeamStats {
  id: string;
  saveId: string;
  clubStintId: string;
  season: string;
  club: string;
  goalsPro: number;
  goalsAgainst: number;
  possession: number;
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
  type: "compra" | "venda";
  from: string;
  to: string;
  fee?: string;
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
  list: (saveId: string, active?: boolean) =>
    request<ApiPlayer[]>(`/saves/${saveId}/players${active ? "?active=true" : ""}`),
  get: (saveId: string, playerId: string) =>
    request<ApiPlayer>(`/saves/${saveId}/players/${playerId}`),
  create: (saveId: string, data: { name: string; position: string; age: number; status: string; ovr: number; salary?: string; marketValue?: string }) =>
    request<ApiPlayer>(`/saves/${saveId}/players`, { method: "POST", body: JSON.stringify(data) }),
  update: (saveId: string, playerId: string, data: { name?: string; position?: string; age?: number; status?: string; ovr?: number; salary?: string; marketValue?: string }) =>
    request<ApiPlayer>(`/saves/${saveId}/players/${playerId}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStats: (saveId: string, playerId: string, data: { goals?: number; assists?: number; yellowCards?: number; redCards?: number }) =>
    request<ApiPlayerSeasonStats>(`/saves/${saveId}/players/${playerId}/stats`, { method: "PATCH", body: JSON.stringify(data) }),
  release: (saveId: string, playerId: string) =>
    request<void>(`/saves/${saveId}/players/${playerId}/release`, { method: "DELETE" }),
};

// ─── Team Stats ─────────────────────────────────────────────────────

export const teamStatsApi = {
  list: (saveId: string, season?: "current") =>
    request<ApiTeamStats[]>(`/saves/${saveId}/team-stats${season ? `?season=${season}` : ""}`),
  update: (saveId: string, statsId: string, data: { goalsPro?: number; goalsAgainst?: number; possession?: number; wins?: number; draws?: number; losses?: number; leaguePosition?: number; europeanCupResult?: string; nationalCupResult?: string }) =>
    request<ApiTeamStats>(`/saves/${saveId}/team-stats/${statsId}`, { method: "PATCH", body: JSON.stringify(data) }),
};

// ─── Transfers ──────────────────────────────────────────────────────

export const transfersApi = {
  list: (saveId: string, season?: "current") =>
    request<ApiTransfer[]>(`/saves/${saveId}/transfers${season ? `?season=${season}` : ""}`),
  create: (saveId: string, data: { playerName: string; type: string; from: string; to: string; season: string; fee?: string; playerId?: string }) =>
    request<ApiTransfer>(`/saves/${saveId}/transfers`, { method: "POST", body: JSON.stringify(data) }),
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
