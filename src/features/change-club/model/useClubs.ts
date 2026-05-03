import { useQuery } from "@tanstack/react-query";
import { clubsApi } from "@/shared/api/client";

export function useClubs() {
  return useQuery({
    queryKey: ["clubs"],
    queryFn: clubsApi.list,
    staleTime: 1000 * 60 * 60,
  });
}

export function useClubsByLeague() {
  return useQuery({
    queryKey: ["clubs", "by-league"],
    queryFn: clubsApi.byLeague,
    staleTime: 1000 * 60 * 60,
  });
}
