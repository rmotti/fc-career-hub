import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import HubLayout from "./pages/HubLayout.tsx";
import Dashboard from "./pages/hub/Dashboard.tsx";
import Squad from "./pages/hub/Squad.tsx";
import Stats from "./pages/hub/Stats.tsx";
import History from "./pages/hub/History.tsx";
import Transfers from "./pages/hub/Transfers.tsx";
import ChangeClub from "./pages/hub/ChangeClub.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route element={<HubLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/squad" element={<Squad />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/history" element={<History />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/change-club" element={<ChangeClub />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
