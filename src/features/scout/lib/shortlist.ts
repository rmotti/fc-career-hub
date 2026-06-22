import type { Fc26Player, PlayerPosition } from "@/shared/api/client";
import type { ShortlistPositionGroup } from "@/features/scout/ui/types";
import { PLAYER_POSITIONS } from "@/shared/lib/playerPositions";

export function getPositionSortIndex(position: PlayerPosition) {
  const index = PLAYER_POSITIONS.indexOf(position);
  return index === -1 ? PLAYER_POSITIONS.length : index;
}

export function getPrimaryPosition(player: Fc26Player) {
  return player.positions[0] ?? null;
}

export function groupShortlistPlayers(players: Fc26Player[]): ShortlistPositionGroup[] {
  const groups = new Map<PlayerPosition, Fc26Player[]>();

  players.forEach((player) => {
    const position = getPrimaryPosition(player);
    if (!position) return;

    groups.set(position, [...(groups.get(position) ?? []), player]);
  });

  return [...groups.entries()]
    .sort(([positionA], [positionB]) => getPositionSortIndex(positionA) - getPositionSortIndex(positionB))
    .map(([position, positionPlayers]) => ({
      position,
      players: [...positionPlayers].sort((a, b) => {
        const ovrDiff = b.ovr - a.ovr;
        if (ovrDiff !== 0) return ovrDiff;

        const potentialDiff = b.potential - a.potential;
        if (potentialDiff !== 0) return potentialDiff;

        return a.name.localeCompare(b.name, "pt-BR");
      }),
    }));
}

export function getAverageOvr(players: Fc26Player[]) {
  if (!players.length) return null;

  return Math.round(players.reduce((total, player) => total + player.ovr, 0) / players.length);
}

export function getBestMetricPlayer(players: Fc26Player[], score: (player: Fc26Player) => number | null | undefined) {
  return players.reduce<{ player: Fc26Player | null; score: number }>(
    (best, player) => {
      const value = score(player);

      if (typeof value !== "number" || !Number.isFinite(value)) return best;
      if (!best.player || value > best.score) return { player, score: value };

      return best;
    },
    { player: null, score: Number.NEGATIVE_INFINITY }
  ).player;
}
