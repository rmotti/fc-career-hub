import type { UserPlan } from "@/shared/api/client";

export const PRO_FEATURE_PLANS: UserPlan[] = ["PRO", "PREMIUM"];

export function canAccessProFeature(plan: UserPlan | string | null | undefined) {
  return plan === "PRO" || plan === "PREMIUM";
}
