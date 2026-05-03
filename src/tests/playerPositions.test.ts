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
  it("trata campo ausente como lista vazia", () => {
    expect(getAlternativePositions(player({ alternativePosition: undefined }))).toEqual([]);
  });

  it("remove duplicadas, inválidas e a posição principal", () => {
    expect(normalizeAlternativePositions(["PD", "SA", "PD", "PE", "INVALID"], "PE")).toEqual(["PD", "SA"]);
  });

  it("não permite GOL como alternativa de jogador de linha", () => {
    expect(normalizeAlternativePositions(["GOL", "PD", "SA"], "PE")).toEqual(["PD", "SA"]);
  });

  it("não permite posições de linha como alternativas de goleiro", () => {
    expect(normalizeAlternativePositions(["ZAG", "GOL"], "GOL")).toEqual([]);
  });

  it("aceita posição alternativa como posição jogável", () => {
    const winger = player({ alternativePosition: { positions: ["PD", "SA"] } });

    expect(playerCanPlayPosition(winger, "PE")).toBe(true);
    expect(playerCanPlayPosition(winger, "PD")).toBe(true);
    expect(playerCanPlayPosition(winger, "SA")).toBe(true);
    expect(playerCanPlayPosition(winger, "GOL")).toBe(false);
  });
});
