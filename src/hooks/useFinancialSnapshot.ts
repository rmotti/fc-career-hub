import { useMemo } from "react";
import { useSave } from "@/hooks/useSaves";
import { useTransfers } from "@/hooks/useTransfers";
import { formatCurrency } from "@/utils/currency";
import { calculateBalanceFromTransfers } from "@/utils/finance";

export function useFinancialSnapshot(saveId: string | null) {
  const saveQuery = useSave(saveId);
  const transfersQuery = useTransfers(saveId, "current");

  const data = useMemo(() => {
    const save = saveQuery.data;
    if (!save) return save;

    const currentTransfers = transfersQuery.data ?? [];
    const computedBalance = calculateBalanceFromTransfers(save.budget ?? 0, currentTransfers);

    return {
      ...save,
      balance: computedBalance,
      balanceFormatted: formatCurrency(computedBalance),
    };
  }, [saveQuery.data, transfersQuery.data]);

  return {
    ...saveQuery,
    data,
    isLoading: saveQuery.isLoading || transfersQuery.isLoading,
  };
}
