import type { Fc26Player } from "@/shared/api/client";
import { formatMarketValue, formatWage, getGeneralRatingAverage, getVisibleFitScore } from "@/features/scout/lib/format";

type Dimension = "ovr" | "fit" | "growth" | "average";

const DIMENSION_LABELS: Record<Dimension, string> = {
  ovr: "the highest overall",
  fit: "the strongest fit",
  growth: "the most room to grow",
  average: "the best all-round ratings",
};

function shortName(player: Fc26Player) {
  return player.name;
}

function bestBy(players: Fc26Player[], value: (player: Fc26Player) => number | null | undefined, dir: "higher" | "lower" = "higher") {
  let leader: Fc26Player | null = null;
  let leaderValue = dir === "higher" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  let tied = false;

  for (const player of players) {
    const raw = value(player);
    if (typeof raw !== "number" || !Number.isFinite(raw)) continue;

    if (!leader) {
      leader = player;
      leaderValue = raw;
      continue;
    }

    if (raw === leaderValue) {
      tied = true;
    } else if (dir === "higher" ? raw > leaderValue : raw < leaderValue) {
      leader = player;
      leaderValue = raw;
      tied = false;
    }
  }

  return leader ? { player: leader, value: leaderValue, tied } : null;
}

/** Joins clauses into a readable list: "A, B and C". */
function listClauses(clauses: string[]) {
  if (clauses.length <= 1) return clauses[0] ?? "";
  if (clauses.length === 2) return `${clauses[0]} and ${clauses[1]}`;
  return `${clauses.slice(0, -1).join(", ")} and ${clauses[clauses.length - 1]}`;
}

/**
 * Builds a short prose "report" comparing the selected players, highlighting
 * who leads on overall, fit, potential growth and ratings, and the price trade-off.
 * Returns an empty array when there's nothing meaningful to say.
 */
export function buildComparisonNarrative(players: Fc26Player[]): string[] {
  if (players.length < 2) return [];

  const leaders: Partial<Record<Dimension, Fc26Player>> = {
    ovr: bestBy(players, (p) => p.ovr)?.player ?? undefined,
    fit: bestBy(players, (p) => getVisibleFitScore(p))?.player ?? undefined,
    growth: bestBy(players, (p) => p.potential - p.ovr)?.player ?? undefined,
    average: bestBy(players, (p) => getGeneralRatingAverage(p))?.player ?? undefined,
  };

  // Group dimensions led by each player so a single dominant player reads as one clause.
  const ledByPlayer = new Map<number, { player: Fc26Player; dims: Dimension[] }>();
  (Object.keys(leaders) as Dimension[]).forEach((dim) => {
    const player = leaders[dim];
    if (!player) return;
    const entry = ledByPlayer.get(player.sofifaId) ?? { player, dims: [] };
    entry.dims.push(dim);
    ledByPlayer.set(player.sofifaId, entry);
  });

  const sentences: string[] = [];

  const sortedLeaders = [...ledByPlayer.values()].sort((a, b) => b.dims.length - a.dims.length);
  const leadClauses = sortedLeaders.map(({ player, dims }) => {
    const labels = listClauses(dims.map((dim) => DIMENSION_LABELS[dim]));
    return `${shortName(player)} has ${labels}`;
  });

  if (leadClauses.length === 1) {
    // One player sweeps every dimension.
    sentences.push(`${leadClauses[0]} of the group.`);
  } else if (leadClauses.length > 1) {
    sentences.push(`${listClauses(leadClauses)}.`);
  }

  // Price trade-off.
  const cheapest = bestBy(players, (p) => (typeof p.marketValue === "number" ? p.marketValue : null), "lower");
  const priciest = bestBy(players, (p) => (typeof p.marketValue === "number" ? p.marketValue : null), "higher");

  if (cheapest && priciest && cheapest.player.sofifaId !== priciest.player.sofifaId) {
    const cheapestName = shortName(cheapest.player);
    const priciestName = shortName(priciest.player);
    const priciestLeadsValue = sortedLeaders[0]?.player.sofifaId === priciest.player.sofifaId;

    if (priciestLeadsValue) {
      sentences.push(
        `That edge comes at a cost: ${priciestName} is the most expensive at ${formatMarketValue(priciest.player.marketValue)} · ${formatWage(priciest.player.wage)}, while ${cheapestName} is the cheapest at ${formatMarketValue(cheapest.player.marketValue)}.`,
      );
    } else {
      sentences.push(
        `On price, ${cheapestName} is the cheapest at ${formatMarketValue(cheapest.player.marketValue)} and ${priciestName} the most expensive at ${formatMarketValue(priciest.player.marketValue)}.`,
      );
    }
  }

  return sentences;
}
