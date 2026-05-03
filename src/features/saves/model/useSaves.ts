import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { savesApi, type ApiSave } from "@/shared/api/client";

export function useSaves() {
  return useQuery({
    queryKey: ["saves"],
    queryFn: savesApi.list,
  });
}

export function useSave(saveId: string | null) {
  return useQuery({
    queryKey: ["saves", saveId],
    queryFn: () => savesApi.get(saveId!),
    enabled: !!saveId,
    refetchOnWindowFocus: false,
  });
}

export function useCreateSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; club: string; budget: string; europeanCompetitionId?: string | null }) => savesApi.create(data),
    onSuccess: () => {
      return qc.invalidateQueries({ queryKey: ["saves"] });
    },
  });
}

export function useUpdateSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, data }: { saveId: string; data: Parameters<typeof savesApi.update>[1] }) =>
      savesApi.update(saveId, data),
    onSuccess: (_res, vars) => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["saves"] }),
        qc.invalidateQueries({ queryKey: ["saves", vars.saveId] }),
        qc.invalidateQueries({ queryKey: ["teamStats", vars.saveId] }),
        qc.invalidateQueries({ queryKey: ["players", vars.saveId] }),
        qc.invalidateQueries({ queryKey: ["trophies", vars.saveId] })
      ]);
    },
  });
}

export function useDeleteSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (saveId: string) => savesApi.delete(saveId),
    onSuccess: () => {
      return qc.invalidateQueries({ queryKey: ["saves"] });
    },
  });
}
