import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import ScoutScreen, { type ScoutSection } from "@/features/scout/ui/ScoutScreen";

// Smoke-only: ScoutScreen is ~4k lines. We verify it mounts for each section
// without crashing, guarding future refactors of the shared scout surface.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/features/auth/model/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/features/scout/model/useJuniorChat", () => ({
  useJuniorChat: () => ({
    messages: [],
    lastResponseId: null,
    history: [],
    isLoading: false,
    isRateLimited: false,
    retryAfterSeconds: 0,
    sendMessage: vi.fn(),
    startNewConversation: vi.fn(),
    loadConversation: vi.fn(),
    deleteConversation: vi.fn(),
  }),
}));

vi.mock("@/features/playbooks/model/usePlaybooks", () => ({
  usePlaybooks: () => ({ data: { playbooks: [], defaultPlaybook: null } }),
}));

vi.mock("@/features/scout/model/useFc26Players", () => ({
  useFc26Players: () => ({
    data: undefined,
    isError: false,
    isFetching: false,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useFc26Player: () => ({ data: null, isError: false, isLoading: false, error: null }),
  useFc26PlayerFilters: () => ({ data: undefined, isLoading: false }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

function renderSection(section: ScoutSection) {
  return render(
    <MemoryRouter>
      <ScoutScreen section={section} saveId="save-1" currentClub="Palmeiras" currentSeason="2026/27" />
    </MemoryRouter>,
  );
}

describe("ScoutScreen (smoke)", () => {
  it.each<ScoutSection>(["ai", "filters", "archive", "shortlist"])(
    "mounts the %s section without crashing",
    (section) => {
      const { container } = renderSection(section);
      expect(container.firstChild).not.toBeNull();
    },
  );
});
