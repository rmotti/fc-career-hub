import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamStatsApi } from "@/services/api";

export function useTeamStats(saveId: string | null, season?: string) {
  return useQuery({
    queryKey: ["teamStats", saveId, { season }],
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
    onSuccess: (res, vars) => {
      qc.setQueryData(["teamStats", vars.saveId, { season: "current" }], (old: any) => {
        if (!old || old.length === 0) return [res];
        return old.map((stats: any) =>
          stats.id === res.id ? res : stats
        );
      });
      return Promise.all([
        qc.invalidateQueries({ queryKey: ["teamStats", vars.saveId] }),
        qc.invalidateQueries({ queryKey: ["saves", vars.saveId] })
      ]);
    },
  });
}
