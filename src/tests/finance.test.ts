import { describe, expect, it } from "vitest";
import { calculateBalanceFromTransfers } from "@/utils/finance";

describe("finance", () => {
  it("recalcula o saldo a partir do orçamento e das transferências atuais", () => {
    const balance = calculateBalanceFromTransfers(85_000_000, [
      {
        id: "1",
        saveId: "save-1",
        playerName: "A",
        type: "compra",
        from: "Clube A",
        to: "Clube B",
        fee: 20,
        season: "2026/27",
      },
      {
        id: "2",
        saveId: "save-1",
        playerName: "B",
        type: "venda",
        from: "Clube B",
        to: "Clube C",
        fee: 12.5,
        season: "2026/27",
      },
      {
        id: "3",
        saveId: "save-1",
        playerName: "C",
        type: "emprestimo_entrada",
        from: "Clube C",
        to: "Clube B",
        fee: 3,
        season: "2026/27",
      },
    ]);

    expect(balance).toBe(77_500_000);
  });

  it("ignora transferências sem impacto financeiro", () => {
    const balance = calculateBalanceFromTransfers(50_000_000, [
      {
        id: "1",
        saveId: "save-1",
        playerName: "A",
        type: "emprestimo_saida",
        from: "Clube A",
        to: "Clube B",
        season: "2026/27",
      },
      {
        id: "2",
        saveId: "save-1",
        playerName: "B",
        type: "compra",
        from: "Clube C",
        to: "Clube A",
        season: "2026/27",
      },
    ]);

    expect(balance).toBe(50_000_000);
  });
});
