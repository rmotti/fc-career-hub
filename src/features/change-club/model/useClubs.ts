import { useQuery } from "@tanstack/react-query";
import { clubsApi } from "@/shared/api/client";
import { CACHE_TTL } from "@/shared/api/cache-ttl";

export function useClubs() {
  return useQuery({
    queryKey: ["clubs"],
    queryFn: clubsApi.list,
    staleTime: CACHE_TTL.staticData,
  });
}

export function useClubsByLeague() {
  return useQuery({
    queryKey: ["clubs", "by-league"],
    queryFn: clubsApi.byLeague,
    staleTime: CACHE_TTL.staticData,
  });
}
