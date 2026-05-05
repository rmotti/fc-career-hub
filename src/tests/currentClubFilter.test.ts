import { describe, expect, it } from "vitest";
import { filterOutCurrentClubPlayers, isSameClubName } from "@/features/scout/model/currentClubFilter";

describe("current club scout filter", () => {
  it("identifica o mesmo clube com acento e preposição diferentes", () => {
    expect(isSameClubName("Atlético Madrid", "Atletico de Madrid")).toBe(true);
  });

  it("mantém clubes com nomes próximos mas diferentes", () => {
    expect(isSameClubName("Real Madrid CF", "Real Valladolid CF")).toBe(false);
  });

  it("remove jogadores do clube atual da lista do scout", () => {
    const players = [
      { sofifaId: 1, name: "Julian Alvarez", club: "Atlético Madrid" },
      { sofifaId: 2, name: "Antoine Griezmann", club: "Atletico de Madrid" },
      { sofifaId: 3, name: "Pedri", club: "FC Barcelona" },
      { sofifaId: 4, name: "Free Agent", club: null },
    ];

    expect(filterOutCurrentClubPlayers(players, "Atlético de Madrid")).toEqual([
      { sofifaId: 3, name: "Pedri", club: "FC Barcelona" },
      { sofifaId: 4, name: "Free Agent", club: null },
    ]);
  });
});
