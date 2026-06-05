import { createContext, useContext } from "react";
import type { ApiSession, ApiUser } from "@/shared/api/client";

export type AuthContextValue = {
  user: ApiUser | null;
  session: ApiSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (data: { email: string; password: string }) => Promise<void>;
  signUp: (data: { name: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  clearSession: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
