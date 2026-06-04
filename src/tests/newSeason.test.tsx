import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import NewSeasonModal from "@/features/new-season/ui/NewSeasonModal";

// The modal pulls read-only data from several feature hooks; stub them to the
// minimum so we can drive the season-advance flow itself.
vi.mock("@/features/squad/model/usePlayers", () => ({ usePlayers: () => ({ data: [] }) }));
vi.mock("@/features/stats/model/useTeamStats", () => ({ useTeamStats: () => ({ data: [] }) }));
vi.mock("@/features/history/model/useTrophies", () => ({ useTrophies: () => ({ data: [] }) }));
vi.mock("@/features/change-club/model/useCompetitions", () => ({
  useEuropeanCompetitions: () => ({ data: [] }),
}));
vi.mock("@/features/dashboard/model/useFinancialSnapshot", () => ({
  useFinancialSnapshot: () => ({
    data: {
      id: "save-1",
      currentSeason: "2026/27",
      budget: 1_000_000,
      balance: 1_000_000,
      budgetFormatted: "€1M",
      balanceFormatted: "€1M",
    },
  }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

function renderModal(onConfirm: ReturnType<typeof vi.fn>) {
  const onOpenChange = vi.fn();
  render(
    <NewSeasonModal
      open
      onOpenChange={onOpenChange}
      saveId="save-1"
      currentSeason="2026/27"
      currentClub="Palmeiras"
      onConfirm={onConfirm}
    />,
  );
  return { onOpenChange };
}

describe("NewSeasonModal — season advance flow", () => {
  it("walks confirm → overview → budget and calls onConfirm with the parsed budget", async () => {
    const onConfirm = vi.fn().mockResolvedValue(true);
    const { onOpenChange } = renderModal(onConfirm);

    // Step 1: confirm ending the season.
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));

    // Step 2: overview → start the new season.
    fireEvent.click(screen.getByRole("button", { name: /start new season/i }));

    // Step 3: enter the budget (in millions) and confirm.
    fireEvent.change(screen.getByPlaceholderText("85"), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    // 150 (millions) parsed to euros, "none" competition → null.
    expect(onConfirm).toHaveBeenCalledWith(150_000_000, null);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("does not advance while the budget input is empty", () => {
    const onConfirm = vi.fn().mockResolvedValue(true);
    renderModal(onConfirm);

    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    fireEvent.click(screen.getByRole("button", { name: /start new season/i }));

    // Confirm is disabled with an empty budget, so clicking is a no-op.
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
