import { describe, it, expect } from "vitest";
import { isProFeaturePath } from "@/shared/api/client";

describe("isProFeaturePath", () => {
  it("matches prefix-based PRO roots", () => {
    expect(isProFeaturePath("/fc26-players")).toBe(true);
    expect(isProFeaturePath("/fc26-players/filters")).toBe(true);
    expect(isProFeaturePath("/chat/messages")).toBe(true);
    expect(isProFeaturePath("/scout/playbooks?saveId=1")).toBe(true);
  });

  it("covers /scouting intentionally via the /scout prefix", () => {
    expect(isProFeaturePath("/scouting")).toBe(true);
  });

  it("matches nested shortlist and saved-searches sub-resources", () => {
    expect(isProFeaturePath("/saves/abc123/shortlist")).toBe(true);
    expect(isProFeaturePath("/saves/abc123/shortlist/xyz")).toBe(true);
    expect(isProFeaturePath("/saves/abc123/saved-searches")).toBe(true);
    expect(isProFeaturePath("/saves/abc123/saved-searches?q=1")).toBe(true);
  });

  it("does NOT gate the rest of the non-PRO /saves tree", () => {
    expect(isProFeaturePath("/saves")).toBe(false);
    expect(isProFeaturePath("/saves/abc123")).toBe(false);
    expect(isProFeaturePath("/saves/abc123/players")).toBe(false);
    expect(isProFeaturePath("/saves/abc123/transfers")).toBe(false);
    expect(isProFeaturePath("/saves/abc123/trophies")).toBe(false);
    expect(isProFeaturePath("/saves/abc123/team-stats")).toBe(false);
    expect(isProFeaturePath("/saves/deleted")).toBe(false);
  });
});
