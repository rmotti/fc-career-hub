import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trophiesApi } from "@/shared/api/client";
import { CACHE_TTL } from "@/shared/api/cache-ttl";

export function useTrophies(saveId: string | null) {
  return useQuery({
    queryKey: ["trophies", saveId],
    queryFn: async () => {
      const trophies = await trophiesApi.list(saveId!);
      return Array.isArray(trophies) ? trophies : [];
    },
    enabled: !!saveId,
    staleTime: CACHE_TTL.trophies,
  });
}

export function useCreateTrophy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, data }: { saveId: string; data: { competitionId: string; year: number } }) =>
      trophiesApi.create(saveId, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["trophies", vars.saveId] });
    },
  });
}

export function useDeleteTrophy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, trophyId }: { saveId: string; trophyId: string }) =>
      trophiesApi.delete(saveId, trophyId),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["trophies", vars.saveId] });
    },
  });
}
