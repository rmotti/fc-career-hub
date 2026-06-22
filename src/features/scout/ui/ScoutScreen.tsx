import { useCallback, useMemo, useRef, useState, type ElementType } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Archive,
  Bot,
  GitCompareArrows,
  ListChecks,
  LockKeyhole,
  Search,
  SlidersHorizontal,
  Target,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage, type ApiShortlistItem, type Fc26Player, type ShortlistFc26Player } from "@/shared/api/client";
import { filterOutCurrentClubPlayers } from "@/features/scout/model/currentClubFilter";
import { useShortlist, useAddShortlistItem, useRemoveShortlistItem } from "@/features/scout/model/useShortlist";
import { useSavedSearches } from "@/features/scout/model/useSavedSearches";
import { usePlaybooks } from "@/features/playbooks/model/usePlaybooks";
import { useSave } from "@/features/saves/model/useSaves";
import { useFc26Player } from "@/features/scout/model/useFc26Players";
import { formatInteger } from "@/features/scout/lib/format";
import { shortlistEmbedToPlayer, draftFromFilters, removeCurrentClubFromAppliedFilters, apiSavedSearchToQuery, countAttributeFilters, hasSplitPositionFilters, isPlayStylePlus } from "@/features/scout/lib/filters";
import { groupShortlistPlayers, getAverageOvr } from "@/features/scout/lib/shortlist";
import { ScoutScoreContext, type ScoutScoreContextValue } from "@/features/scout/lib/scoutScore";
import { createDefaultDraft } from "@/features/scout/config/options";
import type { AppliedScoutFilters, DraftFilters, SavedScoutQuery, ScoutSection } from "@/features/scout/ui/types";
import { PlayerDetailDrawer } from "@/features/scout/ui/components/detail";
import { PlayerComparisonModal } from "@/features/scout/ui/components/comparison";
import { FitBreakdownModal, ScoreBreakdownModal } from "@/features/scout/ui/components/score";
import { AssistantCoachSection } from "@/features/scout/ui/sections/AssistantCoachSection";
import { ArchiveSection } from "@/features/scout/ui/sections/ArchiveSection";
import { ShortlistSection } from "@/features/scout/ui/sections/ShortlistSection";
import { SearchSection } from "@/features/scout/ui/sections/SearchSection";

export type { ScoutSection } from "@/features/scout/ui/types";

interface Props {
  section: ScoutSection;
  saveId?: string | null;
  currentClub: string;
  currentSeason: string;
}

function SummaryPill({ label, value, icon: Icon }: { label: string; value: string | number; icon: ElementType }) {
  return (
    <div className="flex min-h-[46px] min-w-0 items-center gap-2 rounded-md border border-border bg-muted/35 px-3">
      <Icon size={15} className="shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p className="truncate font-display text-base font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

const ScoutScreen = ({ section, saveId, currentClub, currentSeason }: Props) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<DraftFilters>(() => createDefaultDraft());
  const [appliedFilters, setAppliedFilters] = useState<AppliedScoutFilters | null>(null);
  const [selectedSofifaId, setSelectedSofifaId] = useState<number | null>(null);
  const [comparisonPlayers, setComparisonPlayers] = useState<Fc26Player[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [showAdvancedAttributes, setShowAdvancedAttributes] = useState(false);
  const [breakdownPlayer, setBreakdownPlayer] = useState<Fc26Player | null>(null);
  const [fitBreakdownPlayer, setFitBreakdownPlayer] = useState<Fc26Player | null>(null);
  const [currentSearchPlayers, setCurrentSearchPlayers] = useState<Fc26Player[]>([]);
  const [searchStats, setSearchStats] = useState({ total: 0, currentPage: 1, totalPages: 1 });
  const knownPlayersRef = useRef<Map<number, Fc26Player>>(new Map());

  const { data: shortlistData } = useShortlist(saveId);
  const { data: savedSearchData } = useSavedSearches(saveId);
  const addShortlistItem = useAddShortlistItem();
  const removeShortlistItem = useRemoveShortlistItem();
  const { data: playbooksData } = usePlaybooks(saveId ?? null);
  const activePlaybook =
    playbooksData?.playbooks.find((p) => p.isDefault) ?? playbooksData?.defaultPlaybook ?? null;
  const { data: activeSave } = useSave(saveId ?? null);
  const saveBudgetMillions = activeSave?.budget != null ? activeSave.budget / 1_000_000 : null;

  const scoreContextValue = useMemo<ScoutScoreContextValue>(
    () => ({
      budgetMillions: saveBudgetMillions,
      openBreakdown: setBreakdownPlayer,
      openFitBreakdown: setFitBreakdownPlayer,
    }),
    [saveBudgetMillions]
  );

  const {
    data: selectedPlayerDetails,
    isError: isSelectedPlayerError,
    isLoading: isLoadingSelectedPlayer,
    error: selectedPlayerError,
  } = useFc26Player(selectedSofifaId);

  const selectedPlayerPreview = useMemo(
    () => currentSearchPlayers.find((player) => player.sofifaId === selectedSofifaId) ?? null,
    [currentSearchPlayers, selectedSofifaId]
  );
  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerDetails) return selectedPlayerPreview;
    if (!selectedPlayerPreview) return selectedPlayerDetails;
    return {
      ...selectedPlayerDetails,
      fitScore: selectedPlayerDetails.fitScore ?? selectedPlayerPreview.fitScore,
      fitConfidence: selectedPlayerDetails.fitConfidence ?? selectedPlayerPreview.fitConfidence,
      fitProfileSize: selectedPlayerDetails.fitProfileSize ?? selectedPlayerPreview.fitProfileSize,
    };
  }, [selectedPlayerDetails, selectedPlayerPreview]);

  const shortlistItems = useMemo(() => shortlistData?.items ?? [], [shortlistData]);
  const shortlistItemIdBySofifa = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of shortlistItems) {
      if (item.fc26Player) map.set(item.fc26Player.sofifaId, item.id);
    }
    return map;
  }, [shortlistItems]);
  const shortlistPlayers = useMemo<Fc26Player[]>(
    () =>
      shortlistItems
        .filter((item): item is ApiShortlistItem & { fc26Player: ShortlistFc26Player } => !!item.fc26Player)
        .map((item) => knownPlayersRef.current.get(item.fc26Player.sofifaId) ?? shortlistEmbedToPlayer(item.fc26Player)),
    [shortlistItems]
  );
  const shortlistedPlayerIds = useMemo(() => new Set(shortlistPlayers.map((player) => player.sofifaId)), [shortlistPlayers]);
  const visibleShortlistPlayers = useMemo(() => filterOutCurrentClubPlayers(shortlistPlayers, currentClub), [shortlistPlayers, currentClub]);
  const shortlistGroups = useMemo(() => groupShortlistPlayers(visibleShortlistPlayers), [visibleShortlistPlayers]);
  const shortlistAverageOvr = useMemo(() => getAverageOvr(visibleShortlistPlayers), [visibleShortlistPlayers]);

  const savedQueries = useMemo<SavedScoutQuery[]>(
    () => (savedSearchData?.items ?? []).map((item) => apiSavedSearchToQuery(item, currentClub, currentSeason)),
    [savedSearchData, currentClub, currentSeason]
  );

  const visibleComparisonPlayers = useMemo(() => filterOutCurrentClubPlayers(comparisonPlayers, currentClub), [comparisonPlayers, currentClub]);
  const comparedPlayers = useMemo(
    () =>
      visibleComparisonPlayers.map(
        (cp) => currentSearchPlayers.find((p) => p.sofifaId === cp.sofifaId) ?? cp
      ),
    [currentSearchPlayers, visibleComparisonPlayers]
  );
  const comparedPlayerIds = useMemo(() => new Set(comparedPlayers.map((p) => p.sofifaId)), [comparedPlayers]);

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
    if (appliedFilters.traits?.some((t) => !isPlayStylePlus(t))) count += 1;
    if (appliedFilters.traits?.some(isPlayStylePlus)) count += 1;
    return count;
  }, [appliedFilters]);

  const toggleComparePlayer = useCallback((player: Fc26Player) => {
    setComparisonPlayers((current) =>
      current.some((p) => p.sofifaId === player.sofifaId)
        ? current.filter((p) => p.sofifaId !== player.sofifaId)
        : [...current, player]
    );
  }, []);

  const removeComparedPlayer = useCallback((sofifaId: number) => {
    setComparisonPlayers((current) => {
      const next = current.filter((p) => p.sofifaId !== sofifaId);
      if (next.length < 2) setIsComparisonOpen(false);
      return next;
    });
  }, []);

  const compareShortlistGroup = useCallback((players: Fc26Player[]) => {
    if (players.length < 2) return;
    setComparisonPlayers(players);
    setIsComparisonOpen(true);
  }, []);

  const toggleShortlistPlayer = useCallback((player: Fc26Player) => {
    if (!saveId) {
      toast.error("Open a save to use the Shortlist.", { duration: 4000 });
      return;
    }
    const itemId = shortlistItemIdBySofifa.get(player.sofifaId);
    if (itemId) {
      setComparisonPlayers((current) => current.filter((p) => p.sofifaId !== player.sofifaId));
      removeShortlistItem.mutate(
        { saveId, itemId },
        {
          onSuccess: () => toast.success("Player removed from Shortlist.", { duration: 2500 }),
          onError: (err) => toast.error(extractErrorMessage(err), { duration: 5000 }),
        }
      );
      return;
    }
    knownPlayersRef.current.set(player.sofifaId, player);
    addShortlistItem.mutate(
      { saveId, fc26PlayerId: player.id },
      {
        onSuccess: () => toast.success("Player sent to Shortlist.", { duration: 2500 }),
        onError: (err) => toast.error(extractErrorMessage(err), { duration: 5000 }),
      }
    );
  }, [saveId, shortlistItemIdBySofifa, removeShortlistItem, addShortlistItem]);

  const removeShortlistPlayer = useCallback((sofifaId: number) => {
    if (!saveId) return;
    const itemId = shortlistItemIdBySofifa.get(sofifaId);
    setComparisonPlayers((current) => {
      const next = current.filter((p) => p.sofifaId !== sofifaId);
      if (next.length < 2) setIsComparisonOpen(false);
      return next;
    });
    if (!itemId) return;
    removeShortlistItem.mutate(
      { saveId, itemId },
      {
        onSuccess: () => toast.success("Player removed from Shortlist.", { duration: 2500 }),
        onError: (err) => toast.error(extractErrorMessage(err), { duration: 5000 }),
      }
    );
  }, [saveId, shortlistItemIdBySofifa, removeShortlistItem]);

  const editQuery = useCallback((query: SavedScoutQuery) => {
    const filters = removeCurrentClubFromAppliedFilters(query.filters, currentClub);
    setDraft(draftFromFilters(filters));
    setAppliedFilters({ ...filters, offset: 0 });
    setComparisonPlayers([]);
    setIsComparisonOpen(false);
    navigate("/scout/filtros");
  }, [currentClub, navigate]);

  const handlePlayersChange = useCallback((players: Fc26Player[]) => {
    setCurrentSearchPlayers(players);
  }, []);

  const handleStatsChange = useCallback((stats: { total: number; currentPage: number; totalPages: number }) => {
    setSearchStats(stats);
  }, []);

  const isAiSection = section === "ai";
  const isArchiveSection = section === "archive";
  const isShortlistSection = section === "shortlist";
  const isSearchSection = !isAiSection && !isArchiveSection && !isShortlistSection;

  const pageTitle = isAiSection
    ? "AIssistent Coach"
    : isArchiveSection
      ? "Saved queries"
      : isShortlistSection
        ? "Shortlist"
        : "Search players";

  return (
    <ScoutScoreContext.Provider value={scoreContextValue}>
      <div className="mx-auto w-full max-w-[1500px] space-y-5">
        <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {currentClub} · {currentSeason} · PRO
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-3xl font-bold leading-none tracking-tight text-foreground">{pageTitle}</h2>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {isAiSection ? <Bot size={13} /> : isArchiveSection ? <Archive size={13} /> : isShortlistSection ? <ListChecks size={13} /> : <Search size={13} />}
                {isAiSection ? "PRO" : isArchiveSection ? "Folder archive" : isShortlistSection ? "Shortlist" : "Dataset FC 26"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {isAiSection ? (
              <>
                <SummaryPill label="Mode" value="Coach" icon={Bot} />
                <SummaryPill label="Status" value="Preview" icon={LockKeyhole} />
              </>
            ) : isArchiveSection ? (
              <>
                <SummaryPill label="Folders" value={savedQueries.length} icon={Archive} />
              </>
            ) : isShortlistSection ? (
              <>
                <SummaryPill label="In list" value={visibleShortlistPlayers.length} icon={ListChecks} />
                <SummaryPill label="Positions" value={shortlistGroups.length} icon={Target} />
                <SummaryPill label="Avg. OVR" value={shortlistAverageOvr ?? "—"} icon={Activity} />
                <SummaryPill label="Comparing" value={comparedPlayers.length} icon={GitCompareArrows} />
              </>
            ) : (
              <>
                <SummaryPill label="Found" value={formatInteger(searchStats.total)} icon={UsersRound} />
                <SummaryPill label="Active filters" value={activeFilterCount} icon={SlidersHorizontal} />
                <SummaryPill label="Comparing" value={comparedPlayers.length} icon={Activity} />
                <SummaryPill label="Page" value={`${searchStats.currentPage}/${searchStats.totalPages}`} icon={Target} />
              </>
            )}
          </div>
        </div>

        <section
          className={
            isArchiveSection
              ? "grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start"
              : "space-y-4"
          }
        >
          {isAiSection && <AssistantCoachSection saveId={saveId ?? null} />}

          {isArchiveSection && (
            <ArchiveSection
              saveId={saveId ?? null}
              currentClub={currentClub}
              currentSeason={currentSeason}
              shortlistedPlayerIds={shortlistedPlayerIds}
              onToggleShortlist={toggleShortlistPlayer}
              onOpenDetails={setSelectedSofifaId}
              onEditQuery={editQuery}
            />
          )}

          {isShortlistSection && (
            <ShortlistSection
              players={visibleShortlistPlayers}
              groups={shortlistGroups}
              comparedPlayers={comparedPlayers}
              comparedPlayerIds={comparedPlayerIds}
              activePlaybook={activePlaybook}
              onToggleCompare={toggleComparePlayer}
              onClearComparison={() => { setComparisonPlayers([]); setIsComparisonOpen(false); }}
              onOpenComparison={() => setIsComparisonOpen(true)}
              onOpenDetails={setSelectedSofifaId}
              onRemovePlayer={removeShortlistPlayer}
              onCompareGroup={compareShortlistGroup}
              onGoToSearch={() => navigate("/scout/filtros")}
            />
          )}

          {isSearchSection && (
            <SearchSection
              saveId={saveId ?? null}
              currentClub={currentClub}
              activePlaybook={activePlaybook}
              draft={draft}
              setDraft={setDraft}
              appliedFilters={appliedFilters}
              setAppliedFilters={setAppliedFilters}
              showAdvancedAttributes={showAdvancedAttributes}
              setShowAdvancedAttributes={setShowAdvancedAttributes}
              comparedPlayers={comparedPlayers}
              comparedPlayerIds={comparedPlayerIds}
              shortlistedPlayerIds={shortlistedPlayerIds}
              onToggleCompare={toggleComparePlayer}
              onRemoveCompared={removeComparedPlayer}
              onClearComparison={() => { setComparisonPlayers([]); setIsComparisonOpen(false); }}
              onOpenComparison={() => setIsComparisonOpen(true)}
              onOpenDetails={setSelectedSofifaId}
              onToggleShortlist={toggleShortlistPlayer}
              knownPlayersRef={knownPlayersRef}
              onPlayersChange={handlePlayersChange}
              onStatsChange={handleStatsChange}
            />
          )}
        </section>

        {selectedSofifaId && (
          <PlayerDetailDrawer
            player={selectedPlayer}
            isLoading={isLoadingSelectedPlayer}
            isError={isSelectedPlayerError}
            error={selectedPlayerError}
            onClose={() => setSelectedSofifaId(null)}
          />
        )}

        {isComparisonOpen && (
          <PlayerComparisonModal
            players={comparedPlayers}
            activePlaybook={activePlaybook}
            budgetMillions={saveBudgetMillions}
            onClose={() => setIsComparisonOpen(false)}
            onOpenDetails={(sofifaId) => {
              setIsComparisonOpen(false);
              setSelectedSofifaId(sofifaId);
            }}
            onRemove={removeComparedPlayer}
          />
        )}

        {breakdownPlayer && (
          <ScoreBreakdownModal
            player={breakdownPlayer}
            playbook={activePlaybook}
            budgetMillions={saveBudgetMillions}
            onClose={() => setBreakdownPlayer(null)}
          />
        )}

        {fitBreakdownPlayer && (
          <FitBreakdownModal
            player={fitBreakdownPlayer}
            saveId={saveId ?? null}
            objective={appliedFilters?.objective ?? "balanced"}
            onClose={() => setFitBreakdownPlayer(null)}
          />
        )}
      </div>
    </ScoutScoreContext.Provider>
  );
};

export default ScoutScreen;
