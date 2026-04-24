import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clubStintsApi } from "@/services/api";

export function useClubStints(saveId: string | null) {
  return useQuery({
    queryKey: ["clubStints", saveId],
    queryFn: () => clubStintsApi.list(saveId!),
    enabled: !!saveId,
  });
}

export function useCurrentClubStint(saveId: string | null) {
  return useQuery({
    queryKey: ["clubStints", saveId, "current"],
    queryFn: () => clubStintsApi.getCurrent(saveId!),
    enabled: !!saveId,
  });
}

export function useChangeClub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, club }: { saveId: string; club: string }) =>
      clubStintsApi.changeClub(saveId, { club }),
    onSuccess: (_res, vars) => {
      qc.removeQueries({ queryKey: ["players", vars.saveId] });
      qc.removeQueries({ queryKey: ["teamStats", vars.saveId] });
      qc.removeQueries({ queryKey: ["transfers", vars.saveId] });
      qc.removeQueries({ queryKey: ["trophies", vars.saveId] });
      qc.removeQueries({ queryKey: ["clubStints", vars.saveId] });
      qc.invalidateQueries({ queryKey: ["saves", vars.saveId] });
      qc.invalidateQueries({ queryKey: ["saves"] });
    },
  });
}
