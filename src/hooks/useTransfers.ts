import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transfersApi } from "@/services/api";

function refreshSaveQueries(qc: ReturnType<typeof useQueryClient>, saveId: string) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["saves"] }),
    qc.invalidateQueries({ queryKey: ["saves", saveId] }),
  ]);
}

export function useTransfers(saveId: string | null, season?: "current") {
  return useQuery({
    queryKey: ["transfers", saveId, { season }],
    queryFn: async () => {
      const transfers = await transfersApi.list(saveId!, season);
      return Array.isArray(transfers) ? transfers : [];
    },
    enabled: !!saveId,
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, data }: { saveId: string; data: Parameters<typeof transfersApi.create>[1] }) =>
      transfersApi.create(saveId, data),
    onSuccess: async (res, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["transfers", vars.saveId] }),
        qc.invalidateQueries({ queryKey: ["players", vars.saveId] }),
      ]);

      if (res.save) {
        qc.setQueryData(["saves", vars.saveId], (prev: any) => ({ ...prev, ...res.save }));
      }

      await refreshSaveQueries(qc, vars.saveId);
    },
  });
}

export function useUpdateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, transferId, data }: { saveId: string; transferId: string; data: Parameters<typeof transfersApi.update>[2] }) =>
      transfersApi.update(saveId, transferId, data),
    onSuccess: async (_res, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["transfers", vars.saveId] }),
        refreshSaveQueries(qc, vars.saveId),
      ]);
    },
  });
}

export function useDeleteTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, transferId }: { saveId: string; transferId: string }) =>
      transfersApi.delete(saveId, transferId),
    onSuccess: async (_res, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["transfers", vars.saveId] }),
        refreshSaveQueries(qc, vars.saveId),
      ]);
    },
  });
}
