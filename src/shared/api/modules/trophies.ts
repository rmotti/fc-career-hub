import { request } from "../http";
import { type ApiCompetition } from "./competitions";

export interface ApiTrophy {
  id: string;
  saveId: string;
  clubStintId: string;
  competition: Pick<ApiCompetition, "id" | "name" | "type">;
  year: number;
  club?: string;
  createdAt?: string;
}

export const trophiesApi = {
  list: (saveId: string) =>
    request<ApiTrophy[]>(`/saves/${saveId}/trophies`),
  create: (saveId: string, data: { competitionId: string; year: number }) =>
    request<ApiTrophy>(`/saves/${saveId}/trophies`, { method: "POST", body: JSON.stringify(data) }),
  delete: (saveId: string, trophyId: string) =>
    request<void>(`/saves/${saveId}/trophies/${trophyId}`, { method: "DELETE" }),
};
