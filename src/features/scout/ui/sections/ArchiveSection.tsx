import { useEffect, useMemo, useState } from "react";
import { Archive, Folder, FolderOpen, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Fc26Player } from "@/shared/api/client";
import { extractErrorMessage } from "@/shared/api/client";
import { useFc26Players } from "@/features/scout/model/useFc26Players";
import { filterOutCurrentClubPlayers } from "@/features/scout/model/currentClubFilter";
import { useSavedSearches, useDeleteSavedSearch } from "@/features/scout/model/useSavedSearches";
import { formatInteger, formatSavedQueryDate } from "@/features/scout/lib/format";
import { apiSavedSearchToQuery, filterSavedQueryForCurrentClub, getCurrentClubFilteredTotal, getSavedQueryChips } from "@/features/scout/lib/filters";
import type { SavedScoutQuery } from "@/features/scout/ui/types";
import { InfoChip } from "@/features/scout/ui/components/common";
import { SavedQueryResults } from "@/features/scout/ui/components/saved";

interface ArchiveSectionProps {
  saveId: string | null;
  currentClub: string;
  currentSeason: string;
  shortlistedPlayerIds: Set<number>;
  onToggleShortlist: (player: Fc26Player) => void;
  onOpenDetails: (sofifaId: number) => void;
  onEditQuery: (query: SavedScoutQuery) => void;
}

export function ArchiveSection({
  saveId,
  currentClub,
  currentSeason,
  shortlistedPlayerIds,
  onToggleShortlist,
  onOpenDetails,
  onEditQuery,
}: ArchiveSectionProps) {
  const { data: savedSearchData } = useSavedSearches(saveId);
  const deleteSavedSearch = useDeleteSavedSearch();
  const [selectedSavedQueryId, setSelectedSavedQueryId] = useState<string | null>(null);

  const savedQueries = useMemo<SavedScoutQuery[]>(
    () => (savedSearchData?.items ?? []).map((item) => apiSavedSearchToQuery(item, currentClub, currentSeason)),
    [savedSearchData, currentClub, currentSeason]
  );
  const visibleSavedQueries = useMemo(
    () => savedQueries.map((query) => filterSavedQueryForCurrentClub(query, currentClub)),
    [currentClub, savedQueries]
  );
  const baseSelectedQuery = useMemo(
    () => visibleSavedQueries.find((query) => query.id === selectedSavedQueryId) ?? visibleSavedQueries[0] ?? null,
    [selectedSavedQueryId, visibleSavedQueries]
  );
  const { data: selectedSavedQueryData } = useFc26Players(baseSelectedQuery?.filters ?? null, saveId);
  const selectedSavedQuery = useMemo<SavedScoutQuery | null>(() => {
    if (!baseSelectedQuery) return null;
    const rawResults = selectedSavedQueryData?.players ?? [];
    const results = filterOutCurrentClubPlayers(rawResults, currentClub);
    const total = getCurrentClubFilteredTotal(selectedSavedQueryData?.total ?? results.length, rawResults, results);
    return {
      ...baseSelectedQuery,
      results,
      total,
      description: `${formatInteger(total)} player${total === 1 ? "" : "s"} found in the FC 26 dataset.`,
    };
  }, [baseSelectedQuery, selectedSavedQueryData, currentClub]);

  useEffect(() => {
    if (selectedSavedQueryId && savedQueries.some((query) => query.id === selectedSavedQueryId)) return;
    setSelectedSavedQueryId(savedQueries[0]?.id ?? null);
  }, [savedQueries, selectedSavedQueryId]);

  const removeSavedQuery = (queryId: string) => {
    if (!saveId) return;
    if (selectedSavedQueryId === queryId) setSelectedSavedQueryId(null);
    deleteSavedSearch.mutate(
      { saveId, id: queryId },
      {
        onSuccess: () => toast.success("Query removed from folders.", { duration: 3000 }),
        onError: (err) => toast.error(extractErrorMessage(err), { duration: 5000 }),
      }
    );
  };

  return (
    <>
      <section className="card-gamer overflow-hidden">
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
              <Folder size={19} />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold leading-none">Folder archive</h3>
              <p className="mt-1 text-xs text-muted-foreground">Saved queries do Scout</p>
            </div>
          </div>
        </div>

        {savedQueries.length === 0 ? (
          <div className="p-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
              <Folder size={20} />
            </div>
            <p className="font-display text-base font-semibold text-foreground">No saved folders</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Run a search in Search players and save the query for it to show up here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visibleSavedQueries.map((query) => {
              const isSelected = selectedSavedQuery?.id === query.id;
              const Icon = isSelected ? FolderOpen : Folder;

              return (
                <button
                  key={query.id}
                  type="button"
                  onClick={() => setSelectedSavedQueryId(query.id)}
                  className={`flex w-full items-start gap-3 p-4 text-left transition-colors ${
                    isSelected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/25"
                  }`}
                >
                  <Icon size={18} className="mt-0.5 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{query.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{query.description}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded border border-border bg-background/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {query.source === "assistant" ? "AI" : "Search"}
                      </span>
                      <span className="rounded border border-border bg-background/45 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {formatSavedQueryDate(query.createdAt)}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="card-gamer min-w-0 overflow-hidden">
        {selectedSavedQuery ? (
          <>
            <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {selectedSavedQuery.club} · {selectedSavedQuery.season}
                </p>
                <h3 className="truncate font-display text-xl font-bold leading-tight text-foreground">{selectedSavedQuery.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{selectedSavedQuery.description}</p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEditQuery(selectedSavedQuery)}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Pencil size={15} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeSavedQuery(selectedSavedQuery.id)}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 text-sm font-semibold text-destructive-text transition-colors hover:bg-destructive/15"
                >
                  <Trash2 size={15} />
                  Remove
                </button>
              </div>
            </div>

            <div className="border-b border-border p-5">
              <div className="flex flex-wrap gap-1.5">
                {getSavedQueryChips(selectedSavedQuery.filters).map((chip) => (
                  <InfoChip key={chip}>{chip}</InfoChip>
                ))}
              </div>
            </div>

            <SavedQueryResults
              query={selectedSavedQuery}
              shortlistedPlayerIds={shortlistedPlayerIds}
              onToggleShortlist={onToggleShortlist}
              onOpenDetails={onOpenDetails}
            />
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
              <Archive size={20} />
            </div>
            <p className="font-display text-lg font-semibold text-foreground">Choose a folder</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Saved queries appear as folders with filters and a results snapshot.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
