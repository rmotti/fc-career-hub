import { describe, it, expect } from "vitest";
import { getBadge } from "@/entities/player/model/playerBadge";

const player = (ovr: number, age: number, potential?: number | null, ovrDelta?: number | null) =>
  ({ ovr, age, potential, ovrDelta });

describe("getBadge", () => {
  describe("Elite", () => {
    it("returns Elite when ovr >= 88", () => {
      expect(getBadge(player(88, 25))).toMatchObject({ label: "Elite" });
      expect(getBadge(player(95, 30))).toMatchObject({ label: "Elite" });
    });

    it("Elite takes priority over squad role", () => {
      expect(getBadge(player(90, 25), "scorer")).toMatchObject({ label: "Elite" });
      expect(getBadge(player(90, 25), "playmaker")).toMatchObject({ label: "Elite" });
      expect(getBadge(player(90, 25), "engine")).toMatchObject({ label: "Elite" });
    });

    it("does not return Elite when ovr < 88", () => {
      expect(getBadge(player(87, 25))).not.toMatchObject({ label: "Elite" });
    });
  });

  describe("Squad roles", () => {
    it("returns Top Scorer", () => {
      expect(getBadge(player(80, 25), "scorer")).toMatchObject({ label: "Top Scorer" });
    });

    it("returns Playmaker", () => {
      expect(getBadge(player(80, 25), "playmaker")).toMatchObject({ label: "Playmaker" });
    });

    it("returns Engine", () => {
      expect(getBadge(player(80, 25), "engine")).toMatchObject({ label: "Engine" });
    });
  });

  describe("Rising", () => {
    it("returns Rising when ovrDelta >= 5", () => {
      expect(getBadge(player(80, 25, null, 5))).toMatchObject({ label: "Rising" });
      expect(getBadge(player(80, 25, null, 10))).toMatchObject({ label: "Rising" });
    });

    it("does not return Rising when ovrDelta < 5", () => {
      expect(getBadge(player(80, 25, null, 4))).not.toMatchObject({ label: "Rising" });
    });

    it("does not return Rising when ovrDelta is null", () => {
      expect(getBadge(player(80, 25, null, null))).not.toMatchObject({ label: "Rising" });
    });
  });

  describe("Prospect", () => {
    it("returns Prospect for young player with potential 88-89", () => {
      expect(getBadge(player(75, 21, 88))).toMatchObject({ label: "Prospect" });
      expect(getBadge(player(75, 21, 89))).toMatchObject({ label: "Prospect" });
    });

    it("does not return Prospect when age > 21", () => {
      expect(getBadge(player(75, 22, 89))).not.toMatchObject({ label: "Prospect" });
    });

    it("does not return Prospect when potential < 88", () => {
      expect(getBadge(player(75, 21, 87))).not.toMatchObject({ label: "Prospect" });
    });

    it("does not return Prospect when potential >= 90", () => {
      expect(getBadge(player(75, 21, 90))).not.toMatchObject({ label: "Prospect" });
    });
  });

  describe("Diamond", () => {
    it("returns Diamond for young player with potential >= 92", () => {
      expect(getBadge(player(75, 21, 92))).toMatchObject({ label: "Diamond" });
      expect(getBadge(player(75, 18, 95))).toMatchObject({ label: "Diamond" });
    });

    it("does not return Diamond when age > 21", () => {
      expect(getBadge(player(75, 22, 92))).not.toMatchObject({ label: "Diamond" });
    });

    it("does not return Diamond when potential < 92", () => {
      expect(getBadge(player(75, 21, 91))).not.toMatchObject({ label: "Diamond" });
    });
  });

  describe("Veteran", () => {
    it("returns Veteran when age >= 34 and ovr >= 85", () => {
      expect(getBadge(player(85, 34))).toMatchObject({ label: "Veteran" });
      expect(getBadge(player(90, 38))).not.toMatchObject({ label: "Veteran" }); // Elite takes priority
      expect(getBadge(player(87, 38))).toMatchObject({ label: "Veteran" }); // ovr 87 < 88, age 38 >= 34
    });

    it("does not return Veteran when age < 34", () => {
      expect(getBadge(player(85, 33))).not.toMatchObject({ label: "Veteran" });
    });

    it("does not return Veteran when ovr < 85", () => {
      expect(getBadge(player(84, 34))).not.toMatchObject({ label: "Veteran" });
    });
  });

  describe("no badge", () => {
    it("returns null when no condition is met", () => {
      expect(getBadge(player(75, 25, 80, 2))).toBeNull();
    });

    it("returns null for average player without highlights", () => {
      expect(getBadge(player(70, 28, null, null))).toBeNull();
    });
  });

  describe("badge structure", () => {
    it("all badges have label, icon and color", () => {
      const badges = [
        getBadge(player(88, 25)),
        getBadge(player(80, 25), "scorer"),
        getBadge(player(80, 25), "playmaker"),
        getBadge(player(80, 25), "engine"),
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
