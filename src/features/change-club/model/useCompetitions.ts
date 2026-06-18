import { useQuery } from "@tanstack/react-query";
import { competitionsApi } from "@/shared/api/client";
import { CACHE_TTL } from "@/shared/api/cache-ttl";

export function useCompetitions() {
  return useQuery({
    queryKey: ["competitions"],
    queryFn: competitionsApi.list,
    staleTime: CACHE_TTL.competitions,
  });
}

export function useEuropeanCompetitions() {
  return useQuery({
    queryKey: ["competitions", "european"],
    queryFn: competitionsApi.european,
    staleTime: CACHE_TTL.competitions,
  });
}
