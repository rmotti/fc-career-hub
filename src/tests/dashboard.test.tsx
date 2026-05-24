import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardScreen from "@/features/dashboard/ui/DashboardScreen";

vi.mock("@/features/dashboard/model/useFinancialSnapshot", () => ({
  useFinancialSnapshot: () => ({
    data: {
      id: "save-1",
      name: "Save inicial",
      currentYear: 2026,
      currentSeason: "2026/27",
      budget: 100_000_000,
      balance: 100_000_000,
      budgetFormatted: "R$ 100 mi",
      balanceFormatted: "R$ 100 mi",
    },
  }),
}));

vi.mock("@/features/squad/model/usePlayers", () => ({
  usePlayers: () => ({ data: [], isLoading: true }),
}));

vi.mock("@/features/stats/model/useTeamStats", () => ({
  useTeamStats: () => ({ data: [] }),
}));

vi.mock("@/features/transfers/model/useTransfers", () => ({
  useTransfers: () => ({ data: [] }),
}));

vi.mock("@/features/history/model/useTrophies", () => ({
  useTrophies: () => ({ data: [] }),
}));

describe("DashboardScreen", () => {
  it("renders initial load even without players", () => {
    expect(() => render(<DashboardScreen saveId="save-1" />)).not.toThrow();
    expect(screen.getByText("Season Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Save inicial")).toBeInTheDocument();
  });
});
