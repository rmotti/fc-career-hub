import type { UserPlan, UserRole } from "@/shared/api/client";

// Plans that unlock PRO-tier features. The only remaining PRO-gated feature is
// the chatbot (/api/chat) — every scout feature is now free for any signed-in
// user. Kept as a list so it stays easy to extend if a plan tier is added.
export const PRO_FEATURE_PLANS: UserPlan[] = ["PRO", "PREMIUM"];

// Admins always pass any plan gate, regardless of their plan. Role comes from
// the API as "ADMIN" | "USER"; compare case-insensitively to be safe.
export function isAdminRole(role: UserRole | string | null | undefined) {
  return typeof role === "string" && role.toLowerCase() === "admin";
}

// Gate for the chatbot (the only PRO-only feature). Accepts the plan and role
// so admins bypass the plan requirement.
export function canAccessChat(
  plan: UserPlan | string | null | undefined,
  role?: UserRole | string | null,
) {
  if (isAdminRole(role)) return true;
  return plan === "PRO" || plan === "PREMIUM";
}
