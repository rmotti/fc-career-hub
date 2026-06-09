import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamStatsApi } from "@/shared/api/client";

export function useTeamStats(saveId: string | null, season?: string, clubStintId?: string | null) {
  return useQuery({
    queryKey: ["teamStats", saveId, { season, clubStintId }],
    queryFn: async () => {
      const teamStats = await teamStatsApi.list(saveId!, season);
      return Array.isArray(teamStats) ? teamStats : [];
    },
    enabled: !!saveId,
  });
}

export function useUpdateTeamStats() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, statsId, data }: { saveId: string; statsId: string; data: Parameters<typeof teamStatsApi.update>[2] }) =>
      teamStatsApi.update(saveId, statsId, data),
    onSuccess: (_res, vars) => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["teamStats", vars.saveId] }),
        qc.invalidateQueries({ queryKey: ["saves", vars.saveId] })
      ]);
    },
  });
}

export function useCreateTeamStats() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, data }: { saveId: string; data: Parameters<typeof teamStatsApi.create>[1] }) =>
      teamStatsApi.create(saveId, data),
    onSuccess: (_res, vars) => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["teamStats", vars.saveId] }),
        qc.invalidateQueries({ queryKey: ["saves", vars.saveId] })
      ]);
    },
  });
}

export function useDeleteTeamStats() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, statsId }: { saveId: string; statsId: string }) =>
      teamStatsApi.delete(saveId, statsId),
    onSuccess: (_res, vars) => {
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["teamStats", vars.saveId] }),
        qc.invalidateQueries({ queryKey: ["saves", vars.saveId] })
      ]);
    },
  });
}
