import { type Money } from "@/shared/lib/money";
import { request } from "../http";

export interface ApiSave {
  id: string;
  name: string;
  currentYear: number;
  currentSeason: string;
  europeanCompetitionId?: string | null;
  budget: Money<"eur">;
  budgetFormatted?: string;
  balance: Money<"eur">;
  balanceFormatted?: string;
  currentClubStint?: ApiClubStint;
  createdAt?: string;
  updatedAt?: string;
  availableSeasons?: string[];
}

export interface ApiClubStint {
  id: string;
  saveId: string;
  club: string;
  startYear: number;
  endYear?: number | null;
  isCurrent: boolean;
}

// A save that has been soft-deleted (archived). Carries the normal save fields
// plus the archive timestamp.
export interface ApiDeletedSave extends ApiSave {
  deletedAt: string;
}

export type SnapshotReason =
  | "pre-season-advance"
  | "pre-delete"
  | "pre-transfer-reverse"
  | "pre-player-release"
  | "pre-club-change"
  | "pre-fc26-import"
  | "manual";

export interface ApiSnapshot {
  id: string;
  reason: SnapshotReason;
  createdAt: string;
}

export type AuditAction =
  | "save.season_advance"
  | "save.soft_delete"
  | "save.purge"
  | "save.restore"
  | "save.snapshot_create"
  | "save.snapshot_restore"
  | "save.finance_edit"
  | "transfer.reverse"
  | "player.release"
  | "clubstint.change"
  | "squad.import";

export interface ApiAuditEntry {
  id: string;
  action: AuditAction | string;
  meta: Record<string, any>;
  createdAt: string;
}

export const savesApi = {
  list: () => request<ApiSave[]>("/saves"),
  get: (saveId: string) => request<ApiSave>(`/saves/${saveId}`),
  create: (data: { name: string; club: string; budget: string; europeanCompetitionId?: string | null }) =>
    request<ApiSave>("/saves", { method: "POST", body: JSON.stringify(data) }),
  update: (saveId: string, data: { currentYear?: number; currentSeason?: string; budget?: string; balance?: string; europeanCompetitionId?: string | null }) =>
    request<ApiSave>(`/saves/${saveId}`, { method: "PATCH", body: JSON.stringify(data) }),
  // Defaults to a reversible soft-delete (archive). Pass `purge: true` to delete
  // permanently. The `confirm` query param must equal the saveId or the API
  // rejects with 400 / code DELETE_CONFIRMATION_REQUIRED.
  delete: (saveId: string, options?: { purge?: boolean }) => {
    const params = new URLSearchParams({ confirm: saveId });
    if (options?.purge) params.set("purge", "true");
    return request<{ purged: boolean }>(`/saves/${saveId}?${params.toString()}`, { method: "DELETE" });
  },
  listDeleted: () => request<ApiDeletedSave[]>("/saves/deleted"),
  restore: (saveId: string) =>
    request<{ restored: boolean }>(`/saves/${saveId}/restore`, { method: "POST" }),
  listSnapshots: (saveId: string) =>
    request<ApiSnapshot[]>(`/saves/${saveId}/snapshots`),
  createSnapshot: (saveId: string) =>
    request<ApiSnapshot>(`/saves/${saveId}/snapshots`, { method: "POST" }),
  restoreSnapshot: (saveId: string, snapshotId: string) =>
    request<{ restored: boolean }>(`/saves/${saveId}/snapshots/${snapshotId}/restore`, { method: "POST" }),
  audit: (saveId: string) =>
    request<ApiAuditEntry[]>(`/saves/${saveId}/audit`),
};
