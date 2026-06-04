import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TransferModal from "@/features/transfers/ui/TransferModal";

vi.mock("@/features/squad/model/usePlayers", () => ({
  usePlayers: () => ({ data: [] }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

function renderModal(open: boolean) {
  return render(
    <TransferModal
      open={open}
      onOpenChange={vi.fn()}
      transfer={null}
      currentClub="Palmeiras"
      currentSeason="2026/27"
      onSave={vi.fn()}
      saveId="save-1"
    />,
  );
}

describe("TransferModal", () => {
  it("renders the create form without crashing", () => {
    renderModal(true);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render dialog content when closed", () => {
    renderModal(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
