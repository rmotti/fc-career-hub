import { type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/features/auth/model/AuthContext";
import { useAuth } from "@/features/auth/model/auth-context-core";
import { createTestQueryClient } from "@/test/test-utils";

// Capture the handler registered with the API client so we can simulate a 401.
const { authApiMock, registerMock, handlerRef } = vi.hoisted(() => {
  const handlerRef = { current: null as null | (() => void) };
  return {
    handlerRef,
    authApiMock: {
      getSession: vi.fn(),
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    registerMock: vi.fn((handler: (() => void) | null) => {
      handlerRef.current = handler;
    }),
  };
});

vi.mock("@/shared/api/client", () => ({
  authApi: authApiMock,
  registerUnauthorizedHandler: registerMock,
}));

const TOKEN_KEY = "session_token";
const USER_KEY = "session_user";

const fakeUser = {
  id: "user-1",
  name: "Ana",
  email: "ana@example.com",
  emailVerified: true,
  image: null,
  role: "USER",
  plan: "FREE",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const fakeSession = { id: "session-1", expiresAt: "2026-12-31T00:00:00.000Z", userId: "user-1" };

function renderAuth() {
  const client = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
  return { client, ...renderHook(() => useAuth(), { wrapper }) };
}

beforeEach(() => {
  localStorage.clear();
  handlerRef.current = null;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("AuthProvider — session hydration", () => {
  it("stays unauthenticated and skips getSession when no token is stored", async () => {
    const { result } = renderAuth();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(authApiMock.getSession).not.toHaveBeenCalled();
  });

  it("hydrates straight from storage (no getSession) when token + user exist", async () => {
    localStorage.setItem(TOKEN_KEY, "tok");
    localStorage.setItem(USER_KEY, JSON.stringify(fakeUser));

    const { result } = renderAuth();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe("ana@example.com");
    expect(authApiMock.getSession).not.toHaveBeenCalled();
  });

  it("fetches the session when a token exists but no user is cached", async () => {
    localStorage.setItem(TOKEN_KEY, "tok");
    authApiMock.getSession.mockResolvedValue({ user: fakeUser, session: fakeSession });

    const { result } = renderAuth();

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(authApiMock.getSession).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(USER_KEY)).toContain("ana@example.com");
  });

  it("clears the session when getSession rejects", async () => {
    localStorage.setItem(TOKEN_KEY, "tok");
    authApiMock.getSession.mockRejectedValue(new Error("unauthorized"));

    const { result } = renderAuth();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe("AuthProvider — 401 sign-out", () => {
  it("clears auth state and storage when the unauthorized handler fires", async () => {
    localStorage.setItem(TOKEN_KEY, "tok");
    localStorage.setItem(USER_KEY, JSON.stringify(fakeUser));

    const { result } = renderAuth();
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    expect(registerMock).toHaveBeenCalled();
    expect(handlerRef.current).toBeTypeOf("function");

    act(() => {
      handlerRef.current?.();
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });
});
