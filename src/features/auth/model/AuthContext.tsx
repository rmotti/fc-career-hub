import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  clearCsrfToken,
  registerUnauthorizedHandler,
  setCsrfToken,
  type ApiSession,
  type ApiUser,
} from "@/shared/api/client";
import {
  clearStoredActiveSaveId,
  clearStoredUser,
  getStoredUser,
  purgeLegacySessionToken,
  setStoredUser,
} from "@/features/auth/lib/auth-storage";
import { AuthContext, type AuthContextValue } from "@/features/auth/model/auth-context-core";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [session, setSession] = useState<ApiSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef<ApiUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (user) {
      setStoredUser(user);
    }
  }, [user]);

  const clearSession = useCallback(() => {
    const userId = userRef.current?.id;

    clearStoredUser();
    clearCsrfToken();
    if (userId) {
      clearStoredActiveSaveId(userId);
    }

    setUser(null);
    setSession(null);
    queryClient.clear();
  }, [queryClient]);

  const hydrateSession = useCallback(async () => {
    purgeLegacySessionToken();
    const storedUser = getStoredUser<ApiUser>();

    // No cached user → treat as signed out. A bare session cookie without a
    // cached user is re-established on the next explicit sign-in.
    if (!storedUser) {
      setIsLoading(false);
      return;
    }

    // Optimistically show the cached user, then validate the cookie session.
    setUser(storedUser);

    try {
      const currentSession = await authApi.getSession();

      // The API answers an unauthenticated request with `{}` (HTTP 200), not
      // `null`/401 — so guard on the user, not on the object, otherwise an empty
      // body would slip through and clobber the cached user with `undefined`.
      if (!currentSession?.user) {
        clearSession();
        return;
      }

      setUser(currentSession.user);
      setSession(currentSession.session);
      setStoredUser(currentSession.user);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    registerUnauthorizedHandler(() => clearSession());
    void hydrateSession();

    return () => {
      registerUnauthorizedHandler(null);
    };
  }, [clearSession, hydrateSession]);

  const signIn = useCallback(async (data: { email: string; password: string }) => {
    const authResponse = await authApi.signIn(data);
    setCsrfToken(authResponse.csrfToken);
    setStoredUser(authResponse.user);
    setUser(authResponse.user);

    const currentSession = await authApi.getSession().catch(() => null);
    setSession(currentSession?.session ?? null);
    if (currentSession?.user) {
      setUser(currentSession.user);
      setStoredUser(currentSession.user);
    }
  }, []);

  const signUp = useCallback(async (data: { name: string; email: string; password: string }) => {
    const authResponse = await authApi.signUp({ ...data, plan: "FREE" });
    setCsrfToken(authResponse.csrfToken);
    setStoredUser(authResponse.user);
    setUser(authResponse.user);

    const currentSession = await authApi.getSession().catch(() => null);
    setSession(currentSession?.session ?? null);
    if (currentSession?.user) {
      setUser(currentSession.user);
      setStoredUser(currentSession.user);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.signOut();
    } catch {
      // Mesmo que o endpoint falhe, encerrar a sessão local completa o fluxo de logout.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    clearSession,
  }), [clearSession, isLoading, session, signIn, signOut, signUp, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
