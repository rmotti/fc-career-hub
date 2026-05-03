import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute, PlanRoute } from "@/features/auth/ui/AuthGuards";
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
import ChangeClub from "@/pages/hub/ChangeClub";
import Field from "@/pages/hub/Field";
import Scout from "@/pages/hub/Scout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";

export function Router() {
  return (
    <BrowserRouter>
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
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/change-club" element={<ChangeClub />} />
            <Route path="/field" element={<Field />} />
            <Route element={<PlanRoute allowedPlans={PRO_FEATURE_PLANS} />}>
              <Route path="/scout" element={<Scout />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
