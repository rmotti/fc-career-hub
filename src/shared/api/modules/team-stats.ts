import { request } from "../http";
import { type ApiCompetition } from "./competitions";

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
  createdAt?: string;
  updatedAt?: string;
}

export const teamStatsApi = {
  list: (saveId: string, season?: string) =>
    request<ApiTeamStats[]>(`/saves/${saveId}/team-stats${season ? `?season=${season}` : ""}`),
  create: (saveId: string, data: { competitionId: string; season?: string; clubStintId?: string }) =>
    request<ApiTeamStats>(`/saves/${saveId}/team-stats`, { method: "POST", body: JSON.stringify(data) }),
  update: (saveId: string, statsId: string, data: { goalsPro?: number; goalsAgainst?: number; wins?: number; draws?: number; losses?: number; leaguePosition?: number | null; cupResult?: string | null }) =>
    request<ApiTeamStats>(`/saves/${saveId}/team-stats/${statsId}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (saveId: string, statsId: string) =>
    request<void>(`/saves/${saveId}/team-stats/${statsId}`, { method: "DELETE" }),
};
