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

  it("persiste e recupera o token da sessão", () => {
    setStoredToken("token-123");

    expect(getStoredToken()).toBe("token-123");
  });

  it("persiste e recupera o usuário autenticado", () => {
    const user = {
      id: "user-1",
      name: "Rodrigo",
      plan: "FREE",
    };

    setStoredUser(user);

    expect(getStoredUser<typeof user>()).toEqual(user);
  });

  it("remove snapshot inválido de usuário do storage", () => {
    window.localStorage.setItem("session_user", "{invalid-json");

    expect(getStoredUser()).toBeNull();
    expect(window.localStorage.getItem("session_user")).toBeNull();
  });

  it("limpa token e usuário armazenados", () => {
    setStoredToken("token-123");
    setStoredUser({ id: "user-1" });

    clearStoredToken();
    clearStoredUser();

    expect(getStoredToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });
});
