import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PlayerModal from "@/features/squad/ui/PlayerModal";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/features/squad/model/usePlayers", () => ({
  useUpdatePlayerStats: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("PlayerModal", () => {
  it("renders the create form without crashing", () => {
    render(
      <PlayerModal open onOpenChange={vi.fn()} player={null} onSave={vi.fn()} saveId="save-1" />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByRole("textbox").length).toBeGreaterThan(0);
  });

  it("does not render dialog content when closed", () => {
    render(
      <PlayerModal open={false} onOpenChange={vi.fn()} player={null} onSave={vi.fn()} saveId="save-1" />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
