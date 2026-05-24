import { describe, expect, it } from "vitest";
import {
  getActiveSoldPlayers,
  getInactivePlayersToReactivate,
  shouldRemovePlayerFromSquad,
} from "@/shared/lib/playerTransferStatus";
import type { ApiPlayer, ApiTransfer } from "@/shared/api/client";

function createPlayer(overrides: Partial<ApiPlayer>): ApiPlayer {
  return {
    id: "player-1",
    saveId: "save-1",
    clubStintId: "stint-1",
    name: "Player",
    position: "ATA",
    age: 24,
    status: "Important",
    ovr: 80,
    isActive: true,
    ...overrides,
  };
}

function createTransfer(overrides: Partial<ApiTransfer>): ApiTransfer {
  return {
    id: "transfer-1",
    saveId: "save-1",
    playerName: "Player",
    type: "venda",
    from: "Clube A",
    to: "Clube B",
    season: "2026/27",
    ...overrides,
  };
}

describe("playerTransferStatus", () => {
  it("removes from squad on sale and outgoing loan", () => {
    expect(shouldRemovePlayerFromSquad("venda")).toBe(true);
    expect(shouldRemovePlayerFromSquad("emprestimo_saida")).toBe(true);
    expect(shouldRemovePlayerFromSquad("compra")).toBe(false);
    expect(shouldRemovePlayerFromSquad("emprestimo_entrada")).toBe(false);
  });

  it("identifies registered sales that still left the player active", () => {
    const players = [
      createPlayer({ id: "sold-active", isActive: true }),
      createPlayer({ id: "loaned-out", isActive: false }),
      createPlayer({ id: "active-ok", isActive: true }),
    ];

    const transfers = [
      createTransfer({ playerId: "sold-active", type: "venda" }),
      createTransfer({ id: "transfer-2", playerId: "loaned-out", type: "emprestimo_saida" }),
    ];

    expect(getActiveSoldPlayers(players, transfers).map((player) => player.id)).toEqual(["sold-active"]);
  });

  it("reactivates only players who were out on loan at the season turnover", () => {
    const players = [
      createPlayer({ id: "sold-player", isActive: false }),
      createPlayer({ id: "loaned-player", isActive: false }),
      createPlayer({ id: "active-player", isActive: true }),
    ];

    const transfers = [
      createTransfer({ playerId: "sold-player", type: "venda" }),
      createTransfer({ id: "transfer-2", playerId: "loaned-player", type: "emprestimo_saida" }),
    ];

    expect(getInactivePlayersToReactivate(players, transfers).map((player) => player.id)).toEqual(["loaned-player"]);
  });
});
