import { useQuery } from "@tanstack/react-query";
import { fc26PlayersApi, type Fc26PlayerFilters } from "@/services/api";

export function useFc26Players(filters: Fc26PlayerFilters | null) {
  return useQuery({
    queryKey: ["fc26-players", filters],
    queryFn: () => fc26PlayersApi.list(filters ?? undefined),
    enabled: !!filters,
    placeholderData: (previousData) => previousData,
  });
}

export function useFc26Player(sofifaId: number | null) {
  return useQuery({
    queryKey: ["fc26-players", sofifaId],
    queryFn: () => fc26PlayersApi.get(sofifaId!),
    enabled: typeof sofifaId === "number",
  });
}

export function useFc26PlayerFilters() {
  return useQuery({
    queryKey: ["fc26-players", "filters"],
    queryFn: fc26PlayersApi.filters,
    staleTime: 1000 * 60 * 60 * 24,
  });
}
