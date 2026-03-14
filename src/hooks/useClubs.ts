import { useQuery } from "@tanstack/react-query";
import { clubsApi } from "@/services/api";

export function useClubs() {
  return useQuery({
    queryKey: ["clubs"],
    queryFn: clubsApi.list,
    staleTime: 1000 * 60 * 60, // clubs rarely change
  });
}
