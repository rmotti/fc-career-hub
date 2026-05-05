import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  playbooksApi,
  type ApiPlaybook,
  type PlaybookPreferences,
  type PlaybookWeights,
} from "@/shared/api/client";

export function usePlaybooks(saveId: string | null) {
  return useQuery({
    queryKey: ["playbooks", saveId],
    queryFn: () => playbooksApi.list(saveId!),
    enabled: !!saveId,
  });
}

export function useCreatePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      saveId: string;
      name: string;
      weights: PlaybookWeights;
      preferences?: PlaybookPreferences;
      isDefault?: boolean;
    }) => playbooksApi.create(data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["playbooks", vars.saveId] });
    },
  });
}

export function useUpdatePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      saveId,
      playbookId,
      data,
    }: {
      saveId: string;
      playbookId: string;
      data: { name?: string; weights?: PlaybookWeights; preferences?: PlaybookPreferences; isDefault?: boolean };
    }) => playbooksApi.update(playbookId, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["playbooks", vars.saveId] });
    },
  });
}

export function useDeletePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playbookId }: { saveId: string; playbookId: string }) =>
      playbooksApi.delete(playbookId),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["playbooks", vars.saveId] });
    },
  });
}

export function useSetDefaultPlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ saveId, playbookId }: { saveId: string; playbookId: string }) =>
      playbooksApi.update(playbookId, { isDefault: true }),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["playbooks", vars.saveId] });
    },
  });
}

export type { ApiPlaybook, PlaybookWeights, PlaybookPreferences };
