import { useQuery } from "@tanstack/react-query";
import { scoutingApi } from "@/shared/api/client";
import { CACHE_TTL } from "@/shared/api/cache-ttl";
import type { Fc26FitObjective } from "@/shared/api/client";

export function useClubArchetype(
  saveId: string | null | undefined,
  position: string | null,
  objective: Fc26FitObjective = "balanced",
) {
  return useQuery({
    queryKey: ["club-archetype", saveId, position, objective],
    queryFn: () => scoutingApi.clubArchetype(saveId!, position!, objective),
    enabled: !!saveId && !!position,
    staleTime: CACHE_TTL.staticData,
  });
}
