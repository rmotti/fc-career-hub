import { useQueries, useQuery } from "@tanstack/react-query";
import { fc26PlayersApi, type Fc26FitObjective, type Fc26PlayerFilters, type Fc26PlayerListParams } from "@/shared/api/client";
import { CACHE_TTL } from "@/shared/api/cache-ttl";

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
    queryFn: ({ signal }) => fc26PlayersApi.list(filters ? withScoutSaveContext(filters, saveId) : undefined, signal),
    enabled: !!filters,
    placeholderData: (previousData) => previousData,
    staleTime: CACHE_TTL.fc26Players,
  });
}

export function useFc26Player(sofifaId: number | null) {
  return useQuery({
    queryKey: ["fc26-players", sofifaId],
    queryFn: () => fc26PlayersApi.get(sofifaId!),
    enabled: typeof sofifaId === "number",
    staleTime: CACHE_TTL.fc26Players,
  });
}

// Hydrates several players' full detail records (all attributes) at once, keyed by
// sofifaId. The scout list/shortlist payloads omit the granular attributes the
// comparison view needs, so we pull them from the detail endpoint — the same source
// the individual analysis uses. Shares the per-player cache with useFc26Player.
export function useFc26PlayerDetails(sofifaIds: number[]) {
  return useQueries({
    queries: sofifaIds.map((sofifaId) => ({
      queryKey: ["fc26-players", sofifaId],
      queryFn: () => fc26PlayersApi.get(sofifaId),
      staleTime: CACHE_TTL.fc26Players,
    })),
    combine: (results) => ({
      byId: new Map(
        results.flatMap((result, index) => (result.data ? [[sofifaIds[index], result.data] as const] : [])),
      ),
      isLoading: results.some((result) => result.isLoading),
    }),
  });
}

export function useFc26PlayerFilters() {
  return useQuery({
    queryKey: ["fc26-players", "filters"],
    queryFn: fc26PlayersApi.filters,
    staleTime: CACHE_TTL.fc26Players,
  });
}

export function useFc26PlayerFitBreakdown(
  sofifaId: number | null,
  saveId: string | null,
  objective?: Fc26FitObjective | null,
) {
  return useQuery({
    queryKey: ["fc26-players", sofifaId, "fit-breakdown", saveId, objective ?? "balanced"],
    queryFn: () => fc26PlayersApi.fitBreakdown(sofifaId!, saveId!, objective ?? undefined),
    enabled: typeof sofifaId === "number" && !!saveId,
    staleTime: CACHE_TTL.fc26Players,
    retry: false,
  });
}
