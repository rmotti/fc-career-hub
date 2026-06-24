import { useContext, useMemo } from "react";
import { Activity, Eye, RotateCcw, UsersRound, X } from "lucide-react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import type { ApiPlaybook, Fc26Player } from "@/shared/api/client";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { useFc26PlayerDetails } from "@/features/scout/model/useFc26Players";
import { COMPARISON_GROUPS } from "@/features/scout/config/comparison";
import { COMPARISON_RADAR_COLORS } from "@/features/scout/config/options";
import { computeScoutScore } from "@/features/scout/lib/scoutScore";
import { ScoutScoreContext } from "@/features/scout/lib/scoutScore";
import {
  formatMarketValue,
  formatWage,
  getOvrClass,
} from "@/features/scout/lib/format";
import { buildComparisonNarrative } from "@/features/scout/lib/comparisonNarrative";
import type { ComparisonMetricConfig, PlayerComparisonGroupConfig } from "@/features/scout/ui/types";
import { PlayerAvatar, MetricLine, PositionBadge, RatingPill } from "./common";
import { ScorePill, ComparisonScoreTable } from "./score";

export function PlayerComparisonLauncher({
  players,
  activePlaybook,
  onClear,
  onOpenComparison,
  onOpenDetails,
  onRemove,
}: {
  players: Fc26Player[];
  activePlaybook: ApiPlaybook | null;
  onClear: () => void;
  onOpenComparison: () => void;
  onOpenDetails: (sofifaId: number) => void;
  onRemove: (sofifaId: number) => void;
}) {
  const hasEnoughPlayers = players.length >= 2;

  return (
    <section className="card-gamer overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
            <UsersRound size={19} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold leading-none">Compare players</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasEnoughPlayers
                ? `${players.length} players ready for the comparison report.`
                : "Select 2 or more players in the results to compare attributes."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {players.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw size={15} />
              Clear
            </button>
          )}
          <button
            type="button"
            disabled={!hasEnoughPlayers}
            onClick={onOpenComparison}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Eye size={15} />
            Open comparison
          </button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {players.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {players.map((player) => (
              <ComparedPlayerCard
                key={player.sofifaId}
                player={player}
                activePlaybook={activePlaybook}
                onOpenDetails={() => onOpenDetails(player.sofifaId)}
                onRemove={() => onRemove(player.sofifaId)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-background/25 p-6 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
              <UsersRound size={19} />
            </div>
            <p className="font-display text-base font-bold text-foreground">No player selected</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Use the Compare button in the results to build a side-by-side analysis.
            </p>
          </div>
        )}

        {players.length === 1 && (
          <div className="rounded-md border border-warning/25 bg-warning/10 p-4 text-sm text-warning">
            Select one more player to unlock the full attributes table.
          </div>
        )}
      </div>
    </section>
  );
}

export function PlayerComparisonModal({
  players: rawPlayers,
  activePlaybook,
  budgetMillions,
  onClose,
  onOpenDetails,
  onRemove,
}: {
  players: Fc26Player[];
  activePlaybook: ApiPlaybook | null;
  budgetMillions: number | null;
  onClose: () => void;
  onOpenDetails: (sofifaId: number) => void;
  onRemove: (sofifaId: number) => void;
}) {
  const { openBreakdown } = useContext(ScoutScoreContext);

  const sofifaIds = useMemo(() => rawPlayers.map((player) => player.sofifaId), [rawPlayers]);
  const { byId: detailsById, isLoading: isLoadingDetails } = useFc26PlayerDetails(sofifaIds);
  const players = useMemo(
    () =>
      rawPlayers.map((player) => {
        const detail = detailsById.get(player.sofifaId);
        if (!detail) return player;
        return {
          ...detail,
          fitScore: player.fitScore ?? detail.fitScore,
          fitConfidence: player.fitConfidence ?? detail.fitConfidence,
          fitProfileSize: player.fitProfileSize ?? detail.fitProfileSize,
        };
      }),
    [rawPlayers, detailsById],
  );

  const narrative = useMemo(() => buildComparisonNarrative(players), [players]);
  const radarData = useMemo(
    () =>
      [
        { label: "Pace", field: "pace" },
        { label: "Final.", field: "shooting" },
        { label: "Passing", field: "passing" },
        { label: "Dribbling", field: "dribbling" },
        { label: "Defense", field: "defending" },
        { label: "Physical", field: "physic" },
      ].map((item) => ({
        label: item.label,
        ...Object.fromEntries(players.map((player, index) => [`player_${index}`, player[item.field as keyof Fc26Player] ?? 0])),
      })),
    [players]
  );
  const comparisonTableWidth = Math.max(820, players.length * 190 + 220);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 p-3 backdrop-blur-sm sm:p-5" role="presentation" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Player comparison"
        onMouseDown={(event) => event.stopPropagation()}
        className="mx-auto flex h-full max-h-[940px] w-full max-w-6xl flex-col overflow-hidden rounded-md border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border bg-card/95 p-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Scout comparison report</p>
            <h3 className="mt-1 truncate font-display text-xl font-bold text-foreground">{players.length} players selected</h3>
            {isLoadingDetails && (
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                Loading attributes…
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close comparison"
          >
            <X size={16} />
          </button>
        </div>

        <ScrollArea className="min-h-0 flex-1" viewportClassName="p-4 sm:p-5" scrollbars="vertical">
          {players.length < 2 ? (
            <div className="rounded-md border border-warning/25 bg-warning/10 p-5 text-sm text-warning">
              Select 2 or more players to compare attributes.
            </div>
          ) : (
            <div className="space-y-4">
              <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {players.map((player) => (
                  <ComparisonProfileCard
                    key={player.sofifaId}
                    player={player}
                    score={computeScoutScore(player, activePlaybook, budgetMillions)}
                    onOpenScore={() => openBreakdown(player)}
                    onOpenDetails={() => onOpenDetails(player.sofifaId)}
                    onRemove={() => onRemove(player.sofifaId)}
                  />
                ))}
              </section>

              <section className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
                <div className="card-gamer p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-primary" />
                    <p className="font-display text-sm font-bold text-foreground">General ratings</p>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 99]} tick={false} axisLine={false} />
                        {players.map((player, index) => (
                          <Radar
                            key={player.sofifaId}
                            dataKey={`player_${index}`}
                            name={player.name}
                            stroke={COMPARISON_RADAR_COLORS[index % COMPARISON_RADAR_COLORS.length]}
                            fill={COMPARISON_RADAR_COLORS[index % COMPARISON_RADAR_COLORS.length]}
                            fillOpacity={0.12}
                          />
                        ))}
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {players.map((player, index) => (
                      <span key={player.sofifaId} className="inline-flex min-h-6 items-center gap-1.5 rounded border border-border bg-background/35 px-2 text-xs text-muted-foreground">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: COMPARISON_RADAR_COLORS[index % COMPARISON_RADAR_COLORS.length] }}
                        />
                        <span className="max-w-[130px] truncate">{player.name}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card-gamer p-4">
                  <p className="mb-3 font-display text-sm font-bold text-foreground">Quick read</p>
                  {narrative.length > 0 ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {narrative.map((sentence, index) => (
                        <span key={index}>
                          {index > 0 && " "}
                          {highlightNames(sentence, players)}
                        </span>
                      ))}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not enough data to summarise this comparison.</p>
                  )}
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {players.map((player) => (
                      <MetricLine
                        key={player.sofifaId}
                        label={player.name}
                        value={`${formatMarketValue(player.marketValue)} · ${formatWage(player.wage)}`}
                      />
                    ))}
                  </div>
                </div>
              </section>

              <ScrollArea scrollbars="horizontal" className="rounded-md border border-border bg-background/20" viewportClassName="pb-3">
                <div className="space-y-4 p-3" style={{ minWidth: comparisonTableWidth }}>
                  <ComparisonScoreTable players={players} playbook={activePlaybook} budgetMillions={budgetMillions} />
                  {COMPARISON_GROUPS.map((group) => (
                    <ComparisonGroupTable key={group.title} group={group} players={players} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </ScrollArea>
      </section>
    </div>
  );
}

export function ComparisonProfileCard({
  player,
  score,
  onOpenScore,
  onOpenDetails,
  onRemove,
}: {
  player: Fc26Player;
  score: number | null;
  onOpenScore: () => void;
  onOpenDetails: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="card-gamer p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <PlayerAvatar player={player} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="truncate font-display text-xl font-bold text-foreground">{player.name}</h4>
              <p className="mt-1 truncate text-sm text-muted-foreground">{player.club ?? player.nation ?? "No club"}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={`font-display text-4xl font-bold leading-none ${getOvrClass(player.ovr)}`}>{player.ovr}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">OVR</p>
              </div>
              <ScorePill value={score} onClick={score !== null ? onOpenScore : undefined} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {player.positions.map((position) => (
              <PositionBadge key={position} position={position} />
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenDetails}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-muted/40 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
            >
              <Eye size={15} />
              Individual
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-muted/40 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <X size={15} />
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ComparedPlayerCard({
  player,
  activePlaybook,
  onOpenDetails,
  onRemove,
}: {
  player: Fc26Player;
  activePlaybook: ApiPlaybook | null;
  onOpenDetails: () => void;
  onRemove: () => void;
}) {
  const { budgetMillions, openBreakdown } = useContext(ScoutScoreContext);
  const scoutScore = computeScoutScore(player, activePlaybook, budgetMillions);

  return (
    <article className="rounded-md border border-border bg-background/35 p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PlayerAvatar player={player} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{player.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{player.club ?? player.nation ?? "No club"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={`Remove ${player.name} from comparison`}
          title="Remove from comparison"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {player.positions.map((position) => (
          <PositionBadge key={position} position={position} />
        ))}
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <RatingPill label="OVR" value={player.ovr} />
        <RatingPill label="POT" value={player.potential} />
        <ScorePill value={scoutScore} onClick={scoutScore !== null ? () => openBreakdown(player) : undefined} />
      </div>

      <button
        type="button"
        onClick={onOpenDetails}
        className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-md border border-border bg-muted/40 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
      >
        <Eye size={14} />
        Report
      </button>
    </article>
  );
}

/** Wraps any player name found in the sentence with a primary-coloured emphasis. */
function highlightNames(sentence: string, players: Fc26Player[]): React.ReactNode {
  const names = [...new Set(players.map((player) => player.name))]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (!names.length) return sentence;

  const pattern = new RegExp(`(${names.map(escapeRegExp).join("|")})`, "g");
  const parts = sentence.split(pattern);

  return parts.map((part, index) =>
    names.includes(part) ? (
      <span key={index} className="font-semibold text-foreground">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function ComparisonGroupTable({ group, players }: { group: PlayerComparisonGroupConfig; players: Fc26Player[] }) {
  const Icon = group.icon;

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card/55">
      <div className="flex items-center gap-2 border-b border-border bg-muted/25 px-3 py-2">
        <Icon size={15} className="text-primary" />
        <p className="font-display text-sm font-bold text-foreground">{group.title}</p>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <th className="w-[220px] px-3 py-2 font-semibold">Attribute</th>
            {players.map((player) => (
              <th key={player.sofifaId} className="min-w-[180px] px-3 py-2 font-semibold">
                <span className="block truncate">{player.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {group.metrics.map((metric) => (
            <ComparisonMetricRow key={metric.label} metric={metric} players={players} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getComparisonBestScore(players: Fc26Player[], metric: ComparisonMetricConfig) {
  if (!metric.score) return null;

  const scores = players
    .map((player) => metric.score?.(player))
    .filter((score): score is number => typeof score === "number" && Number.isFinite(score));
  const uniqueScores = new Set(scores);

  if (uniqueScores.size <= 1) return null;

  return metric.better === "lower" ? Math.min(...scores) : Math.max(...scores);
}

function ComparisonMetricRow({ metric, players }: { metric: ComparisonMetricConfig; players: Fc26Player[] }) {
  const bestScore = getComparisonBestScore(players, metric);

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="w-[220px] px-3 py-2 text-xs font-semibold text-muted-foreground">{metric.label}</td>
      {players.map((player) => {
        const playerScore = metric.score?.(player);
        const isBest = bestScore !== null && typeof playerScore === "number" && playerScore === bestScore;

        return (
          <td
            key={player.sofifaId}
            className={`min-w-[180px] px-3 py-2 text-sm ${
              isBest
                ? "bg-primary/10 font-semibold text-primary"
                : "text-foreground"
            }`}
          >
            <span className="block truncate">{metric.render(player)}</span>
          </td>
        );
      })}
    </tr>
  );
}
