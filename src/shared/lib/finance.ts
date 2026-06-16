import { type ApiTransfer } from "@/shared/api/client";
import { eur, mToEur, type Money } from "@/shared/lib/money";

function getTransferImpact(transfer: ApiTransfer): Money<"eur"> {
  if (!transfer.fee) return eur(0);

  if (transfer.type === "venda") {
    return mToEur(transfer.fee);
  }

  if (transfer.type === "compra") {
    return eur(-mToEur(transfer.fee));
  }

  return eur(0);
}

export function calculateBalanceFromTransfers(budget: Money<"eur">, transfers: ApiTransfer[]): Money<"eur"> {
  return transfers.reduce<Money<"eur">>(
    (total, transfer) => eur(total + getTransferImpact(transfer)),
    budget,
  );
}
