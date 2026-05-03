import { type ApiTransfer } from "@/shared/api/client";

const ONE_MILLION = 1_000_000;

function getTransferImpact(transfer: ApiTransfer): number {
  if (!transfer.fee) return 0;

  if (transfer.type === "venda") {
    return transfer.fee * ONE_MILLION;
  }

  if (transfer.type === "compra") {
    return -transfer.fee * ONE_MILLION;
  }

  return 0;
}

export function calculateBalanceFromTransfers(budget: number, transfers: ApiTransfer[]): number {
  return transfers.reduce((total, transfer) => total + getTransferImpact(transfer), budget);
}
