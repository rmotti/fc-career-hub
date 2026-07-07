import { describe, it, expect } from "vitest";
import { isProFeaturePath } from "@/shared/api/client";

describe("isProFeaturePath", () => {
  it("gates only the chatbot (/chat) — the sole remaining PRO feature", () => {
    expect(isProFeaturePath("/chat")).toBe(true);
    expect(isProFeaturePath("/chat/messages")).toBe(true);
    expect(isProFeaturePath("/chat?saveId=1")).toBe(true);
  });

  it("does NOT gate scout features — they are free for any signed-in user", () => {
    expect(isProFeaturePath("/fc26-players")).toBe(false);
    expect(isProFeaturePath("/fc26-players/filters")).toBe(false);
    expect(isProFeaturePath("/scout/playbooks?saveId=1")).toBe(false);
    expect(isProFeaturePath("/scout/evaluate")).toBe(false);
    expect(isProFeaturePath("/scouting")).toBe(false);
    expect(isProFeaturePath("/scouting/transfer-targets")).toBe(false);
    expect(isProFeaturePath("/saves/abc123/shortlist")).toBe(false);
    expect(isProFeaturePath("/saves/abc123/saved-searches?q=1")).toBe(false);
  });

  it("does NOT gate the rest of the /saves tree", () => {
    expect(isProFeaturePath("/saves")).toBe(false);
    expect(isProFeaturePath("/saves/abc123")).toBe(false);
    expect(isProFeaturePath("/saves/abc123/players")).toBe(false);
    expect(isProFeaturePath("/saves/abc123/transfers")).toBe(false);
  });
});
