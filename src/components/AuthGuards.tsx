import { Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import type { UserPlan } from "@/services/api";

function FullScreenLoader({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground animate-pulse font-display text-lg">{message}</div>
    </div>
  );
}

export function ProtectedRoute() {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenLoader message="Validando sessão..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/unauthorized" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <FullScreenLoader message="Carregando..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

export function PlanRoute({ allowedPlans, redirectTo = "/pricing" }: { allowedPlans: UserPlan[]; redirectTo?: string }) {
  const { isLoading, user } = useAuth();
  const location = useLocation();
  const parentOutletContext = useOutletContext();

  if (isLoading) {
    return <FullScreenLoader message="Validando plano..." />;
  }

  if (!user || !allowedPlans.includes(user.plan)) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  return <Outlet context={parentOutletContext} />;
}
