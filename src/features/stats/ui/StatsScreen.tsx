import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Calendar,
  Crown,
  Goal,
  ListFilter,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Target,
  Trash2,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Flag from "react-world-flags";
import { toast } from "sonner";
import StatsModal from "@/features/squad/ui/StatsModal";
import AddCompetitionModal from "@/features/stats/ui/AddCompetitionModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { usePlayers } from "@/features/squad/model/usePlayers";
import {
  useTeamStats,
  useUpdateTeamStats,
  useCreateTeamStats,
  useDeleteTeamStats,
} from "@/features/stats/model/useTeamStats";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { extractErrorMessage, type ApiPlayer, type ApiTeamStats } from "@/shared/api/client";
import { formatPosition } from "@/shared/lib/playerPositions";
import {
  CUP_LABELS,
  getAggregateTeamStats,
  getCompetitionAccent,
  groupTeamStatsBySeason,
  type AggregateTeamStats,
} from "@/shared/lib/competitions";

interface Props {
  saveId: string;
  selectedSeason?: string;
  currentSeason?: string;
  currentClubStintId?: string | null;
}

type PlayerStatModalKey = "goals" | "assists" | "cleanSheets" | "matches" | "goalContributions" | null;
type RankingTabKey = Exclude<PlayerStatModalKey, null>;
type Tone = "primary" | "accent" | "gold" | "warning" | "destructive" | "muted";

const toneClass: Record<Tone, string> = {
  primary: "text-primary",
  accent: "text-accent",
  gold: "text-[hsl(var(--gold))]",
  warning: "text-[hsl(var(--warning))]",
  destructive: "text-destructive-text",
  muted: "text-muted-foreground",
};

const toneBgClass: Record<Tone, string> = {
  primary: "bg-primary/10",
  accent: "bg-accent/10",
  gold: "bg-[hsl(var(--gold)/0.1)]",
  warning: "bg-[hsl(var(--warning)/0.1)]",
  destructive: "bg-destructive/10",
  muted: "bg-muted/40",
};

const CLEAN_SHEETS_POSITIONS = new Set(["GOL", "ZAG", "LD", "LE", "VOL"]);

const getPlayerSeasonStats = (player: ApiPlayer) => player.currentSeasonStats || player.totalStats;

const getStatValue = (player: ApiPlayer, stat: "goals" | "assists" | "cleanSheets" | "matches") =>
  getPlayerSeasonStats(player)?.[stat] ?? 0;

const getGoalContributions = (player: ApiPlayer) => {
  const stats = getPlayerSeasonStats(player);
  return stats?.goalContributions ?? ((stats?.goals ?? 0) + (stats?.assists ?? 0));
};

const formatDecimal = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString("en-US", { maximumFractionDigits: 1 }) : "0";

const getSeasonVerdict = (winRate: number, goalDiff: number, matches: number, t: (key: string) => string) => {
  if (matches === 0) {
    return {
      title: t("stats.season.ready"),
      detail: t("stats.season.readyDesc"),
      tone: "muted" as Tone,
    };
  }

  if (winRate >= 70 && goalDiff > 0) {
    return {
      title: t("stats.season.dominant"),
      detail: t("stats.season.dominantDesc"),
      tone: "primary" as Tone,
    };
  }

  if (winRate >= 55 && goalDiff >= 0) {
    return {
      title: t("stats.season.onTrack"),
      detail: "The campaign is solid, with a positive margin to keep competing at the top.",
      tone: "accent" as Tone,
    };
  }

  if (winRate >= 40 || goalDiff >= 0) {
    return {
      title: "Inconsistent campaign",
      detail: "There is enough production, but result swings are still costing points.",
      tone: "warning" as Tone,
    };
  }

  return {
    title: "Warning zone",
    detail: "Results call for an immediate adjustment to the game plan and defensive consistency.",
    tone: "destructive" as Tone,
  };
};

interface CompactStatProps {
  label: string;
  value: string;
  highlight?: Tone;
}

function CompactStat({ label, value, highlight }: CompactStatProps) {
  return (
    <div className="rounded-md bg-background/25 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-display text-base font-bold ${highlight ? toneClass[highlight] : "text-foreground"}`}>{value}</p>
    </div>
  );
}

interface PlayerSpotlightProps {
  player: ApiPlayer | null;
  totalGoals: number;
}

function PlayerSpotlight({ player, totalGoals }: PlayerSpotlightProps) {
  if (!player) {
    return (
      <div className="rounded-md border border-border bg-background/35 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Key Player</p>
        <p className="mt-3 text-sm text-muted-foreground">No player with recorded impact.</p>
      </div>
    );
  }

  const goals = getStatValue(player, "goals");
  const assists = getStatValue(player, "assists");
  const contributions = getGoalContributions(player);
  const share = totalGoals > 0 ? Math.round((goals / totalGoals) * 100) : 0;

  return (
    <div className="rounded-md border border-[hsl(var(--gold)/0.22)] bg-[hsl(var(--gold)/0.07)] p-4">
      <div className="mb-4 flex items-center gap-2">
        <Crown size={15} className="text-[hsl(var(--gold))]" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Key Player</p>
      </div>
      <p className="truncate font-display text-2xl font-bold leading-none text-foreground">{player.name}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{formatPosition(player.position)}</span>
        {player.nation && (
          <Flag
            code={player.nation}
            style={{ width: 16, height: 11, borderRadius: 2, objectFit: "cover" }}
          />
        )}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <CompactStat label="Goals" value={String(goals)} highlight="primary" />
        <CompactStat label="Assists" value={String(assists)} highlight="accent" />
        <CompactStat label="Contrib." value={String(contributions)} highlight="gold" />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {share}% of the squad's goals come directly from them.
      </p>
    </div>
  );
}

interface CampaignSummaryProps {
  teamStats: AggregateTeamStats;
  competitions: number;
  keyPlayer: ApiPlayer | null;
  totalGoals: number;
}

function CampaignSummary({ teamStats, competitions, keyPlayer, totalGoals }: CampaignSummaryProps) {
  const { t } = useTranslation();
  const matches = teamStats.wins + teamStats.draws + teamStats.losses;
  const winRate = matches > 0 ? Math.round((teamStats.wins / matches) * 100) : 0;
  const goalDiff = teamStats.goalsPro - teamStats.goalsAgainst;
  const goalsPerMatch = matches > 0 ? teamStats.goalsPro / matches : 0;
  const concededPerMatch = matches > 0 ? teamStats.goalsAgainst / matches : 0;
  const verdict = getSeasonVerdict(winRate, goalDiff, matches, t);
  const resultTotal = Math.max(matches, 1);

  return (
    <section data-tour="stats-campaign" className="card-gamer relative overflow-hidden p-5 md:p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, hsl(142 70% 49%) 1px, transparent 1px), linear-gradient(0deg, hsl(142 70% 49%) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div className="relative grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.75fr]">
        <div className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Trophy size={15} className={toneClass[verdict.tone]} />
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Season summary</p>
              </div>
              <h2 className={`font-display text-3xl font-bold leading-tight md:text-4xl ${toneClass[verdict.tone]}`}>
                {verdict.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{verdict.detail}</p>
            </div>
            <div className="flex min-h-[62px] min-w-[84px] flex-col items-center justify-center rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Games</p>
              <p className="font-display text-3xl font-bold leading-none text-primary text-glow-primary">{matches}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.85fr]">
            <div>
              <div className="grid grid-cols-3 divide-x divide-border rounded-md border border-border bg-background/25 p-4">
                <div className="pr-3 text-center">
                  <p className="font-display text-5xl font-bold leading-none text-primary text-glow-primary">{teamStats.wins}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Wins</p>
                </div>
                <div className="px-3 text-center">
                  <p className="font-display text-5xl font-bold leading-none text-[hsl(var(--warning))]">{teamStats.draws}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Draws</p>
                </div>
                <div className="pl-3 text-center">
                  <p className="font-display text-5xl font-bold leading-none text-destructive-text">{teamStats.losses}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Losses</p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div className="flex h-full w-full">
                  <div
                    className="bg-primary"
                    style={{ width: `${(teamStats.wins / resultTotal) * 100}%` }}
                  />
                  <div
                    className="bg-[hsl(var(--warning))]"
                    style={{ width: `${(teamStats.draws / resultTotal) * 100}%` }}
                  />
                  <div
                    className="bg-destructive"
                    style={{ width: `${(teamStats.losses / resultTotal) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CompactStat label="Win %" value={`${winRate}%`} highlight={verdict.tone} />
              <CompactStat
                label="GD"
                value={goalDiff > 0 ? `+${goalDiff}` : String(goalDiff)}
                highlight={goalDiff > 0 ? "primary" : goalDiff < 0 ? "destructive" : "muted"}
              />
              <CompactStat label="GF/G" value={formatDecimal(goalsPerMatch)} highlight="accent" />
              <CompactStat
                label="GA/G"
                value={formatDecimal(concededPerMatch)}
                highlight={concededPerMatch <= 1 ? "primary" : concededPerMatch <= 1.5 ? "warning" : "destructive"}
              />
              <div className="col-span-2">
                <CompactStat label="Competitions" value={String(competitions)} highlight="gold" />
              </div>
            </div>
          </div>
        </div>

        <PlayerSpotlight player={keyPlayer} totalGoals={totalGoals} />
      </div>
    </section>
  );
}

interface CompetitionCardProps {
  stat: ApiTeamStats;
  canEdit: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

function CompetitionCard({ stat, canEdit, onEdit, onRemove }: CompetitionCardProps) {
  const isLeague = stat.competition?.type === "League";
  const isEuropean = stat.competition?.type === "EuropeanCup";
  const matches = stat.wins + stat.draws + stat.losses;
  const goalDiff = stat.goalsPro - stat.goalsAgainst;
  const winRate = matches > 0 ? Math.round((stat.wins / matches) * 100) : 0;
  const pts = stat.wins * 3 + stat.draws;
  const { borderClass, bgClass } = getCompetitionAccent(stat.competition);

  const resultBadge = isLeague
    ? stat.leaguePosition ? `${stat.leaguePosition}th place` : "League in progress"
    : stat.cupResult ? (CUP_LABELS[stat.cupResult] ?? stat.cupResult) : "Cup in progress";

  const isChampion = stat.cupResult === "Campeao";
  const typeLabel = isLeague ? "League" : isEuropean ? "European" : "Cup";

  return (
    <article data-tour="stats-competition-card" className={`rounded-lg border ${borderClass} ${bgClass} p-4 transition-colors hover:border-primary/35`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-display text-lg font-bold text-foreground">{stat.competition?.name ?? "Competition"}</p>
            <span className="rounded-full border border-border bg-background/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {typeLabel}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className={`text-sm font-semibold ${isChampion ? "text-[hsl(var(--gold))]" : isLeague ? "text-[hsl(var(--warning))]" : "text-muted-foreground"}`}>
              {resultBadge}
            </p>
            {isLeague && matches > 0 && (
              <span className="font-display text-sm font-bold text-[hsl(var(--warning))]">{pts} pts</span>
            )}
            <span className="text-xs text-muted-foreground">{matches} games</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[430px]">
          <CompactStat label="Record" value={`${stat.wins}W ${stat.draws}D ${stat.losses}L`} highlight={winRate >= 60 ? "primary" : winRate >= 40 ? "warning" : "destructive"} />
          <CompactStat label="Win %" value={`${winRate}%`} highlight={winRate >= 60 ? "primary" : winRate >= 40 ? "warning" : "destructive"} />
          <CompactStat label="Goals" value={`${stat.goalsPro}:${stat.goalsAgainst}`} />
          <CompactStat
            label="GD"
            value={goalDiff > 0 ? `+${goalDiff}` : String(goalDiff)}
            highlight={goalDiff > 0 ? "primary" : goalDiff < 0 ? "destructive" : "muted"}
          />
        </div>

        {canEdit && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              data-tour="stats-edit-competition"
              type="button"
              onClick={onEdit}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background/30 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              title="Edit statistics"
              aria-label="Edit statistics"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background/30 text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive-text"
              title="Remove competition"
              aria-label="Remove competition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

interface RankingMeta {
  key: RankingTabKey;
  label: string;
  title: string;
  icon: React.ElementType;
  tone: Tone;
  players: ApiPlayer[];
  getValue: (player: ApiPlayer) => number;
  formatValue: (value: number) => string;
  emptyLabel: string;
}

interface RankingPanelProps {
  rankings: RankingMeta[];
  activeRanking: RankingTabKey;
  onActiveRankingChange: (key: RankingTabKey) => void;
  onOpenAll: (key: RankingTabKey) => void;
}

function RankingPanel({ rankings, activeRanking, onActiveRankingChange, onOpenAll }: RankingPanelProps) {
  const active = rankings.find((ranking) => ranking.key === activeRanking) ?? rankings[0];
  const topPlayers = active.players.slice(0, 6);
  const Icon = active.icon;

  return (
    <section data-tour="stats-rankings" className="card-gamer p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Users size={16} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold leading-none">Individual highlights</h2>
            <p className="mt-1 text-xs text-muted-foreground">Focused rankings to compare impact without spreading attention.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {rankings.map((ranking) => {
            const RankingIcon = ranking.icon;
            const isActive = ranking.key === active.key;

            return (
              <button
                key={ranking.key}
                type="button"
                onClick={() => onActiveRankingChange(ranking.key)}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-background/25 text-muted-foreground hover:text-foreground"
                }`}
              >
                <RankingIcon size={13} />
                {ranking.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className={`rounded-md border border-border ${toneBgClass[active.tone]} p-4`}>
          <div className="mb-4 flex items-center gap-2">
            <Icon size={15} className={toneClass[active.tone]} />
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{active.title}</p>
          </div>
          {active.players[0] ? (
            <>
              <p className="truncate font-display text-3xl font-bold leading-none text-foreground">{active.players[0].name}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatPosition(active.players[0].position)}</p>
              <p className={`mt-5 font-display text-5xl font-bold leading-none ${toneClass[active.tone]}`}>
                {active.formatValue(active.getValue(active.players[0]))}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{active.emptyLabel}</p>
          )}
        </div>

        <div className="rounded-md border border-border bg-background/25 p-2">
          {topPlayers.length > 0 ? (
            <div className="divide-y divide-border">
              {topPlayers.map((player, index) => (
                <div key={player.id} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 px-2 py-3">
                  <span className={`font-display text-sm font-bold ${index === 0 ? toneClass[active.tone] : "text-muted-foreground"}`}>
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{player.name}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{formatPosition(player.position)}</span>
                      {player.nation && (
                        <Flag
                          code={player.nation}
                          style={{ width: 14, height: 10, borderRadius: 2, objectFit: "cover" }}
                        />
                      )}
                      {active.key !== "matches" && <span>{getStatValue(player, "matches")} games</span>}
                    </div>
                  </div>
                  <span className={`font-display text-base font-bold ${toneClass[active.tone]}`}>
                    {active.formatValue(active.getValue(player))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-3 text-sm text-muted-foreground">{active.emptyLabel}</p>
          )}

          {active.players.length > 0 && (
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={() => onOpenAll(active.key)}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ListFilter size={14} />
                View full ranking
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

interface RankingFullDialogProps {
  openKey: PlayerStatModalKey;
  onOpenChange: (open: boolean) => void;
  meta: Record<RankingTabKey, {
    title: string;
    players: ApiPlayer[];
    tone: Tone;
    getValue: (p: ApiPlayer) => number;
    formatValue: (v: number) => string;
  }>;
}

function RankingFullDialog({ openKey, onOpenChange, meta }: RankingFullDialogProps) {
  const active = openKey ? meta[openKey] : null;
  const topPlayer = active?.players[0] ?? null;

  return (
    <Dialog open={openKey !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-hidden border-border bg-card p-0">
        <div className="border-b border-border bg-background/35 px-5 py-4">
          <DialogHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md ${active ? toneBgClass[active.tone] : "bg-muted/40"} ${active ? toneClass[active.tone] : "text-muted-foreground"}`}>
                    <ListFilter size={15} />
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Full ranking
                  </span>
                </div>
                <DialogTitle className="font-display text-2xl leading-none">
                  {active?.title ?? "Ranking"}
                </DialogTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  {active ? `${active.players.length} player${active.players.length === 1 ? "" : "s"} with recorded stats` : ""}
                </p>
              </div>

              {topPlayer && active && (
                <div className={`min-w-[220px] rounded-md border border-border ${toneBgClass[active.tone]} p-3`}>
                  <div className="mb-2 flex items-center gap-2">
                    <Crown size={14} className={toneClass[active.tone]} />
                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Leader</span>
                  </div>
                  <p className="truncate font-display text-lg font-bold text-foreground">{topPlayer.name}</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{formatPosition(topPlayer.position)}</span>
                    <span className={`font-display text-3xl font-bold leading-none ${toneClass[active.tone]}`}>
                      {active.formatValue(active.getValue(topPlayer))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[calc(88vh-132px)]" viewportClassName="p-3" scrollbars="vertical">
          {active && active.players.length > 0 ? (
            <div className="divide-y divide-border rounded-md border border-border bg-background/25">
              {active.players.map((player, index) => {
                const isPodium = index < 3;

                return (
                  <div key={player.id} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/20">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md font-display text-sm font-bold ${
                      index === 0
                        ? `${toneBgClass[active.tone]} ${toneClass[active.tone]}`
                        : isPodium
                        ? "bg-muted/60 text-foreground"
                        : "bg-background/40 text-muted-foreground"
                    }`}>
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{player.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{formatPosition(player.position)}</span>
                        {player.nation && (
                          <Flag
                            code={player.nation}
                            style={{ width: 14, height: 10, borderRadius: 2, objectFit: "cover" }}
                          />
                        )}
                        {openKey !== "matches" && <span>{getStatValue(player, "matches")} games</span>}
                        {openKey === "goalContributions" && (
                          <span>{getStatValue(player, "goals")} G / {getStatValue(player, "assists")} A</span>
                        )}
                      </div>
                    </div>

                    <span className={`font-display text-lg font-bold tabular-nums ${toneClass[active.tone]}`}>
                      {active.formatValue(active.getValue(player))}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border border-border bg-background/25 p-6 text-center">
              <p className="font-display text-lg font-bold text-foreground">No records</p>
              <p className="mt-2 text-sm text-muted-foreground">When there are stats above zero, they appear here.</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

const StatsScreen = ({ saveId, selectedSeason, currentSeason, currentClubStintId }: Props) => {
  const { t } = useTranslation();
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<ApiTeamStats | null>(null);
  const [playerStatModal, setPlayerStatModal] = useState<PlayerStatModalKey>(null);
  const [activeRanking, setActiveRanking] = useState<RankingTabKey>("goals");
  const [addCompetitionOpen, setAddCompetitionOpen] = useState(false);
  const [statToRemove, setStatToRemove] = useState<ApiTeamStats | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const isPastSeason = !!(selectedSeason && currentSeason && selectedSeason !== currentSeason);
  const statsSeason = selectedSeason || currentSeason;

  const { data: squad = [], isLoading: isLoadingPlayers } = usePlayers(saveId, true, statsSeason);
  const { data: teamStatsData = [], isLoading: isLoadingTeamStats } = useTeamStats(saveId, statsSeason, currentClubStintId);
  const updateTeamStats = useUpdateTeamStats();
  const createTeamStats = useCreateTeamStats();
  const deleteTeamStats = useDeleteTeamStats();

  const registeredCompetitionIds = teamStatsData.map((stat) => stat.competitionId);
  const saveCountry =
    teamStatsData.find((stat) => stat.competition?.type === "League")?.competition?.country ?? null;

  const teamStats = getAggregateTeamStats(teamStatsData);
  const groupedStats = groupTeamStatsBySeason(teamStatsData);

  const positiveStatPlayers = useMemo(() => ({
    goals: [...squad]
      .filter((p) => getStatValue(p, "goals") > 0)
      .sort((a, b) => getStatValue(b, "goals") - getStatValue(a, "goals")),
    assists: [...squad]
      .filter((p) => getStatValue(p, "assists") > 0)
      .sort((a, b) => getStatValue(b, "assists") - getStatValue(a, "assists")),
    cleanSheets: [...squad]
      .filter((p) => CLEAN_SHEETS_POSITIONS.has(p.position) && getStatValue(p, "cleanSheets") > 0)
      .sort((a, b) => getStatValue(b, "cleanSheets") - getStatValue(a, "cleanSheets")),
    matches: [...squad]
      .filter((p) => getStatValue(p, "matches") > 0)
      .sort((a, b) => getStatValue(b, "matches") - getStatValue(a, "matches")),
    goalContributions: [...squad]
      .filter((p) => getGoalContributions(p) > 0)
      .sort((a, b) => getGoalContributions(b) - getGoalContributions(a)),
  }), [squad]);

  const totalGoals = squad.reduce((sum, player) => sum + getStatValue(player, "goals"), 0);
  const keyPlayer = positiveStatPlayers.goalContributions[0] ?? positiveStatPlayers.goals[0] ?? null;

  const rankingMeta: Record<RankingTabKey, RankingMeta> = {
    goals: {
      key: "goals",
      label: "Goals",
      title: "Top Scorer",
      icon: Target,
      players: positiveStatPlayers.goals,
      tone: "primary",
      getValue: (p) => getStatValue(p, "goals"),
      formatValue: (v) => String(v),
      emptyLabel: "No goals recorded.",
    },
    assists: {
      key: "assists",
      label: "Assists",
      title: "Playmaker",
      icon: Zap,
      players: positiveStatPlayers.assists,
      tone: "accent",
      getValue: (p) => getStatValue(p, "assists"),
      formatValue: (v) => String(v),
      emptyLabel: "No assists recorded.",
    },
    goalContributions: {
      key: "goalContributions",
      label: "G+A",
      title: "Goal contributions",
      icon: Goal,
      players: positiveStatPlayers.goalContributions,
      tone: "gold",
      getValue: getGoalContributions,
      formatValue: (v) => String(v),
      emptyLabel: "No contributions recorded.",
    },
    cleanSheets: {
      key: "cleanSheets",
      label: "Defense",
      title: "Clean sheets",
      icon: ShieldCheck,
      players: positiveStatPlayers.cleanSheets,
      tone: "accent",
      getValue: (p) => getStatValue(p, "cleanSheets"),
      formatValue: (v) => String(v),
      emptyLabel: "No clean sheets recorded.",
    },
    matches: {
      key: "matches",
      label: "Apps",
      title: "Most appearances",
      icon: Calendar,
      players: positiveStatPlayers.matches,
      tone: "primary",
      getValue: (p) => getStatValue(p, "matches"),
      formatValue: (v) => String(v),
      emptyLabel: "No appearances recorded.",
    },
  };

  const rankings = [
    rankingMeta.goals,
    rankingMeta.assists,
    rankingMeta.goalContributions,
    rankingMeta.cleanSheets,
    rankingMeta.matches,
  ];

  const playerStatModalMeta: Record<RankingTabKey, {
    title: string;
    players: ApiPlayer[];
    tone: Tone;
    getValue: (p: ApiPlayer) => number;
    formatValue: (v: number) => string;
  }> = {
    goals: {
      title: "Top Scorers",
      players: positiveStatPlayers.goals,
      tone: "primary",
      getValue: (p) => getStatValue(p, "goals"),
      formatValue: (v) => `${v} goals`,
    },
    assists: {
      title: "Playmakers",
      players: positiveStatPlayers.assists,
      tone: "accent",
      getValue: (p) => getStatValue(p, "assists"),
      formatValue: (v) => `${v} assists`,
    },
    cleanSheets: {
      title: "Clean Sheets",
      players: positiveStatPlayers.cleanSheets,
      tone: "accent",
      getValue: (p) => getStatValue(p, "cleanSheets"),
      formatValue: (v) => `${v} CS`,
    },
    matches: {
      title: "Most Appearances",
      players: positiveStatPlayers.matches,
      tone: "primary",
      getValue: (p) => getStatValue(p, "matches"),
      formatValue: (v) => `${v} games`,
    },
    goalContributions: {
      title: "Goal Contributions",
      players: positiveStatPlayers.goalContributions,
      tone: "gold",
      getValue: getGoalContributions,
      formatValue: (v) => `${v} contrib.`,
    },
  };

  const handleUpdateStats = async (stats: any) => {
    if (!selectedStat) {
      toast.error("No active stats found to edit.");
      return;
    }

    await updateTeamStats.mutateAsync({
      saveId,
      statsId: selectedStat.id,
      data: selectedStat.competition?.type === "League"
        ? { goalsPro: stats.goalsPro, goalsAgainst: stats.goalsAgainst, wins: stats.wins, draws: stats.draws, losses: stats.losses, leaguePosition: stats.leaguePosition }
        : { goalsPro: stats.goalsPro, goalsAgainst: stats.goalsAgainst, wins: stats.wins, draws: stats.draws, losses: stats.losses, cupResult: stats.cupResult },
    });
    toast.success("Stats updated!", { duration: 3000 });
    setStatsModalOpen(false);
    setSelectedStat(null);
  };

  const handleAddCompetition = async (competitionId: string) => {
    await createTeamStats.mutateAsync({
      saveId,
      data: { competitionId, season: statsSeason, clubStintId: currentClubStintId ?? undefined },
    });
    toast.success("Competition added!", { duration: 3000 });
  };

  const handleRemoveCompetition = async () => {
    if (!statToRemove) return;
    setIsRemoving(true);
    try {
      await deleteTeamStats.mutateAsync({ saveId, statsId: statToRemove.id });
      toast.success("Competition removed.", { duration: 3000 });
      setStatToRemove(null);
    } catch (err: any) {
      toast.error(extractErrorMessage(err), { duration: 5000 });
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoadingPlayers || isLoadingTeamStats) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" /> {t("stats.loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-10 animate-in fade-in duration-500">
      {isPastSeason && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-4 py-2 text-sm text-muted-foreground">
          <Calendar size={14} /> Viewing season {selectedSeason} — read-only mode
        </div>
      )}

      <div data-tour="stats-header" className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <BarChart3 size={15} className="text-primary" />
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Match room</p>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Season Statistics
          </h1>
        </div>
        <div className="rounded-md border border-border bg-background/35 px-4 py-2 sm:text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Season</p>
          <p className="font-display text-xl font-bold text-primary text-glow-primary">
            {statsSeason ?? "Not selected"}
          </p>
        </div>
      </div>

      {teamStats ? (
        <CampaignSummary
          teamStats={teamStats}
          competitions={teamStatsData.length}
          keyPlayer={keyPlayer}
          totalGoals={totalGoals}
        />
      ) : (
        <section className="card-gamer p-6">
          <p className="font-display text-xl font-bold text-foreground">No stats recorded</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Add competitions and results to build the season reading.
          </p>
        </section>
      )}

      {(groupedStats.length > 0 || !isPastSeason) && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))]">
                <Trophy size={15} />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold leading-none">Competitions</h2>
                <p className="mt-1 text-xs text-muted-foreground">Where the season was decided, competition by competition.</p>
              </div>
            </div>

            {!isPastSeason && (
              <button
                type="button"
                onClick={() => setAddCompetitionOpen(true)}
                className="flex items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-2 font-display text-sm font-bold text-primary transition-colors hover:bg-primary/15"
              >
                <Plus size={15} />
                Add competition
              </button>
            )}
          </div>

          {groupedStats.length > 0 ? (
            groupedStats.map((group) => (
              <div key={group.season} className="space-y-3">
                <div className="flex items-center gap-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    {group.season}
                  </p>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {group.stats.map((stat) => (
                    <CompetitionCard
                      key={stat.id}
                      stat={stat}
                      canEdit={!isPastSeason}
                      onEdit={() => {
                        setSelectedStat(stat);
                        setStatsModalOpen(true);
                      }}
                      onRemove={() => setStatToRemove(stat)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-border bg-background/20 p-6 text-center">
              <p className="font-display text-base font-bold text-foreground">No competitions registered</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add the competitions your club is playing this season to start tracking results.
              </p>
            </div>
          )}
        </section>
      )}

      <RankingPanel
        rankings={rankings}
        activeRanking={activeRanking}
        onActiveRankingChange={setActiveRanking}
        onOpenAll={setPlayerStatModal}
      />

      <StatsModal
        open={statsModalOpen}
        onOpenChange={setStatsModalOpen}
        stat={selectedStat}
        onSave={handleUpdateStats}
      />

      <RankingFullDialog
        openKey={playerStatModal}
        onOpenChange={(open) => { if (!open) setPlayerStatModal(null); }}
        meta={playerStatModalMeta}
      />

      <AddCompetitionModal
        open={addCompetitionOpen}
        onOpenChange={setAddCompetitionOpen}
        season={statsSeason}
        saveCountry={saveCountry}
        registeredCompetitionIds={registeredCompetitionIds}
        onAdd={handleAddCompetition}
      />

      <AlertDialog open={!!statToRemove} onOpenChange={(open) => { if (!open && !isRemoving) setStatToRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove competition?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes <span className="font-semibold text-foreground">{statToRemove?.competition?.name ?? "this competition"}</span> from {statToRemove?.season} and deletes its recorded results. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleRemoveCompetition(); }}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StatsScreen;
