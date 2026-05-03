import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlanRoute, ProtectedRoute, PublicOnlyRoute } from "@/components/AuthGuards";
import { PRO_FEATURE_PLANS } from "@/utils/plans";
import Landing from "./pages/Landing.tsx";
import Pricing from "./pages/Pricing.tsx";
import Index from "./pages/Index.tsx";
import HubLayout from "./pages/HubLayout.tsx";
import Dashboard from "./pages/hub/Dashboard.tsx";
import Squad from "./pages/hub/Squad.tsx";
import Stats from "./pages/hub/Stats.tsx";
import History from "./pages/hub/History.tsx";
import Transfers from "./pages/hub/Transfers.tsx";
import ChangeClub from "./pages/hub/ChangeClub.tsx";
import Field from "./pages/hub/Field.tsx";
import Scout from "./pages/hub/Scout.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Unauthorized from "./pages/Unauthorized.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
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
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
