import type { ApiPlayer, PlayerPosition } from "@/shared/api/client";

export const PLAYER_POSITIONS = ["GOL", "LD", "LE", "ZAG", "VOL", "MC", "ME", "MD", "MEI", "PE", "PD", "SA", "ATA"] as const satisfies readonly PlayerPosition[];

// Display aliases: internal values remain in Portuguese (API contract), labels are English
export const POSITION_LABELS: Record<PlayerPosition, string> = {
  GOL: "GK",
  LD: "RB",
  LE: "LB",
  ZAG: "ZAG",
  VOL: "CDM",
  MC: "CM",
  MEI: "CAM",
  ME: "LM",
  MD: "RM",
  PE: "LW",
  PD: "RW",
  SA: "CF",
  ATA: "ST",
};

export function formatPosition(position: PlayerPosition): string {
  return POSITION_LABELS[position] ?? position;
}

export function normalizeAlternativePositions(
  positions: readonly string[] | undefined,
  mainPosition?: string,
): PlayerPosition[] {
  const seen = new Set<string>();
  const mainIsGoalkeeper = mainPosition === "GOL";

  return (positions ?? []).filter((position): position is PlayerPosition => {
    if (!PLAYER_POSITIONS.includes(position as PlayerPosition)) return false;
    if (position === mainPosition) return false;
    if (mainIsGoalkeeper) return false;
    if (position === "GOL") return false;
    if (seen.has(position)) return false;
    seen.add(position);
    return true;
  });
}

export function getAlternativePositions(player: Pick<ApiPlayer, "alternativePosition" | "position">): PlayerPosition[] {
  return normalizeAlternativePositions(player.alternativePosition?.positions, player.position);
}

export function getPlayerPositions(player: Pick<ApiPlayer, "alternativePosition" | "position">): PlayerPosition[] {
  return [player.position, ...getAlternativePositions(player)];
}

export function playerCanPlayPosition(player: Pick<ApiPlayer, "alternativePosition" | "position">, position: string) {
  return getPlayerPositions(player).includes(position as PlayerPosition);
}
