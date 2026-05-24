import { describe, expect, it } from "vitest";
import { getAlternativePositions, normalizeAlternativePositions, playerCanPlayPosition } from "@/shared/lib/playerPositions";
import type { ApiPlayer } from "@/shared/api/client";

const player = (overrides: Partial<ApiPlayer>): ApiPlayer => ({
  id: "player-1",
  saveId: "save-1",
  clubStintId: "stint-1",
  name: "Player",
  position: "PE",
  age: 24,
  status: "Important",
  ovr: 82,
  isActive: true,
  ...overrides,
});

describe("playerPositions", () => {
  it("treats missing field as empty list", () => {
    expect(getAlternativePositions(player({ alternativePosition: undefined }))).toEqual([]);
  });

  it("removes duplicates, invalid positions and the main position", () => {
    expect(normalizeAlternativePositions(["PD", "SA", "PD", "PE", "INVALID"], "PE")).toEqual(["PD", "SA"]);
  });

  it("does not allow GOL as an alternative for outfield players", () => {
    expect(normalizeAlternativePositions(["GOL", "PD", "SA"], "PE")).toEqual(["PD", "SA"]);
  });

  it("does not allow outfield positions as goalkeeper alternatives", () => {
    expect(normalizeAlternativePositions(["ZAG", "GOL"], "GOL")).toEqual([]);
  });

  it("accepts alternative position as a playable position", () => {
    const winger = player({ alternativePosition: { positions: ["PD", "SA"] } });

    expect(playerCanPlayPosition(winger, "PE")).toBe(true);
    expect(playerCanPlayPosition(winger, "PD")).toBe(true);
    expect(playerCanPlayPosition(winger, "SA")).toBe(true);
    expect(playerCanPlayPosition(winger, "GOL")).toBe(false);
  });
});
