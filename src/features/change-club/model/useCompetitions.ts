import { useQuery } from "@tanstack/react-query";
import { competitionsApi } from "@/shared/api/client";

export function useCompetitions() {
  return useQuery({
    queryKey: ["competitions"],
    queryFn: competitionsApi.list,
    staleTime: 1000 * 60 * 60,
  });
}

export function useEuropeanCompetitions() {
  return useQuery({
    queryKey: ["competitions", "european"],
    queryFn: competitionsApi.european,
    staleTime: 1000 * 60 * 60,
  });
}
