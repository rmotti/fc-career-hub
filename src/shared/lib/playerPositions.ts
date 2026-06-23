import type { ApiPlayer, PlayerPosition } from "@/shared/api/client";

export const PLAYER_POSITIONS = ["GOL", "LD", "LE", "ZAG", "VOL", "MC", "ME", "MD", "MEI", "PE", "PD", "SA", "ATA"] as const satisfies readonly PlayerPosition[];

// Display aliases: internal values remain in Portuguese (API contract), labels are English
export const POSITION_LABELS: Record<PlayerPosition, string> = {
  GOL: "GK",
  LD: "RB",
  LE: "LB",
  ZAG: "CB",
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

export function formatPosition(position: string): string {
  return POSITION_LABELS[position as PlayerPosition] ?? position;
}

// Field areas (buckets). The fit-score backend aggregates signing history by these
// broad zones (GK / defense / midfield / attack), not by exact position.
export type PositionArea = "GK" | "DEF" | "MID" | "ATT";

export const POSITION_AREA: Record<PlayerPosition, PositionArea> = {
  GOL: "GK",
  LD: "DEF",
  LE: "DEF",
  ZAG: "DEF",
  VOL: "MID",
  MC: "MID",
  MEI: "MID",
  ME: "MID",
  MD: "MID",
  PE: "ATT",
  PD: "ATT",
  SA: "ATT",
  ATA: "ATT",
};

// e.g. "Historical signings in midfield"
export const POSITION_AREA_PHRASE: Record<PositionArea, string> = {
  GK: "in goal",
  DEF: "in defense",
  MID: "in midfield",
  ATT: "in attack",
};

export function getPositionArea(position: string): PositionArea | null {
  return POSITION_AREA[position as PlayerPosition] ?? null;
}

export function getPositionAreaPhrase(position: string): string {
  const area = getPositionArea(position);
  return area ? POSITION_AREA_PHRASE[area] : "in this area";
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
