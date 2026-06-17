import { ApiError, request } from "../http";

export type UserRole = "ADMIN" | "USER";
export type UserPlan = "FREE" | "PRO" | "PREMIUM";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: UserRole;
  plan: UserPlan;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSession {
  id: string;
  expiresAt: string;
  userId: string;
}

export interface AuthSuccessResponse {
  csrfToken: string;
  user: ApiUser;
}

export interface SessionResponse {
  session: ApiSession;
  user: ApiUser;
}

export const authApi = {
  signUp: (data: { name: string; email: string; password: string; plan?: UserPlan }) =>
    request<AuthSuccessResponse>("/auth/sign-up/email", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  signIn: (data: { email: string; password: string }) =>
    request<AuthSuccessResponse>("/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getSession: async (): Promise<SessionResponse | null> => {
    try {
      return await request<SessionResponse>("/auth/session");
    } catch (err) {
      // Unauthenticated now returns 401 (previously `{}` with 200). Treat that as
      // "signed out" rather than letting the error bubble up.
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  },
  signOut: () =>
    request<{ success: true }>("/auth/sign-out", {
      method: "POST",
    }),
};
