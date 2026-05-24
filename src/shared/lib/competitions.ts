import type { ApiCompetition, ApiTeamStats, ApiTrophy } from "@/shared/api/client";

export type AggregateTeamStats = Pick<ApiTeamStats, "wins" | "draws" | "losses" | "goalsPro" | "goalsAgainst">;

export const CUP_OPTIONS = [
  { value: "NaoParticipou", label: "Did not participate" },
  { value: "Eliminado", label: "Eliminated" },
  { value: "OitavasOuFaseDeGrupos", label: "Round of 16 / Group stage" },
  { value: "Quartas", label: "Quarter-finals" },
  { value: "Semifinal", label: "Semi-finals" },
  { value: "Final", label: "Final" },
  { value: "Campeao", label: "Champion" },
] as const;

export const CUP_LABELS: Record<string, string> = {
  NaoParticipou: "Did not participate",
  Eliminado: "Group stage / 1st round",
  OitavasOuFaseDeGrupos: "Round of 16",
  Quartas: "Quarter-finals",
  Semifinal: "Semi-finals",
  Final: "Final",
  Campeao: "🏆 Champion",
};

export function getCompetitionAccent(competition?: Pick<ApiCompetition, "name" | "type"> | null) {
  if (!competition) {
    return { borderClass: "border-border", bgClass: "bg-muted/50" };
  }

  if (competition.type === "League") {
    return { borderClass: "border-yellow-500/30", bgClass: "bg-yellow-500/5" };
  }

  if (competition.type === "EuropeanCup") {
    return { borderClass: "border-primary/30", bgClass: "bg-primary/5" };
  }

  return { borderClass: "border-accent/30", bgClass: "bg-accent/5" };
}

export function getLeagueStats(stats: ApiTeamStats[]) {
  return stats.find((item) => item.competition?.type === "League") ?? stats[0] ?? null;
}

export function getAggregateTeamStats(stats: ApiTeamStats[]): AggregateTeamStats | null {
  if (stats.length === 0) {
    return null;
  }

  return stats.reduce(
    (acc, stat) => ({
      wins: acc.wins + stat.wins,
      draws: acc.draws + stat.draws,
      losses: acc.losses + stat.losses,
      goalsPro: acc.goalsPro + stat.goalsPro,
      goalsAgainst: acc.goalsAgainst + stat.goalsAgainst,
    }),
    { wins: 0, draws: 0, losses: 0, goalsPro: 0, goalsAgainst: 0 }
  );
}

export function groupTeamStatsBySeason(stats: ApiTeamStats[]) {
  return Object.entries(
    stats.reduce<Record<string, ApiTeamStats[]>>((acc, stat) => {
      if (!acc[stat.season]) acc[stat.season] = [];
      acc[stat.season].push(stat);
      return acc;
    }, {})
  )
    .sort(([seasonA], [seasonB]) => seasonB.localeCompare(seasonA))
    .map(([season, seasonStats]) => ({
      season,
      stats: [...seasonStats].sort((a, b) => {
        if (a.competition?.type === "League" && b.competition?.type !== "League") return -1;
        if (a.competition?.type !== "League" && b.competition?.type === "League") return 1;
        return (a.competition?.name ?? "Competition").localeCompare(b.competition?.name ?? "Competition");
      }),
    }));
}

export function formatTrophyLabel(trophy: ApiTrophy) {
  return `${trophy.club ?? "—"} — ${trophy.competition.name} ${trophy.year}/${String(trophy.year + 1).slice(-2)}`;
}
