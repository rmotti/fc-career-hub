import { request } from "../http";

export type CompetitionType = "League" | "NationalCup" | "SuperCup" | "EuropeanCup";

export interface ApiCompetition {
  id: string;
  name: string;
  type: CompetitionType;
  country: string | null;
}

export const competitionsApi = {
  list: () => request<ApiCompetition[]>("/competitions"),
  european: () => request<ApiCompetition[]>("/competitions/european"),
};
