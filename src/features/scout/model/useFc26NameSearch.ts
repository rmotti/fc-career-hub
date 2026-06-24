import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fc26PlayersApi, type Fc26Player, type Fc26PlayerFilters } from "@/shared/api/client";
import { CACHE_TTL } from "@/shared/api/cache-ttl";
import { useDebouncedValue } from "@/features/scout/model/useDebouncedValue";

// Minimum number of (trimmed) characters before we hit the API. Below this we
// stay quiet and let the caller fall back to its base/catalog view.
export const NAME_SEARCH_MIN_CHARS = 3;
const DEBOUNCE_MS = 250;
const PAGE_SIZE = 20;

export interface Fc26NameSearchResult {
  /** Raw, controlled input value (updates on every keystroke). */
  term: string;
  setTerm: (term: string) => void;
  /** True once the trimmed term is long enough to search. */
  isActive: boolean;
  players: Fc26Player[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
}

// Name typeahead for the scout Search tab.
//
// - Debounces the term and only queries at >= NAME_SEARCH_MIN_CHARS chars.
// - Combines with the panel's applied filters (AND) and the active save's fit
//   context, but never sends sort params: the backend already returns name
//   matches ordered by ovr desc.
// - useInfiniteQuery keys on the term + filters, so a new keystroke aborts the
//   prior in-flight request (via the queryFn AbortSignal) and the last query
//   always wins — no stale-result flicker. Changing the key also resets paging
//   back to offset 0, satisfying "reset offset on every new term".
// - `loadMore` fetches the next page (offset += PAGE_SIZE) and accumulates,
//   bounded by `total`, for infinite scroll / "load more".
export function useFc26NameSearch(
  baseFilters: Fc26PlayerFilters | null,
  saveId?: string | null,
): Fc26NameSearchResult {
  const [term, setTerm] = useState("");

  const debouncedTerm = useDebouncedValue(term, DEBOUNCE_MS);
  const trimmedTerm = debouncedTerm.trim();
  const isActive = trimmedTerm.length >= NAME_SEARCH_MIN_CHARS;

  // Strip pagination/sort from the panel filters: name search owns paging and
  // relies on the backend's ovr-desc ordering.
  const mergedFilters = useMemo<Fc26PlayerFilters>(() => {
    const { limit: _limit, offset: _offset, sortBy: _sortBy, sortOrder: _sortOrder, ...rest } = baseFilters ?? {};
    return rest;
  }, [baseFilters]);

  const query = useInfiniteQuery({
    queryKey: ["fc26-players", "name-search", mergedFilters, trimmedTerm, { saveId: saveId ?? null }],
    queryFn: ({ pageParam, signal }) =>
      fc26PlayersApi.list(
        {
          ...mergedFilters,
          ...(saveId ? { saveId } : {}),
          name: trimmedTerm,
          limit: PAGE_SIZE,
          offset: pageParam,
        },
        signal,
      ),
    enabled: isActive,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.players.length;
      return next < lastPage.total ? next : undefined;
    },
    staleTime: CACHE_TTL.fc26Players,
  });

  const players = useMemo<Fc26Player[]>(
    () => (isActive ? query.data?.pages.flatMap((page) => page.players) ?? [] : []),
    [isActive, query.data],
  );
  const total = isActive ? query.data?.pages[0]?.total ?? 0 : 0;

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  }, [query]);

  return {
    term,
    setTerm,
    isActive,
    players,
    total,
    isLoading: isActive && query.isLoading,
    isFetching: isActive && query.isFetching,
    isError: query.isError,
    error: query.error,
    hasMore: isActive && !!query.hasNextPage,
    loadMore,
    isLoadingMore: query.isFetchingNextPage,
  };
}
