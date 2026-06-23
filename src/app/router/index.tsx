import { useEffect, useRef } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute, PlanRoute } from "@/features/auth/ui/AuthGuards";
import { registerForbiddenHandler } from "@/shared/api/client";
import { PRO_FEATURE_PLANS } from "@/shared/config/plans";
import Landing from "@/pages/Landing";
import Pricing from "@/pages/Pricing";
import Index from "@/pages/Index";
import HubLayout from "@/widgets/hub-layout/ui/HubLayout";
import Dashboard from "@/pages/hub/Dashboard";
import Squad from "@/pages/hub/Squad";
import Stats from "@/pages/hub/Stats";
import History from "@/pages/hub/History";
import Transfers from "@/pages/hub/Transfers";
import Activity from "@/pages/hub/Activity";
import ChangeClub from "@/pages/hub/ChangeClub";
import Field from "@/pages/hub/Field";
import Scout from "@/pages/hub/Scout";
import Playbooks from "@/pages/hub/Playbooks";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";

// Bridges API-layer 403s on PRO endpoints (registered in client.ts) to an
// in-app redirect to /pricing. The route guard (PlanRoute) only catches FREE
// users on the locally-cached plan; this covers a downgrade that happens
// mid-session, where the cached plan is still PRO but the API now says 403.
function ApiForbiddenBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    registerForbiddenHandler(() => {
      // Already on /pricing → nothing to do, and avoids any redirect loop.
      if (locationRef.current.pathname === "/pricing") return;
      navigate("/pricing", {
        replace: true,
        state: { from: locationRef.current.pathname, reason: "plan-required" },
      });
    });
    return () => registerForbiddenHandler(null);
  }, [navigate]);

  return null;
}

export function Router() {
  return (
    <BrowserRouter>
      <ApiForbiddenBridge />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<Index />} />
          <Route element={<HubLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/squad" element={<Squad />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/history" element={<History />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/change-club" element={<ChangeClub />} />
            <Route path="/field" element={<Field />} />
            <Route element={<PlanRoute allowedPlans={PRO_FEATURE_PLANS} />}>
              <Route path="/scout" element={<Navigate to="/scout/ia" replace />} />
              <Route path="/scout/ia" element={<Scout section="ai" />} />
              <Route path="/scout/filtros" element={<Scout section="filters" />} />
              <Route path="/scout/shortlist" element={<Scout section="shortlist" />} />
              <Route path="/scout/consultas" element={<Scout section="archive" />} />
              <Route path="/scout/dna" element={<Scout section="dna" />} />
              <Route path="/scout/playbooks" element={<Playbooks />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
