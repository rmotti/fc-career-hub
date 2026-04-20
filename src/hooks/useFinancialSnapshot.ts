import { useMemo } from "react";
import { useSave } from "@/hooks/useSaves";
import { useTransfers } from "@/hooks/useTransfers";
import { formatCurrency, normalizeStoredBudget } from "@/utils/currency";
import { calculateBalanceFromTransfers } from "@/utils/finance";

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
