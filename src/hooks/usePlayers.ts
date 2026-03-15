import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { playersApi, type ApiPlayer } from "@/services/api";

export function usePlayers(saveId: string | null, active?: boolean, sort?: string, order?: string) {
  return useQuery({
    queryKey: ["players", saveId, { active, sort, order }],
    queryFn: () => playersApi.list(saveId!, active, sort, order),
    enabled: !!saveId,
  });
}

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

export function useReleasePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, playerId }: { saveId: string; playerId: string }) =>
      playersApi.release(saveId, playerId),
    onSuccess: (_res, vars) => {
      return qc.invalidateQueries({ queryKey: ["players", vars.saveId] });
    },
  });
}
