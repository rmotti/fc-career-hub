import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { playersApi, type ApiPlayer } from "@/shared/api/client";

export const usePlayers = (saveId: string, active?: boolean, season?: string, loaned?: boolean) => {
  return useQuery({
    queryKey: ["players", saveId, active, season, loaned],
    queryFn: async () => {
      const players = await playersApi.list(saveId, active, season, loaned);
      return Array.isArray(players) ? players : [];
    },
    enabled: !!saveId,
  });
};

export function usePlayer(saveId: string | null, playerId: string | null) {
  return useQuery({
    queryKey: ["players", saveId, playerId],
    queryFn: () => playersApi.get(saveId!, playerId!),
    enabled: !!saveId && !!playerId,
  });
}

export function useCreatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, data }: { saveId: string; data: Parameters<typeof playersApi.create>[1] }) =>
      playersApi.create(saveId, data),
    onSuccess: (_res, vars) => {
      return qc.invalidateQueries({ queryKey: ["players", vars.saveId] });
    },
  });
}

export function useUpdatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, playerId, data }: { saveId: string; playerId: string; data: Parameters<typeof playersApi.update>[2] }) =>
      playersApi.update(saveId, playerId, data),
    onSuccess: (_res, vars) => {
      return qc.invalidateQueries({ queryKey: ["players", vars.saveId] });
    },
  });
}

export function useUpdatePlayerStats() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, playerId, data }: { saveId: string; playerId: string; data: Parameters<typeof playersApi.updateStats>[2] }) =>
      playersApi.updateStats(saveId, playerId, data),
    onSuccess: (_res, vars) => {
      return qc.invalidateQueries({ queryKey: ["players", vars.saveId] });
    },
  });
}

export function useImportFc26Players() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId }: { saveId: string }) => playersApi.importFc26(saveId),
    // Import snapshots + audits on the backend (pre-fc26-import).
    onSuccess: (_res, vars) => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["players", vars.saveId] }),
        qc.invalidateQueries({ queryKey: ["snapshots", vars.saveId] }),
        qc.invalidateQueries({ queryKey: ["audit", vars.saveId] }),
      ]);
    },
  });
}

export function useReleasePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, playerId }: { saveId: string; playerId: string }) =>
      playersApi.release(saveId, playerId),
    // Release snapshots + audits on the backend (pre-player-release), and is
    // reversible via a snapshot restore.
    onSuccess: (_res, vars) => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["players", vars.saveId] }),
        qc.invalidateQueries({ queryKey: ["snapshots", vars.saveId] }),
        qc.invalidateQueries({ queryKey: ["audit", vars.saveId] }),
      ]);
    },
  });
}
