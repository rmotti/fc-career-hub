import { type Money } from "@/shared/lib/money";
import { request } from "../http";
import { type ApiPlayer } from "./players";
import { type ApiSave } from "./saves";

export interface ApiTransfer {
  id: string;
  saveId: string;
  clubStintId?: string | null;
  playerName: string;
  type: "compra" | "venda" | "emprestimo_entrada" | "emprestimo_saida";
  from: string;
  to: string;
  fee?: Money<"M">;
  feeFormatted?: string;
  season: string;
  playerId?: string;
  player?: ApiPlayer;
  createdAt?: string;
}

export const transfersApi = {
  list: (saveId: string, season?: "current") =>
    request<ApiTransfer[]>(`/saves/${saveId}/transfers${season ? `?season=${season}` : ""}`),
  create: (saveId: string, data: { playerName: string; type: string; from: string; to: string; season: string; fee?: number; playerId?: string }) =>
    request<{ transfer: ApiTransfer; playerId: string | null; save: ApiSave }>(`/saves/${saveId}/transfers`, { method: "POST", body: JSON.stringify(data) }),
  update: (saveId: string, transferId: string, data: { playerName?: string; type?: string; from?: string; to?: string; fee?: string; season?: string }) =>
    request<ApiTransfer>(`/saves/${saveId}/transfers/${transferId}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (saveId: string, transferId: string) =>
    request<void>(`/saves/${saveId}/transfers/${transferId}`, { method: "DELETE" }),
  // Truly undoes a transfer: refunds the balance, puts the player back (on a
  // sale) or removes them (on a purchase), and deletes the record. Prefer this
  // over `delete` when the intent is "undo".
  reverse: (saveId: string, transferId: string) =>
    request<{ reversed: boolean }>(`/saves/${saveId}/transfers/${transferId}/reverse`, { method: "POST" }),
};
