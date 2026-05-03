import { describe, it, expect } from "vitest";
import { getBadge } from "@/entities/player/model/playerBadge";

const player = (ovr: number, age: number, potential?: number | null, ovrDelta?: number | null) =>
  ({ ovr, age, potential, ovrDelta });

describe("getBadge", () => {
  describe("Elite", () => {
    it("retorna Elite quando ovr >= 88", () => {
      expect(getBadge(player(88, 25))).toMatchObject({ label: "Elite" });
      expect(getBadge(player(95, 30))).toMatchObject({ label: "Elite" });
    });

    it("Elite tem prioridade sobre squad role", () => {
      expect(getBadge(player(90, 25), "artilheiro")).toMatchObject({ label: "Elite" });
      expect(getBadge(player(90, 25), "garçom")).toMatchObject({ label: "Elite" });
      expect(getBadge(player(90, 25), "motor")).toMatchObject({ label: "Elite" });
    });

    it("não retorna Elite quando ovr < 88", () => {
      expect(getBadge(player(87, 25))).not.toMatchObject({ label: "Elite" });
    });
  });

  describe("Squad roles", () => {
    it("retorna Artilheiro", () => {
      expect(getBadge(player(80, 25), "artilheiro")).toMatchObject({ label: "Artilheiro" });
    });

    it("retorna Garçom", () => {
      expect(getBadge(player(80, 25), "garçom")).toMatchObject({ label: "Garçom" });
    });

    it("retorna Motor", () => {
      expect(getBadge(player(80, 25), "motor")).toMatchObject({ label: "Motor" });
    });
  });

  describe("Em ascensão", () => {
    it("retorna Em ascensão quando ovrDelta >= 5", () => {
      expect(getBadge(player(80, 25, null, 5))).toMatchObject({ label: "Em ascensão" });
      expect(getBadge(player(80, 25, null, 10))).toMatchObject({ label: "Em ascensão" });
    });

    it("não retorna Em ascensão quando ovrDelta < 5", () => {
      expect(getBadge(player(80, 25, null, 4))).not.toMatchObject({ label: "Em ascensão" });
    });

    it("não retorna Em ascensão quando ovrDelta é null", () => {
      expect(getBadge(player(80, 25, null, null))).not.toMatchObject({ label: "Em ascensão" });
    });
  });

  describe("Promessa", () => {
    it("retorna Promessa para jogador jovem com potential 88-89", () => {
      expect(getBadge(player(75, 21, 88))).toMatchObject({ label: "Promessa" });
      expect(getBadge(player(75, 21, 89))).toMatchObject({ label: "Promessa" });
    });

    it("não retorna Promessa quando age > 21", () => {
      expect(getBadge(player(75, 22, 89))).not.toMatchObject({ label: "Promessa" });
    });

    it("não retorna Promessa quando potential < 88", () => {
      expect(getBadge(player(75, 21, 87))).not.toMatchObject({ label: "Promessa" });
    });

    it("não retorna Promessa quando potential >= 90", () => {
      expect(getBadge(player(75, 21, 90))).not.toMatchObject({ label: "Promessa" });
    });
  });

  describe("Diamante", () => {
    it("retorna Diamante para jogador jovem com potential >= 92", () => {
      expect(getBadge(player(75, 21, 92))).toMatchObject({ label: "Diamante" });
      expect(getBadge(player(75, 18, 95))).toMatchObject({ label: "Diamante" });
    });

    it("não retorna Diamante quando age > 21", () => {
      expect(getBadge(player(75, 22, 92))).not.toMatchObject({ label: "Diamante" });
    });

    it("não retorna Diamante quando potential < 92", () => {
      expect(getBadge(player(75, 21, 91))).not.toMatchObject({ label: "Diamante" });
    });
  });

  describe("Veterano", () => {
    it("retorna Veterano quando age >= 34 e ovr >= 85", () => {
      expect(getBadge(player(85, 34))).toMatchObject({ label: "Veterano" });
      expect(getBadge(player(90, 38))).not.toMatchObject({ label: "Veterano" }); // Elite tem prioridade
      expect(getBadge(player(87, 38))).toMatchObject({ label: "Veterano" }); // ovr 87 < 88, age 38 >= 34
    });

    it("não retorna Veterano quando age < 34", () => {
      expect(getBadge(player(85, 33))).not.toMatchObject({ label: "Veterano" });
    });

    it("não retorna Veterano quando ovr < 85", () => {
      expect(getBadge(player(84, 34))).not.toMatchObject({ label: "Veterano" });
    });
  });

  describe("sem badge", () => {
    it("retorna null quando nenhuma condição é atendida", () => {
      expect(getBadge(player(75, 25, 80, 2))).toBeNull();
    });

    it("retorna null para jogador mediano sem destaque", () => {
      expect(getBadge(player(70, 28, null, null))).toBeNull();
    });
  });

  describe("estrutura do badge", () => {
    it("todos os badges têm label, icon e color", () => {
      const badges = [
        getBadge(player(88, 25)),
        getBadge(player(80, 25), "artilheiro"),
        getBadge(player(80, 25), "garçom"),
        getBadge(player(80, 25), "motor"),
        getBadge(player(80, 25, null, 5)),
        getBadge(player(75, 21, 88)),
        getBadge(player(75, 21, 92)),
        getBadge(player(85, 34)),
      ];

      badges.forEach((badge) => {
        expect(badge).not.toBeNull();
        expect(badge).toHaveProperty("label");
        expect(badge).toHaveProperty("icon");
        expect(badge).toHaveProperty("color");
      });
    });
  });
});
