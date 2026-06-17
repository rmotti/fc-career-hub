import { request } from "../http";
import { type ApiClubStint } from "./saves";

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
