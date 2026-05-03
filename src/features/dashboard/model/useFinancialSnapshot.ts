import { useMemo } from "react";
import { useSave } from "@/features/saves/model/useSaves";
import { useTransfers } from "@/features/transfers/model/useTransfers";
import { formatCurrency, normalizeStoredBudget } from "@/shared/lib/currency";
import { calculateBalanceFromTransfers } from "@/shared/lib/finance";

export function useFinancialSnapshot(saveId: string | null) {
  const saveQuery = useSave(saveId);
  const transfersQuery = useTransfers(saveId, "current");

  const data = useMemo(() => {
    const save = saveQuery.data;
    if (!save) return save;

    const normalizedBudget = normalizeStoredBudget(save.budget);
    const currentTransfers = transfersQuery.data ?? [];
    const computedBalance = calculateBalanceFromTransfers(normalizedBudget, currentTransfers);

    return {
      ...save,
      budget: normalizedBudget,
      budgetFormatted: formatCurrency(normalizedBudget),
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
