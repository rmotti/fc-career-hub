import { Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/model/useAuth";
import type { UserPlan } from "@/shared/api/client";

function FullScreenLoader({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground animate-pulse font-display text-lg">{message}</div>
    </div>
  );
}

export function ProtectedRoute() {
  const { t } = useTranslation();
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenLoader message={t("auth.guards.loading")} />;
  }

  if (!isAuthenticated) {
    // An expired/absent session is "please sign in again", not "forbidden" — send
    // the user to login (carrying the attempted route so we can return there),
    // not to the 401 page.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { t } = useTranslation();
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  if (isLoading) {
    return <FullScreenLoader message={t("common.loading")} />;
  }

  if (isAuthenticated) {
    // Honor the route the user was bounced from (set by ProtectedRoute) so a
    // deep-link → login → back-to-deep-link round-trip lands where they meant to go.
    return <Navigate to={from ?? "/app"} replace />;
  }

  return <Outlet />;
}

export function PlanRoute({ allowedPlans, redirectTo = "/pricing" }: { allowedPlans: UserPlan[]; redirectTo?: string }) {
  const { t } = useTranslation();
  const { isLoading, user } = useAuth();
  const location = useLocation();
  const parentOutletContext = useOutletContext();

  if (isLoading) {
    return <FullScreenLoader message={t("auth.guards.loading")} />;
  }

  if (!user || !allowedPlans.includes(user.plan)) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  return <Outlet context={parentOutletContext} />;
}
