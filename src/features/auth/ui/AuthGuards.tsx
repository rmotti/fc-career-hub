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
    return <Navigate to="/unauthorized" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { t } = useTranslation();
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <FullScreenLoader message={t("common.loading")} />;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
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
