import { useContext, useState } from "react";
import { BadgeEuro, Check, ChevronDown, Eye, GitCompareArrows, ListChecks, Search, Star, Target, UsersRound, X } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import type { ApiPlaybook, Fc26Player } from "@/shared/api/client";
import { formatPosition, POSITION_LABELS } from "@/shared/lib/playerPositions";
import { ScoutScoreContext, computeScoutScore } from "@/features/scout/lib/scoutScore";
import { formatMarketValue, formatPotentialGrowth, getOvrClass } from "@/features/scout/lib/format";
import { getAverageOvr, getBestMetricPlayer } from "@/features/scout/lib/shortlist";
import type { ShortlistPositionGroup } from "@/features/scout/ui/types";
import { FitScoreBadge, MetricLine, PlayerAvatar, PositionBadge, RatingPill } from "./common";
import { ScorePill } from "./score";
import { PlayerComparisonLauncher } from "./comparison";

function ShortlistInsight({ label, value, detail, icon: Icon }: { label: string; value: ReactNode; detail: string; icon: ElementType }) {
  return (
    <div className="rounded-md border border-border bg-background/35 p-3">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        <Icon size={15} className="text-primary" />
        <p className="truncate text-[10px] uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className="font-display text-2xl font-bold leading-none text-foreground">{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function ShortlistPlayerRow({
  player,
  activePlaybook,
  isCompareSelected,
  onToggleCompare,
  onOpenDetails,
  onRemove,
}: {
  player: Fc26Player;
  activePlaybook: ApiPlaybook | null;
  isCompareSelected: boolean;
  onToggleCompare: () => void;
  onOpenDetails: () => void;
  onRemove: () => void;
}) {
  const { budgetMillions, openBreakdown, openFitBreakdown } = useContext(ScoutScoreContext);
  const scoutScore = computeScoutScore(player, activePlaybook, budgetMillions);

  return (
    <article className="grid gap-3 p-4 lg:grid-cols-[minmax(240px,1.4fr)_160px_180px_96px] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <PlayerAvatar player={player} size="md" />
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-foreground">{player.name}</p>
            <span className={`font-display text-lg font-bold leading-none ${getOvrClass(player.ovr)}`}>{player.ovr}</span>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{player.club ?? "No club"}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <FitScoreBadge player={player} onClick={() => openFitBreakdown(player)} />
            {player.positions.map((position) => (
              <PositionBadge key={position} position={position} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <RatingPill label="OVR" value={player.ovr} />
        <RatingPill label="POT" value={player.potential} />
        <ScorePill value={scoutScore} onClick={scoutScore !== null ? () => openBreakdown(player) : undefined} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <MetricLine label="Age" value={`${player.age} yr`} />
        <MetricLine label="Value" value={formatMarketValue(player.marketValue)} icon={BadgeEuro} />
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleCompare}
          aria-pressed={isCompareSelected}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors ${
            isCompareSelected
              ? "border-primary/35 bg-primary/10 text-primary"
              : "border-border bg-muted/40 text-muted-foreground hover:border-primary/35 hover:text-primary"
          }`}
          title={isCompareSelected ? "Remove from comparison" : "Add to comparison"}
        >
          {isCompareSelected ? <Check size={14} /> : <UsersRound size={14} />}
        </button>
        <button
          type="button"
          onClick={onOpenDetails}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
          title="View details"
        >
          <Eye size={14} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-destructive/25 bg-destructive/10 text-destructive-text transition-colors hover:bg-destructive/15"
          title="Remove da Shortlist"
        >
          <X size={14} />
        </button>
      </div>
    </article>
  );
}

function ShortlistPositionGroupCard({
  group,
  comparedPlayerIds,
  activePlaybook,
  onToggleCompare,
  onOpenDetails,
  onRemovePlayer,
  onCompareGroup,
}: {
  group: ShortlistPositionGroup;
  comparedPlayerIds: Set<number>;
  activePlaybook: ApiPlaybook | null;
  onToggleCompare: (player: Fc26Player) => void;
  onOpenDetails: (sofifaId: number) => void;
  onRemovePlayer: (sofifaId: number) => void;
  onCompareGroup: (players: Fc26Player[]) => void;
}) {
  const averageOvr = getAverageOvr(group.players);
  const canCompareGroup = group.players.length >= 2;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const playersListId = `shortlist-position-${group.position}`;

  return (
    <section className="card-gamer overflow-hidden">
      <div
        className={`flex flex-col gap-3 bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between ${
          isCollapsed ? "" : "border-b border-border"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsCollapsed((current) => !current)}
          aria-expanded={!isCollapsed}
          aria-controls={playersListId}
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          title={isCollapsed ? "Expand position" : "Collapse position"}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-accent/20 bg-accent/10 text-accent">
            <span className="font-display text-sm font-bold">{formatPosition(group.position)}</span>
          </div>
          <div className="min-w-0">
            <h4 className="truncate font-display text-lg font-bold text-foreground">{POSITION_LABELS[group.position]}</h4>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {group.players.length} player{group.players.length === 1 ? "" : "s"} · avg. OVR {averageOvr ?? "—"}
            </p>
          </div>
          <ChevronDown
            size={18}
            className={`ml-auto shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground ${
              isCollapsed ? "-rotate-90" : ""
            }`}
          />
        </button>
        <button
          type="button"
          disabled={!canCompareGroup}
          onClick={() => onCompareGroup(group.players)}
          className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <GitCompareArrows size={15} />
          Compare position
        </button>
      </div>

      <div id={playersListId} hidden={isCollapsed} className="divide-y divide-border">
        {group.players.map((player) => (
          <ShortlistPlayerRow
            key={player.sofifaId}
            player={player}
            activePlaybook={activePlaybook}
            isCompareSelected={comparedPlayerIds.has(player.sofifaId)}
            onToggleCompare={() => onToggleCompare(player)}
            onOpenDetails={() => onOpenDetails(player.sofifaId)}
            onRemove={() => onRemovePlayer(player.sofifaId)}
          />
        ))}
      </div>
    </section>
  );
}

export function ShortlistContent({
  players,
  groups,
  comparedPlayers,
  comparedPlayerIds,
  activePlaybook,
  onToggleCompare,
  onClearComparison,
  onOpenComparison,
  onOpenDetails,
  onRemovePlayer,
  onCompareGroup,
  onGoToScout,
}: {
  players: Fc26Player[];
  groups: ShortlistPositionGroup[];
  comparedPlayers: Fc26Player[];
  comparedPlayerIds: Set<number>;
  activePlaybook: ApiPlaybook | null;
  onToggleCompare: (player: Fc26Player) => void;
  onClearComparison: () => void;
  onOpenComparison: () => void;
  onOpenDetails: (sofifaId: number) => void;
  onRemovePlayer: (sofifaId: number) => void;
  onCompareGroup: (players: Fc26Player[]) => void;
  onGoToScout: () => void;
}) {
  const hasComparisonReady = comparedPlayers.length >= 2;
  const bestGrowthPlayer = getBestMetricPlayer(players, (player) => player.potential - player.ovr);

  if (players.length === 0) {
    return (
      <section className="card-gamer p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-primary/30 bg-primary/10 text-primary">
          <ListChecks size={23} />
        </div>
        <p className="font-display text-xl font-bold text-foreground">Empty Shortlist</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Send players from Scout reports to build a shortlist before the transfer window.
        </p>
        <button
          type="button"
          onClick={onGoToScout}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Search size={15} />
          Search players
        </button>
      </section>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <section className="card-gamer overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
              <ListChecks size={21} />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-xl font-bold leading-none text-foreground">Shortlist</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {players.length} player{players.length === 1 ? "" : "s"} grouped by position for transfer decisions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onGoToScout}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <Search size={15} />
              Search more
            </button>
            <button
              type="button"
              disabled={!hasComparisonReady}
              onClick={onOpenComparison}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <GitCompareArrows size={15} />
              Compare selection
            </button>
          </div>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-3">
          <ShortlistInsight label="Covered positions" value={groups.length} detail="Groups by main position" icon={Target} />
          <ShortlistInsight label="Largest margin" value={bestGrowthPlayer ? formatPotentialGrowth(bestGrowthPlayer) : "—"} detail={bestGrowthPlayer?.name ?? "Sem dados"} icon={Star} />
          <ShortlistInsight label="Comparison" value={comparedPlayers.length} detail={hasComparisonReady ? "Ready to open" : "Select 2 players"} icon={GitCompareArrows} />
        </div>
      </section>

      {comparedPlayers.length > 0 && (
        <PlayerComparisonLauncher
          players={comparedPlayers}
          activePlaybook={activePlaybook}
          onClear={onClearComparison}
          onOpenComparison={onOpenComparison}
          onOpenDetails={onOpenDetails}
          onRemove={(sofifaId) => {
            const player = comparedPlayers.find((comparedPlayer) => comparedPlayer.sofifaId === sofifaId);
            if (player) onToggleCompare(player);
          }}
        />
      )}

      <div className="space-y-3">
        {groups.map((group) => (
          <ShortlistPositionGroupCard
            key={group.position}
            group={group}
            comparedPlayerIds={comparedPlayerIds}
            activePlaybook={activePlaybook}
            onToggleCompare={onToggleCompare}
            onOpenDetails={onOpenDetails}
            onRemovePlayer={onRemovePlayer}
            onCompareGroup={onCompareGroup}
          />
        ))}
      </div>
    </div>
  );
}
