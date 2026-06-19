import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shortlistApi, type ShortlistPriority } from "@/shared/api/client";

// Shortlist is per-save user data the API does not cache in Redis, so we keep
// the default staleTime (always revalidate) like playbooks. Mutations bust the
// list key.
export function useShortlist(saveId: string | null | undefined) {
  return useQuery({
    queryKey: ["shortlist", saveId],
    queryFn: () => shortlistApi.list(saveId!),
    enabled: !!saveId,
  });
}

export function useAddShortlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, fc26PlayerId, notes, priority }: { saveId: string; fc26PlayerId: number; notes?: string | null; priority?: ShortlistPriority | null }) =>
      shortlistApi.add(saveId, { fc26PlayerId, notes, priority }),
    onSuccess: (_res, vars) => qc.invalidateQueries({ queryKey: ["shortlist", vars.saveId] }),
  });
}

export function useRemoveShortlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, itemId }: { saveId: string; itemId: string }) =>
      shortlistApi.remove(saveId, itemId),
    onSuccess: (_res, vars) => qc.invalidateQueries({ queryKey: ["shortlist", vars.saveId] }),
  });
}
