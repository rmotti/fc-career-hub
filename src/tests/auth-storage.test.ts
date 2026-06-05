import { beforeEach, describe, expect, it } from "vitest";
import {
  clearStoredUser,
  getStoredUser,
  purgeLegacySessionToken,
  setStoredUser,
} from "@/features/auth/lib/auth-storage";

describe("auth-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists and retrieves the authenticated user", () => {
    const user = {
      id: "user-1",
      name: "Rodrigo",
      plan: "FREE",
    };

    setStoredUser(user);

    expect(getStoredUser<typeof user>()).toEqual(user);
  });

  it("removes invalid user snapshot from storage", () => {
    window.localStorage.setItem("session_user", "{invalid-json");

    expect(getStoredUser()).toBeNull();
    expect(window.localStorage.getItem("session_user")).toBeNull();
  });

  it("clears the stored user", () => {
    setStoredUser({ id: "user-1" });

    clearStoredUser();

    expect(getStoredUser()).toBeNull();
  });

  it("purges a legacy session token left over from before the cookie cutover", () => {
    window.localStorage.setItem("session_token", "legacy-token");

    purgeLegacySessionToken();

    expect(window.localStorage.getItem("session_token")).toBeNull();
  });
});
