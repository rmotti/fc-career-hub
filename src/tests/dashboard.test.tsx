import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardScreen from "@/components/hub/DashboardScreen";

vi.mock("@/hooks/useFinancialSnapshot", () => ({
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

vi.mock("@/hooks/usePlayers", () => ({
  usePlayers: () => ({ data: [], isLoading: true }),
}));

vi.mock("@/hooks/useTeamStats", () => ({
  useTeamStats: () => ({ data: [] }),
}));

vi.mock("@/hooks/useTransfers", () => ({
  useTransfers: () => ({ data: [] }),
}));

vi.mock("@/hooks/useTrophies", () => ({
  useTrophies: () => ({ data: [] }),
}));

describe("DashboardScreen", () => {
  it("renderiza o primeiro carregamento mesmo sem jogadores", () => {
    expect(() => render(<DashboardScreen saveId="save-1" />)).not.toThrow();
    expect(screen.getByText("Painel da Temporada")).toBeInTheDocument();
    expect(screen.getByText("Save inicial")).toBeInTheDocument();
  });
});
