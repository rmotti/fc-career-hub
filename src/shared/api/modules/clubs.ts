import { request } from "../http";

export const clubsApi = {
  list: () => request<string[]>("/clubs"),
  byLeague: () => request<Record<string, string[]>>("/clubs/by-league"),
};
