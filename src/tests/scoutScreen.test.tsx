import { cleanup, render } from "@testing-library/react";
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
    history: [],
    activeConversationId: null,
    isLoading: false,
    isHistoryLoading: false,
    isRateLimited: false,
    retryAfterSeconds: 0,
    sendMessage: vi.fn(),
    retryLastMessage: vi.fn(),
    startNewConversation: vi.fn(),
    loadConversation: vi.fn(),
    deleteConversation: vi.fn(),
  }),
}));

vi.mock("@/features/playbooks/model/usePlaybooks", () => ({
  usePlaybooks: () => ({ data: { playbooks: [], defaultPlaybook: null } }),
}));

vi.mock("@/features/saves/model/useSaves", () => ({
  useSave: () => ({ data: null }),
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
  useFc26PlayerDetails: () => ({ byId: new Map(), isLoading: false }),
  useFc26PlayerFilters: () => ({ data: undefined, isLoading: false }),
}));

// Stable references: SearchSection memoizes on `nameSearch.players`, so a fresh
// array each render would invalidate those memos, re-fire the players/stats
// effects, and loop ScoutScreen into an infinite re-render (OOMs the worker).
const NAME_SEARCH_EMPTY_PLAYERS: never[] = [];
const NAME_SEARCH_NOOP = () => {};
const NAME_SEARCH_RESULT = {
  term: "",
  setTerm: NAME_SEARCH_NOOP,
  isActive: false,
  players: NAME_SEARCH_EMPTY_PLAYERS,
  total: 0,
  isLoading: false,
  isFetching: false,
  isError: false,
  error: null,
  hasMore: false,
  loadMore: NAME_SEARCH_NOOP,
  isLoadingMore: false,
};
vi.mock("@/features/scout/model/useFc26NameSearch", () => ({
  NAME_SEARCH_MIN_CHARS: 3,
  useFc26NameSearch: () => NAME_SEARCH_RESULT,
}));

vi.mock("@/features/scout/model/useShortlist", () => ({
  useShortlist: () => ({ data: { items: [] } }),
  useAddShortlistItem: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveShortlistItem: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/features/scout/model/useSavedSearches", () => ({
  useSavedSearches: () => ({ data: { items: [] } }),
  useCreateSavedSearch: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteSavedSearch: () => ({ mutate: vi.fn(), isPending: false }),
}));

afterEach(() => {
  // Unmount the rendered tree between cases. ScoutScreen is a very large
  // component, so leaving each section's tree mounted across the it.each
  // iterations retains enough memory to OOM the worker in CI.
  cleanup();
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
