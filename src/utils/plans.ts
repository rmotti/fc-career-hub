import type { UserPlan } from "@/services/api";

export const PRO_FEATURE_PLANS: UserPlan[] = ["PRO", "PREMIUM"];

export function canAccessProFeature(plan: UserPlan | string | null | undefined) {
  return plan === "PRO" || plan === "PREMIUM";
}
