import { Archive, BookmarkCheck, BookmarkPlus, Eye } from "lucide-react";
import type { Fc26Player } from "@/shared/api/client";
import type { SavedScoutQuery } from "@/features/scout/ui/types";
import { formatInteger, getOvrClass } from "@/features/scout/lib/format";
import { FitScoreBadge, MetricLine, PlayerAvatar, PositionBadge } from "./common";
import { formatMarketValue } from "@/features/scout/lib/format";

export function SavedQueryResults({
  query,
  shortlistedPlayerIds,
  onToggleShortlist,
  onOpenDetails,
}: {
  query: SavedScoutQuery;
  shortlistedPlayerIds: Set<number>;
  onToggleShortlist: (player: Fc26Player) => void;
  onOpenDetails: (sofifaId: number) => void;
}) {
  if (query.results.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="font-display text-lg font-semibold text-foreground">Saved query with no results</p>
        <p className="mt-2 text-sm text-muted-foreground">Edit the query to broaden the filter range.</p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="font-display text-base font-bold text-foreground">Query results</h4>
          <p className="text-sm text-muted-foreground">
            Snapshot with {query.results.length} of {formatInteger(query.total)} player{query.total === 1 ? "" : "s"} found.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded border border-border bg-background/45 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          <Archive size={13} />
          Saved folder
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {query.results.map((player) => {
          const isShortlisted = shortlistedPlayerIds.has(player.sofifaId);

          return (
            <article key={`${query.id}-${player.sofifaId}`} className="rounded-md border border-border bg-background/35 p-3">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <PlayerAvatar player={player} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{player.name}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{player.club ?? "No club"}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`font-display text-xl font-bold leading-none ${getOvrClass(player.ovr)}`}>{player.ovr}</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">OVR</p>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                <FitScoreBadge player={player} />
                {player.positions.map((position) => (
                  <PositionBadge key={position} position={position} />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <MetricLine label="Pot." value={player.potential} />
                <MetricLine label="Age" value={`${player.age}`} />
                <MetricLine label="Value" value={formatMarketValue(player.marketValue)} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onToggleShortlist(player)}
                  aria-pressed={isShortlisted}
                  className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors ${
                    isShortlisted
                      ? "border-primary/35 bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-primary/35 hover:text-primary"
                  }`}
                >
                  {isShortlisted ? <BookmarkCheck size={15} /> : <BookmarkPlus size={15} />}
                  {isShortlisted ? "In list" : "Shortlist"}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDetails(player.sofifaId)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-muted/40 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
                >
                  <Eye size={15} />
                  Details
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
