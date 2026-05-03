import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clubStintsApi } from "@/shared/api/client";

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
      qc.invalidateQueries({ queryKey: ["players", vars.saveId] });
      qc.invalidateQueries({ queryKey: ["teamStats", vars.saveId] });
      qc.invalidateQueries({ queryKey: ["transfers", vars.saveId] });
      qc.invalidateQueries({ queryKey: ["trophies", vars.saveId] });
      qc.invalidateQueries({ queryKey: ["clubStints", vars.saveId] });
      qc.invalidateQueries({ queryKey: ["saves", vars.saveId] });
      qc.invalidateQueries({ queryKey: ["saves"] });
    },
  });
}
