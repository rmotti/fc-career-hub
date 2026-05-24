import { beforeEach, describe, expect, it } from "vitest";
import {
  clearStoredToken,
  clearStoredUser,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from "@/features/auth/lib/auth-storage";

describe("auth-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists and retrieves the session token", () => {
    setStoredToken("token-123");

    expect(getStoredToken()).toBe("token-123");
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

  it("clears stored token and user", () => {
    setStoredToken("token-123");
    setStoredUser({ id: "user-1" });

    clearStoredToken();
    clearStoredUser();

    expect(getStoredToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });
});
