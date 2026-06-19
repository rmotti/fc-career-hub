import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { savedSearchesApi, type Fc26PlayerFilters } from "@/shared/api/client";

// Saved searches are per-save user data not cached in Redis on the API, so we
// keep the default staleTime (always revalidate). Mutations bust the list key.
export function useSavedSearches(saveId: string | null | undefined) {
  return useQuery({
    queryKey: ["saved-searches", saveId],
    queryFn: () => savedSearchesApi.list(saveId!),
    enabled: !!saveId,
  });
}

export function useCreateSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, data }: { saveId: string; data: { name: string; filters: Fc26PlayerFilters } }) =>
      savedSearchesApi.create(saveId, data),
    onSuccess: (_res, vars) => qc.invalidateQueries({ queryKey: ["saved-searches", vars.saveId] }),
  });
}

export function useDeleteSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, id }: { saveId: string; id: string }) =>
      savedSearchesApi.delete(saveId, id),
    onSuccess: (_res, vars) => qc.invalidateQueries({ queryKey: ["saved-searches", vars.saveId] }),
  });
}
