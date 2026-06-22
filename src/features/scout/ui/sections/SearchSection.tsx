import { useContext, useEffect, useMemo, type MutableRefObject } from "react";
import { ChevronLeft, ChevronRight, Loader2, LockKeyhole, RotateCcw, Save, Search } from "lucide-react";
import { toast } from "sonner";
import type { ApiPlaybook, Fc26FitObjective, Fc26Player, PlayerPosition } from "@/shared/api/client";
import { extractErrorMessage } from "@/shared/api/client";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { useFc26Players, useFc26PlayerFilters } from "@/features/scout/model/useFc26Players";
import { useRateLimitBackoff } from "@/features/scout/model/useRateLimitBackoff";
import { filterOutCurrentClubPlayers, isSameClubName } from "@/features/scout/model/currentClubFilter";
import { useCreateSavedSearch } from "@/features/scout/model/useSavedSearches";
import { PLAYER_POSITIONS } from "@/shared/lib/playerPositions";
import { LIMIT_OPTIONS, FIT_OBJECTIVE_OPTIONS, PLAYSTYLE_OPTIONS, PLAYSTYLE_PLUS_OPTIONS, DEFAULT_APPLIED_FILTERS, createDefaultAttributeRanges } from "@/features/scout/config/options";
import { formatInteger } from "@/features/scout/lib/format";
import {
  buildFiltersFromDraft,
  hasMeaningfulFilters,
  removeCurrentClubFromAppliedFilters,
  createSavedQueryTitle,
  sortLeagueOptions,
  sortPlayersForDisplay,
  getCurrentClubFilteredTotal,
  countAttributeFilters,
  countAttributeFiltersInDraft,
  hasSplitPositionFilters,
  isPlayStylePlus,
} from "@/features/scout/lib/filters";
import { hasVisibleFitScore } from "@/features/scout/lib/format";
import { ScoutScoreContext } from "@/features/scout/lib/scoutScore";
import type { AppliedScoutFilters, DraftFilters, ScoutSortBy, ScoutSortOrder } from "@/features/scout/ui/types";
import { PositionFilterGrid, FilterNumberInput, AdvancedAttributeFilters, MultiSelectCombobox } from "@/features/scout/ui/components/search";
import { SortHeaderButton, FeaturedPlayer, PlayerTableRow, PlayerMobileRow } from "@/features/scout/ui/components/results";
import { PlayerComparisonLauncher } from "@/features/scout/ui/components/comparison";

interface SearchSectionProps {
  saveId: string | null;
  currentClub: string;
  activePlaybook: ApiPlaybook | null;
  draft: DraftFilters;
  setDraft: (updater: DraftFilters | ((prev: DraftFilters) => DraftFilters)) => void;
  appliedFilters: AppliedScoutFilters | null;
  setAppliedFilters: (updater: AppliedScoutFilters | null | ((prev: AppliedScoutFilters | null) => AppliedScoutFilters | null)) => void;
  showAdvancedAttributes: boolean;
  setShowAdvancedAttributes: (updater: boolean | ((prev: boolean) => boolean)) => void;
  comparedPlayers: Fc26Player[];
  comparedPlayerIds: Set<number>;
  shortlistedPlayerIds: Set<number>;
  onToggleCompare: (player: Fc26Player) => void;
  onRemoveCompared: (sofifaId: number) => void;
  onClearComparison: () => void;
  onOpenComparison: () => void;
  onOpenDetails: (sofifaId: number) => void;
  onToggleShortlist: (player: Fc26Player) => void;
  knownPlayersRef: MutableRefObject<Map<number, Fc26Player>>;
  onPlayersChange: (players: Fc26Player[]) => void;
  onStatsChange: (stats: { total: number; currentPage: number; totalPages: number }) => void;
}

export function SearchSection({
  saveId,
  currentClub,
  activePlaybook,
  draft,
  setDraft,
  appliedFilters,
  setAppliedFilters,
  showAdvancedAttributes,
  setShowAdvancedAttributes,
  comparedPlayers,
  comparedPlayerIds,
  shortlistedPlayerIds,
  onToggleCompare,
  onRemoveCompared,
  onClearComparison,
  onOpenComparison,
  onOpenDetails,
  onToggleShortlist,
  knownPlayersRef,
  onPlayersChange,
  onStatsChange,
}: SearchSectionProps) {
  const { openFitBreakdown } = useContext(ScoutScoreContext);
  const { data, isError, isFetching, isLoading, error, refetch } = useFc26Players(appliedFilters, saveId);
  const { isRateLimited: isScoutRateLimited, retryAfterSeconds: scoutRetryAfterSeconds } = useRateLimitBackoff(error);
  const { data: filterMetadata, isLoading: isLoadingFilters } = useFc26PlayerFilters();
  const createSavedSearch = useCreateSavedSearch();

  const hasSearched = !!appliedFilters;
  const hasSaveContext = Boolean(saveId);

  const rawApiPlayers = useMemo(() => (hasSearched ? data?.players ?? [] : []), [data?.players, hasSearched]);
  const apiPlayers = useMemo(() => filterOutCurrentClubPlayers(rawApiPlayers, currentClub), [currentClub, rawApiPlayers]);
  const players = useMemo(() => sortPlayersForDisplay(apiPlayers, appliedFilters), [apiPlayers, appliedFilters]);
  const total = hasSearched ? getCurrentClubFilteredTotal(data?.total ?? 0, rawApiPlayers, apiPlayers) : 0;
  const limit = hasSearched ? data?.limit ?? appliedFilters?.limit ?? 20 : 20;
  const offset = hasSearched ? data?.offset ?? appliedFilters?.offset ?? 0 : 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const visibleStart = total === 0 || players.length === 0 ? 0 : Math.min(offset + 1, total);
  const visibleEnd = total === 0 || players.length === 0 ? 0 : Math.min(offset + players.length, total);

  const activeFilterCount = useMemo(() => {
    if (!appliedFilters) return 0;
    let count = 0;
    const splitPositionsApplied = hasSplitPositionFilters(appliedFilters);
    if (appliedFilters.primaryPositions?.length) count += 1;
    if (appliedFilters.secondaryPositions?.length) count += 1;
    if (!splitPositionsApplied && appliedFilters.positions?.length) count += 1;
    if (appliedFilters.nations?.length) count += 1;
    if (appliedFilters.leagues?.length) count += 1;
    if (appliedFilters.clubs?.length) count += 1;
    if (typeof appliedFilters.minOvr === "number") count += 1;
    if (typeof appliedFilters.maxOvr === "number") count += 1;
    if (typeof appliedFilters.minAge === "number") count += 1;
    if (typeof appliedFilters.maxAge === "number") count += 1;
    if (typeof appliedFilters.minPotential === "number") count += 1;
    if (typeof appliedFilters.maxPotential === "number") count += 1;
    if (typeof appliedFilters.minMarketValue === "number") count += 1;
    if (typeof appliedFilters.maxMarketValue === "number") count += 1;
    count += countAttributeFilters(appliedFilters);
    if (appliedFilters.preferredFoot) count += 1;
    if (appliedFilters.objective && appliedFilters.objective !== "balanced") count += 1;
    if (appliedFilters.traits?.some((trait) => !isPlayStylePlus(trait))) count += 1;
    if (appliedFilters.traits?.some(isPlayStylePlus)) count += 1;
    return count;
  }, [appliedFilters]);
  const draftAttributeFilterCount = useMemo(() => countAttributeFiltersInDraft(draft.attributeRanges), [draft.attributeRanges]);
  const featuredPlayers = players.slice(0, 3);
  const hasFitScores = useMemo(() => players.some(hasVisibleFitScore), [players]);

  const positionOptions = useMemo(
    () => (filterMetadata?.positions?.length ? filterMetadata.positions : PLAYER_POSITIONS).filter((position) => position !== "SA"),
    [filterMetadata?.positions]
  );
  const nationOptions = useMemo(() => [...(filterMetadata?.nations ?? [])].sort((a, b) => a.localeCompare(b, "pt-BR")), [filterMetadata?.nations]);
  const leagueOptions = useMemo(() => sortLeagueOptions(filterMetadata?.leagues ?? []), [filterMetadata?.leagues]);
  const clubOptions = useMemo(() => {
    if (draft.leagues.length === 0) return [];
    const clubsByLeague = filterMetadata?.clubsByLeague ?? {};
    const options = new Set<string>();
    draft.leagues.forEach((league) => {
      clubsByLeague[league]?.forEach((club) => options.add(club));
    });
    return [...options]
      .filter((club) => !isSameClubName(club, currentClub))
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [currentClub, draft.leagues, filterMetadata?.clubsByLeague]);

  useEffect(() => {
    for (const player of players) knownPlayersRef.current.set(player.sofifaId, player);
    onPlayersChange(players);
  }, [players, knownPlayersRef, onPlayersChange]);

  useEffect(() => {
    onStatsChange({ total, currentPage, totalPages });
  }, [total, currentPage, totalPages, onStatsChange]);

  useEffect(() => {
    setDraft((current) => {
      const clubs = current.clubs.filter((club) => !isSameClubName(club, currentClub));
      return clubs.length === current.clubs.length ? current : { ...current, clubs };
    });
  }, [currentClub, setDraft]);

  const togglePrimaryPosition = (position: PlayerPosition) => {
    setDraft((current) => ({
      ...current,
      primaryPositions: current.primaryPositions.includes(position)
        ? current.primaryPositions.filter((item) => item !== position)
        : [...current.primaryPositions, position],
    }));
  };

  const toggleSecondaryPosition = (position: PlayerPosition) => {
    setDraft((current) => ({
      ...current,
      secondaryPositions: current.secondaryPositions.includes(position)
        ? current.secondaryPositions.filter((item) => item !== position)
        : [...current.secondaryPositions, position],
    }));
  };

  const applyFilters = () => {
    const draftFilters = buildFiltersFromDraft(draft);
    if (!draftFilters) return;
    const nextFilters = removeCurrentClubFromAppliedFilters(draftFilters, currentClub);
    if (!hasMeaningfulFilters(nextFilters)) {
      toast.error("Choose at least one filter to start the scout.", { duration: 4000 });
      return;
    }
    setAppliedFilters(nextFilters);
  };

  const clearFilters = () => {
    setDraft(() => ({
      primaryPositions: [],
      secondaryPositions: [],
      nations: [],
      leagues: [],
      clubs: [],
      minOvr: "",
      maxOvr: "",
      minAge: "",
      maxAge: "",
      minPotential: "",
      maxPotential: "",
      minMarketValue: "",
      maxMarketValue: "",
      preferredFoot: "",
      objective: "balanced",
      playStyles: [],
      playStylesPlus: [],
      attributeRanges: createDefaultAttributeRanges(),
      limit: "20",
    }));
    setAppliedFilters(null);
    onClearComparison();
  };

  const saveCurrentQuery = () => {
    if (!appliedFilters || isLoading || isFetching || isError) {
      toast.error("Start a valid search before saving the query.", { duration: 4000 });
      return;
    }
    if (!saveId) {
      toast.error("Open a save to store scout queries.", { duration: 4000 });
      return;
    }
    createSavedSearch.mutate(
      {
        saveId,
        data: { name: createSavedQueryTitle(appliedFilters), filters: { ...appliedFilters, offset: 0 } },
      },
      {
        onSuccess: () => toast.success("Query saved in Scout folders.", { duration: 3000 }),
        onError: (err) => toast.error(extractErrorMessage(err), { duration: 5000 }),
      }
    );
  };

  const goToOffset = (nextOffset: number) => {
    setAppliedFilters((current) => ({
      ...DEFAULT_APPLIED_FILTERS,
      ...current,
      offset: Math.max(nextOffset, 0),
    }));
  };

  const toggleSort = (sortBy: ScoutSortBy) => {
    setAppliedFilters((current) => {
      if (!current) return current;
      const sortOrder: ScoutSortOrder =
        current.sortBy === sortBy && current.sortOrder === "desc" ? "asc" : "desc";
      return { ...DEFAULT_APPLIED_FILTERS, ...current, sortBy, sortOrder, offset: 0 };
    });
  };

  return (
    <div className="min-w-0 space-y-4">
      <section className="card-gamer p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-accent/20 bg-accent/10 text-accent">
              <Search size={19} />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold leading-none">Search players</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasSearched
                  ? `${visibleStart}-${visibleEnd} of ${formatInteger(total)} players`
                  : "Set filters to start the search"}
              </p>
              {hasSearched && typeof appliedFilters?.maxMarketValue === "number" && (
                <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                  Filtered by your value ceiling — pricier players are excluded.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="flex h-9 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw size={15} />
              Clear
            </button>
            <button
              type="button"
              disabled={!hasSearched || isLoading || isFetching || isError}
              onClick={saveCurrentQuery}
              className="flex h-9 items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Save size={15} />
              Save
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Search size={15} />
              Search
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <PositionFilterGrid
            title="Main position"
            description="Uses the first position shown on the player card."
            positions={positionOptions}
            selected={draft.primaryPositions}
            onToggle={togglePrimaryPosition}
            onClear={() => setDraft((current) => ({ ...current, primaryPositions: [] }))}
          />

          <PositionFilterGrid
            title="Secondary positions"
            description="Uses extra positions shown after the main one."
            positions={positionOptions}
            selected={draft.secondaryPositions}
            onToggle={toggleSecondaryPosition}
            onClear={() => setDraft((current) => ({ ...current, secondaryPositions: [] }))}
          />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FilterNumberInput label="Min OVR" value={draft.minOvr} min={1} max={99} onChange={(minOvr) => setDraft((current) => ({ ...current, minOvr }))} />
            <FilterNumberInput label="Max OVR" value={draft.maxOvr} min={1} max={99} onChange={(maxOvr) => setDraft((current) => ({ ...current, maxOvr }))} />
            <FilterNumberInput label="Min age" value={draft.minAge} min={15} max={45} onChange={(minAge) => setDraft((current) => ({ ...current, minAge }))} />
            <FilterNumberInput label="Max age" value={draft.maxAge} min={15} max={45} onChange={(maxAge) => setDraft((current) => ({ ...current, maxAge }))} />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_160px]">
            <FilterNumberInput label="Min potential" value={draft.minPotential} min={1} max={99} onChange={(minPotential) => setDraft((current) => ({ ...current, minPotential }))} />
            <FilterNumberInput label="Max potential" value={draft.maxPotential} min={1} max={99} onChange={(maxPotential) => setDraft((current) => ({ ...current, maxPotential }))} />
            <FilterNumberInput
              label="Min value (€M)"
              value={draft.minMarketValue}
              min={0}
              placeholder="Min €M"
              allowDecimal
              onChange={(minMarketValue) => setDraft((current) => ({ ...current, minMarketValue }))}
            />
            <FilterNumberInput
              label="Max value (€M)"
              value={draft.maxMarketValue}
              min={0}
              placeholder="Max €M"
              allowDecimal
              onChange={(maxMarketValue) => setDraft((current) => ({ ...current, maxMarketValue }))}
            />
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Results</label>
              <select
                value={draft.limit}
                onChange={(event) => setDraft((current) => ({ ...current, limit: event.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {LIMIT_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option} per page</option>
                ))}
              </select>
            </div>
          </div>

          <div className={`grid gap-3 ${hasSaveContext ? "lg:grid-cols-[180px_190px_minmax(0,1fr)_minmax(0,1fr)]" : "lg:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]"}`}>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Preferred foot</label>
              <select
                value={draft.preferredFoot}
                onChange={(event) => setDraft((current) => ({ ...current, preferredFoot: event.target.value as DraftFilters["preferredFoot"] }))}
                className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Any foot</option>
                <option value="Left">Left foot</option>
                <option value="Right">Right foot</option>
              </select>
            </div>
            {hasSaveContext && (
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Objective</label>
                <select
                  value={draft.objective}
                  onChange={(event) => setDraft((current) => ({ ...current, objective: event.target.value as Fc26FitObjective }))}
                  className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {FIT_OBJECTIVE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}
            <MultiSelectCombobox
              label="PlayStyles"
              placeholder="Select PlayStyles..."
              emptyLabel="No PlayStyle found"
              options={PLAYSTYLE_OPTIONS}
              selected={draft.playStyles}
              onChange={(playStyles) => setDraft((current) => ({ ...current, playStyles }))}
            />
            <MultiSelectCombobox
              label="PlayStyles+"
              placeholder="Select PlayStyles+..."
              emptyLabel="No PlayStyle+ found"
              options={PLAYSTYLE_PLUS_OPTIONS}
              selected={draft.playStylesPlus}
              onChange={(playStylesPlus) => setDraft((current) => ({ ...current, playStylesPlus }))}
            />
          </div>

          <AdvancedAttributeFilters
            open={showAdvancedAttributes}
            activeCount={draftAttributeFilterCount}
            ranges={draft.attributeRanges}
            onToggle={() => setShowAdvancedAttributes((current) => !current)}
            onClear={() => setDraft((current) => ({ ...current, attributeRanges: createDefaultAttributeRanges() }))}
            onChange={(field, side, value) =>
              setDraft((current) => ({
                ...current,
                attributeRanges: {
                  ...current.attributeRanges,
                  [field]: {
                    ...(current.attributeRanges[field] ?? { min: "", max: "" }),
                    [side]: value,
                  },
                },
              }))
            }
          />

          <div className="grid gap-3 lg:grid-cols-3">
            <MultiSelectCombobox
              label="Nationalities"
              placeholder="Search nationality..."
              emptyLabel={isLoadingFilters ? "Loading nationalities..." : "No nationality found"}
              options={nationOptions}
              selected={draft.nations}
              onChange={(nations) => setDraft((current) => ({ ...current, nations }))}
            />
            <MultiSelectCombobox
              label="Leagues"
              placeholder="Search league..."
              emptyLabel={isLoadingFilters ? "Loading leagues..." : "No league found"}
              options={leagueOptions}
              selected={draft.leagues}
              onChange={(leagues) => {
                const nextClubOptions = new Set<string>();
                const clubsByLeague = filterMetadata?.clubsByLeague ?? {};
                leagues.forEach((league) => {
                  clubsByLeague[league]?.forEach((club) => nextClubOptions.add(club));
                });
                setDraft((current) => ({
                  ...current,
                  leagues,
                  clubs: current.clubs.filter((club) => nextClubOptions.has(club) && !isSameClubName(club, currentClub)),
                }));
              }}
            />
            <MultiSelectCombobox
              label="Clubs"
              placeholder={draft.leagues.length ? "Search club in league..." : "Select a league first"}
              emptyLabel={isLoadingFilters ? "Loading clubs..." : "No club found"}
              options={clubOptions}
              selected={draft.clubs}
              onChange={(clubs) => setDraft((current) => ({ ...current, clubs }))}
              disabled={draft.leagues.length === 0}
            />
          </div>
        </div>
      </section>

      {hasSearched && featuredPlayers.length > 0 && !isError && (
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {featuredPlayers.map((player, index) => (
            <FeaturedPlayer key={player.sofifaId} player={player} rank={index + 1} onSelect={() => onOpenDetails(player.sofifaId)} />
          ))}
        </section>
      )}

      {hasSearched && !isError && (players.length > 0 || comparedPlayers.length > 0) && (
        <PlayerComparisonLauncher
          players={comparedPlayers}
          activePlaybook={activePlaybook}
          onClear={onClearComparison}
          onOpenComparison={onOpenComparison}
          onOpenDetails={onOpenDetails}
          onRemove={onRemoveCompared}
        />
      )}

      <section className="card-gamer overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-bold leading-none">Players found</h3>
            {hasSearched && (
              <p className="mt-1 text-sm text-muted-foreground">Compare found profiles and open the detail panel to see the full report.</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={offset <= 0 || isFetching}
              onClick={() => goToOffset(offset - limit)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[92px] text-center font-display text-sm font-bold text-foreground">
              {currentPage}/{totalPages}
            </span>
            <button
              type="button"
              disabled={offset + limit >= total || isFetching}
              onClick={() => goToOffset(offset + limit)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {!hasSearched ? (
          <div className="p-6 text-center">
            <p className="font-display text-lg font-semibold text-foreground">No scout started</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              The list stays empty until you apply filters for position, OVR, age, potential, pace, height, PlayStyles, PlayStyles+, nationality, league or club.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 size={20} className="animate-spin" />
            Loading players...
          </div>
        ) : isError ? (
          isScoutRateLimited ? (
            <div className="p-6 text-center">
              <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-md border border-warning/25 bg-warning/10 px-3 py-2 text-sm text-warning">
                <LockKeyhole size={15} className="shrink-0" />
                <span>
                  Too many scout searches.{" "}
                  {scoutRetryAfterSeconds && scoutRetryAfterSeconds > 0
                    ? `Wait ${scoutRetryAfterSeconds}s before trying again.`
                    : "Please wait a moment before trying again."}
                </span>
              </div>
              <button
                type="button"
                disabled={!!scoutRetryAfterSeconds && scoutRetryAfterSeconds > 0}
                onClick={() => void refetch()}
                className="mt-5 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw size={15} />
                Try again
              </button>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="font-display text-lg font-semibold text-foreground">Could not load scout</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{extractErrorMessage(error)}</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-5 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <RotateCcw size={15} />
                Try again
              </button>
            </div>
          )
        ) : players.length === 0 ? (
          <div className="p-6 text-center">
            <p className="font-display text-lg font-semibold text-foreground">No player matches these filters</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Broaden the OVR, age or potential range to expand the search.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea scrollbars="horizontal" className="hidden w-full lg:block" viewportClassName="pb-3">
              <table className={`w-full text-left ${hasFitScores ? "min-w-[1420px]" : "min-w-[1320px]"}`}>
                <thead className="bg-muted/35">
                  <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Player</th>
                    <th className="px-4 py-3 font-semibold">Positions</th>
                    {hasFitScores && (
                      <th
                        className="px-4 py-3 text-center font-semibold"
                        aria-sort={appliedFilters?.sortBy === "fitScore" ? (appliedFilters.sortOrder === "asc" ? "ascending" : "descending") : "none"}
                      >
                        <SortHeaderButton
                          label="Fit"
                          sortBy="fitScore"
                          activeSortBy={appliedFilters?.sortBy}
                          sortOrder={appliedFilters?.sortOrder}
                          onSort={toggleSort}
                        />
                      </th>
                    )}
                    <th
                      className="px-4 py-3 text-center font-semibold"
                      aria-sort={appliedFilters?.sortBy === "ovr" ? (appliedFilters.sortOrder === "asc" ? "ascending" : "descending") : "none"}
                    >
                      <SortHeaderButton
                        label="OVR"
                        sortBy="ovr"
                        activeSortBy={appliedFilters?.sortBy}
                        sortOrder={appliedFilters?.sortOrder}
                        onSort={toggleSort}
                      />
                    </th>
                    <th
                      className="px-4 py-3 text-center font-semibold"
                      aria-sort={appliedFilters?.sortBy === "potential" ? (appliedFilters.sortOrder === "asc" ? "ascending" : "descending") : "none"}
                    >
                      <SortHeaderButton
                        label="Pot."
                        sortBy="potential"
                        activeSortBy={appliedFilters?.sortBy}
                        sortOrder={appliedFilters?.sortOrder}
                        onSort={toggleSort}
                      />
                    </th>
                    <th className="px-4 py-3 font-semibold">Profile</th>
                    <th className="px-4 py-3 font-semibold">Attributes</th>
                    <th className="px-4 py-3 font-semibold">Club</th>
                    <th className="px-4 py-3 text-right font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <PlayerTableRow
                      key={player.sofifaId}
                      player={player}
                      showFitScore={hasFitScores}
                      isCompareSelected={comparedPlayerIds.has(player.sofifaId)}
                      isShortlisted={shortlistedPlayerIds.has(player.sofifaId)}
                      onSelect={() => onOpenDetails(player.sofifaId)}
                      onToggleCompare={() => onToggleCompare(player)}
                      onToggleShortlist={() => onToggleShortlist(player)}
                      onOpenFitBreakdown={() => openFitBreakdown(player)}
                    />
                  ))}
                </tbody>
              </table>
            </ScrollArea>

            <div className="divide-y divide-border lg:hidden">
              {players.map((player) => (
                <PlayerMobileRow
                  key={player.sofifaId}
                  player={player}
                  showFitScore={hasFitScores}
                  isCompareSelected={comparedPlayerIds.has(player.sofifaId)}
                  isShortlisted={shortlistedPlayerIds.has(player.sofifaId)}
                  onSelect={() => onOpenDetails(player.sofifaId)}
                  onToggleCompare={() => onToggleCompare(player)}
                  onToggleShortlist={() => onToggleShortlist(player)}
                  onOpenFitBreakdown={() => openFitBreakdown(player)}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
