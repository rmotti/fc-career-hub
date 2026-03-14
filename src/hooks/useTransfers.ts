import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transfersApi } from "@/services/api";

export function useTransfers(saveId: string | null, season?: "current") {
  return useQuery({
    queryKey: ["transfers", saveId, { season }],
    queryFn: () => transfersApi.list(saveId!, season),
    enabled: !!saveId,
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, data }: { saveId: string; data: Parameters<typeof transfersApi.create>[1] }) =>
      transfersApi.create(saveId, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["transfers", vars.saveId] });
      qc.invalidateQueries({ queryKey: ["players", vars.saveId] });
    },
  });
}

export function useUpdateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, transferId, data }: { saveId: string; transferId: string; data: Parameters<typeof transfersApi.update>[2] }) =>
      transfersApi.update(saveId, transferId, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["transfers", vars.saveId] });
    },
  });
}

export function useDeleteTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, transferId }: { saveId: string; transferId: string }) =>
      transfersApi.delete(saveId, transferId),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["transfers", vars.saveId] });
    },
  });
}
