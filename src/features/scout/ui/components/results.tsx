import { ArrowDown, ArrowUp, BadgeEuro, BookmarkCheck, BookmarkPlus, Check, Eye, Footprints, Ruler, UsersRound, Zap } from "lucide-react";
import type { Fc26Player } from "@/shared/api/client";
import type { ScoutSortBy, ScoutSortOrder } from "@/features/scout/ui/types";
import { formatHeight, formatMarketValue, formatPreferredFoot, formatRating, formatWage, getOvrClass } from "@/features/scout/lib/format";
import { FitScoreBadge, InfoChip, MetricLine, PlayerAvatar, PositionBadge, RatingPill } from "./common";

export function SortHeaderButton({
  label,
  sortBy,
  activeSortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  sortBy: ScoutSortBy;
  activeSortBy?: ScoutSortBy;
  sortOrder?: ScoutSortOrder;
  onSort: (sortBy: ScoutSortBy) => void;
}) {
  const isActive = activeSortBy === sortBy;
  const Icon = sortOrder === "asc" ? ArrowUp : ArrowDown;
  const directionLabel = isActive && sortOrder === "asc" ? "lowest first" : "highest first";

  return (
    <button
      type="button"
      onClick={() => onSort(sortBy)}
      className={`mx-auto inline-flex h-8 min-w-[58px] items-center justify-center gap-1.5 rounded-md border px-2 font-semibold transition-colors ${
        isActive
          ? "border-primary/35 bg-primary/10 text-primary"
          : "border-transparent text-muted-foreground hover:border-primary/25 hover:bg-primary/5 hover:text-foreground"
      }`}
      title={`Sort by ${label} (${directionLabel})`}
    >
      <span>{label}</span>
      <Icon size={12} className={isActive ? "opacity-100" : "opacity-45"} />
    </button>
  );
}

export function FeaturedPlayer({ player, rank, onSelect }: { player: Fc26Player; rank: number; onSelect: () => void }) {
  const growth = player.potential - player.ovr;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="card-gamer block w-full p-4 text-left transition-colors hover:border-primary/35 hover:bg-primary/5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 font-display text-sm font-bold text-primary">
            {rank}
          </span>
          <PlayerAvatar player={player} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{player.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{player.club ?? player.nation ?? "No club"}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`font-display text-2xl font-bold leading-none ${getOvrClass(player.ovr)}`}>{player.ovr}</span>
          <FitScoreBadge player={player} compact />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {player.positions.map((position) => (
          <PositionBadge key={position} position={position} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <MetricLine label="Potential" value={`${player.potential}${growth > 0 ? ` (+${growth})` : ""}`} />
        <MetricLine label="Pace" value={formatRating(player.pace)} icon={Zap} />
        <MetricLine label="Height" value={formatHeight(player.height)} icon={Ruler} />
        <MetricLine label="Value" value={formatMarketValue(player.marketValue)} icon={BadgeEuro} />
      </div>
    </button>
  );
}

export function PlayerTableRow({
  player,
  showFitScore,
  isCompareSelected,
  isShortlisted,
  onSelect,
  onToggleCompare,
  onToggleShortlist,
  onOpenFitBreakdown,
}: {
  player: Fc26Player;
  showFitScore: boolean;
  isCompareSelected: boolean;
  isShortlisted: boolean;
  onSelect: () => void;
  onToggleCompare: () => void;
  onToggleShortlist: () => void;
  onOpenFitBreakdown?: () => void;
}) {
  const traits = player.playerTraits ?? [];

  return (
    <tr className="border-t border-border transition-colors hover:bg-muted/25">
      <td className="min-w-[460px] px-4 py-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <PlayerAvatar player={player} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{player.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{player.longName ?? player.nation ?? "FC26 Profile"}</p>
              {traits.length > 0 && (
                <div className="mt-2 flex max-w-[210px] gap-1 overflow-hidden">
                  {traits.slice(0, 2).map((trait) => (
                    <InfoChip key={trait}>{trait}</InfoChip>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onToggleShortlist}
              aria-pressed={isShortlisted}
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-xs font-semibold transition-colors ${
                isShortlisted
                  ? "border-primary/35 bg-primary/10 text-primary"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-primary/35 hover:text-primary"
              }`}
              aria-label={`${isShortlisted ? "Remove" : "Add"} ${player.name} ${isShortlisted ? "from" : "to"} Shortlist`}
              title={isShortlisted ? "Remove from Shortlist" : "Add to Shortlist"}
            >
              {isShortlisted ? <BookmarkCheck size={15} /> : <BookmarkPlus size={15} />}
              <span>{isShortlisted ? "In list" : "Shortlist"}</span>
            </button>
            <button
              type="button"
              onClick={onToggleCompare}
              aria-pressed={isCompareSelected}
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-xs font-semibold transition-colors ${
                isCompareSelected
                  ? "border-primary/35 bg-primary/10 text-primary"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-primary/35 hover:text-primary"
              }`}
              aria-label={`${isCompareSelected ? "Remove" : "Add"} ${player.name} ${isCompareSelected ? "from" : "to"} comparison`}
              title={isCompareSelected ? "Remove from comparison" : "Add to comparison"}
            >
              {isCompareSelected ? <Check size={15} /> : <UsersRound size={15} />}
              <span>{isCompareSelected ? "Selected" : "Compare"}</span>
            </button>
            <button
              type="button"
              onClick={onSelect}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
              aria-label={`View details de ${player.name}`}
              title="View details"
            >
              <Eye size={15} />
            </button>
          </div>
        </div>
      </td>
      <td className="min-w-[150px] px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {player.positions.map((position) => (
            <PositionBadge key={position} position={position} />
          ))}
        </div>
      </td>
      {showFitScore && (
        <td className="px-4 py-3 text-center">
          <div className="flex justify-center">
            <FitScoreBadge player={player} onClick={onOpenFitBreakdown} />
          </div>
        </td>
      )}
      <td className={`px-4 py-3 text-center font-display text-xl font-bold ${getOvrClass(player.ovr)}`}>{player.ovr}</td>
      <td className="px-4 py-3 text-center font-display text-xl font-bold text-foreground">{player.potential}</td>
      <td className="min-w-[180px] px-4 py-3">
        <p className="text-sm text-foreground">{player.age} yr</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {formatHeight(player.height)} · {formatHeight(player.height)}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{formatPreferredFoot(player.preferredFoot)}</p>
      </td>
      <td className="min-w-[170px] px-4 py-3">
        <div className="grid grid-cols-3 gap-1.5">
          <RatingPill label="PAC" value={player.pace} />
          <RatingPill label="DRI" value={player.dribbling} />
          <RatingPill label="PHY" value={player.physic} />
        </div>
      </td>
      <td className="min-w-[190px] px-4 py-3">
        <p className="truncate text-sm text-foreground">{player.club ?? "No club"}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{player.league ?? player.nation ?? "League unknown"}</p>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <p className="font-display text-sm font-bold text-primary">{formatMarketValue(player.marketValue)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatWage(player.wage)}</p>
      </td>
    </tr>
  );
}

export function PlayerMobileRow({
  player,
  showFitScore,
  isCompareSelected,
  isShortlisted,
  onSelect,
  onToggleCompare,
  onToggleShortlist,
  onOpenFitBreakdown,
}: {
  player: Fc26Player;
  showFitScore: boolean;
  isCompareSelected: boolean;
  isShortlisted: boolean;
  onSelect: () => void;
  onToggleCompare: () => void;
  onToggleShortlist: () => void;
  onOpenFitBreakdown?: () => void;
}) {
  const traits = player.playerTraits ?? [];

  return (
    <article className="p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PlayerAvatar player={player} size="md" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{player.name}</p>
            <p className="mt-1 truncate text-sm text-muted-foreground">{player.club ?? "No club"}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{player.league ?? player.nation ?? "League unknown"}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-display text-3xl font-bold leading-none ${getOvrClass(player.ovr)}`}>{player.ovr}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">OVR</p>
          {showFitScore && (
            <div className="mt-2 flex justify-end">
              <FitScoreBadge player={player} compact onClick={onOpenFitBreakdown} />
            </div>
          )}
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {player.positions.map((position) => (
          <PositionBadge key={position} position={position} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <MetricLine label="Potential" value={player.potential} />
        <MetricLine label="Age" value={`${player.age} yr`} />
        <MetricLine label="Pace" value={formatRating(player.pace)} icon={Zap} />
        <MetricLine label="Height" value={formatHeight(player.height)} icon={Ruler} />
        <MetricLine label="Foot" value={formatPreferredFoot(player.preferredFoot)} icon={Footprints} />
        <MetricLine label="Value" value={formatMarketValue(player.marketValue)} icon={BadgeEuro} />
      </div>
      {traits.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {traits.slice(0, 3).map((trait) => (
            <InfoChip key={trait}>{trait}</InfoChip>
          ))}
        </div>
      )}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onToggleShortlist}
          aria-pressed={isShortlisted}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border px-2 text-sm font-semibold transition-colors ${
            isShortlisted
              ? "border-primary/35 bg-primary/10 text-primary"
              : "border-border bg-muted/40 text-muted-foreground hover:border-primary/35 hover:text-primary"
          }`}
        >
          {isShortlisted ? <BookmarkCheck size={15} /> : <BookmarkPlus size={15} />}
          <span className="truncate">{isShortlisted ? "In list" : "Shortlist"}</span>
        </button>
        <button
          type="button"
          onClick={onToggleCompare}
          aria-pressed={isCompareSelected}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors ${
            isCompareSelected
              ? "border-primary/35 bg-primary/10 text-primary"
              : "border-border bg-muted/40 text-muted-foreground hover:border-primary/35 hover:text-primary"
          }`}
        >
          {isCompareSelected ? <Check size={15} /> : <UsersRound size={15} />}
          <span className="truncate">{isCompareSelected ? "Sel." : "Comp."}</span>
        </button>
        <button
          type="button"
          onClick={onSelect}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
        >
          <Eye size={15} />
          Details
        </button>
      </div>
    </article>
  );
}
