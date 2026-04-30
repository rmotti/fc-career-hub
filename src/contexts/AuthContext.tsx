import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi, registerUnauthorizedHandler, type ApiSession, type ApiUser } from "@/services/api";
import {
  clearStoredActiveSaveId,
  clearStoredToken,
  clearStoredUser,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from "@/lib/auth-storage";
import { AuthContext, type AuthContextValue } from "@/contexts/auth-context-core";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [session, setSession] = useState<ApiSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
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

    clearStoredToken();
    clearStoredUser();
    if (userId) {
      clearStoredActiveSaveId(userId);
    }

    setUser(null);
    setSession(null);
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  const hydrateSession = useCallback(async () => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser<ApiUser>();

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    if (storedUser) {
      setUser(storedUser);
      setIsLoading(false);
      return;
    }

    try {
      const currentSession = await authApi.getSession();

      if (!currentSession) {
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
    setStoredToken(authResponse.token);
    setStoredUser(authResponse.user);
    setToken(authResponse.token);
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
    setStoredToken(authResponse.token);
    setStoredUser(authResponse.user);
    setToken(authResponse.token);
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
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    signIn,
    signUp,
    signOut,
    clearSession,
  }), [clearSession, isLoading, session, signIn, signOut, signUp, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
