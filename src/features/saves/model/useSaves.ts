import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
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

// Invalidate every cache that depends on a single save's state. Used after the
// destructive/reversible operations (restore, snapshot restore) that rebuild the
// save's children on the backend.
export function invalidateSaveCaches(qc: QueryClient, saveId: string) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["saves"] }),
    qc.invalidateQueries({ queryKey: ["saves", saveId] }),
    qc.invalidateQueries({ queryKey: ["players", saveId] }),
    qc.invalidateQueries({ queryKey: ["transfers", saveId] }),
    qc.invalidateQueries({ queryKey: ["teamStats", saveId] }),
    qc.invalidateQueries({ queryKey: ["trophies", saveId] }),
    qc.invalidateQueries({ queryKey: ["clubStints", saveId] }),
    qc.invalidateQueries({ queryKey: ["snapshots", saveId] }),
    qc.invalidateQueries({ queryKey: ["audit", saveId] }),
  ]);
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
        qc.invalidateQueries({ queryKey: ["trophies", vars.saveId] }),
        qc.invalidateQueries({ queryKey: ["audit", vars.saveId] }),
      ]);
    },
  });
}

// Soft-delete (archive) by default; pass `purge: true` to delete permanently.
export function useDeleteSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, purge }: { saveId: string; purge?: boolean }) =>
      savesApi.delete(saveId, { purge }),
    onSuccess: () => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["saves"] }),
        qc.invalidateQueries({ queryKey: ["saves", "deleted"] }),
      ]);
    },
  });
}

export function useDeletedSaves(enabled = true) {
  return useQuery({
    queryKey: ["saves", "deleted"],
    queryFn: savesApi.listDeleted,
    enabled,
  });
}

export function useRestoreSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (saveId: string) => savesApi.restore(saveId),
    onSuccess: () => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["saves"] }),
        qc.invalidateQueries({ queryKey: ["saves", "deleted"] }),
      ]);
    },
  });
}

export function useSnapshots(saveId: string | null) {
  return useQuery({
    queryKey: ["snapshots", saveId],
    queryFn: () => savesApi.listSnapshots(saveId!),
    enabled: !!saveId,
  });
}

export function useCreateSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (saveId: string) => savesApi.createSnapshot(saveId),
    onSuccess: (_res, saveId) => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["snapshots", saveId] }),
        qc.invalidateQueries({ queryKey: ["audit", saveId] }),
      ]);
    },
  });
}

export function useRestoreSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, snapshotId }: { saveId: string; snapshotId: string }) =>
      savesApi.restoreSnapshot(saveId, snapshotId),
    // A snapshot restore rebuilds the whole save, so refresh everything.
    onSuccess: (_res, vars) => invalidateSaveCaches(qc, vars.saveId),
  });
}

export function useAudit(saveId: string | null) {
  return useQuery({
    queryKey: ["audit", saveId],
    queryFn: () => savesApi.audit(saveId!),
    enabled: !!saveId,
  });
}

export type { ApiSave };
