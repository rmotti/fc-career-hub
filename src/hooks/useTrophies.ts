import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trophiesApi } from "@/services/api";

export function useTrophies(saveId: string | null) {
  return useQuery({
    queryKey: ["trophies", saveId],
    queryFn: () => trophiesApi.list(saveId!),
    enabled: !!saveId,
  });
}

export function useCreateTrophy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, data }: { saveId: string; data: { name: string; year: number } }) =>
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
