import { useQuery } from "@tanstack/react-query";
import { fc26PlayersApi, type Fc26PlayerFilters, type Fc26PlayerListParams } from "@/shared/api/client";

function withScoutSaveContext(filters: Fc26PlayerFilters, saveId?: string | null): Fc26PlayerListParams {
  const { objective, ...baseFilters } = filters;

  if (!saveId) return baseFilters;

  return {
    ...baseFilters,
    saveId,
    objective: objective ?? "balanced",
  };
}

export function useFc26Players(filters: Fc26PlayerFilters | null, saveId?: string | null) {
  return useQuery({
    queryKey: ["fc26-players", filters, { saveId: saveId ?? null }],
    queryFn: () => fc26PlayersApi.list(filters ? withScoutSaveContext(filters, saveId) : undefined),
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
