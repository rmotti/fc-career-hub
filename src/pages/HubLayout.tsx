import { useState, useEffect } from "react";
import { Outlet, useNavigate, Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import HubSidebar from "@/components/hub/HubSidebar";
import HubHeader from "@/components/hub/HubHeader";
import NewSeasonModal from "@/components/modals/NewSeasonModal";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSave, useUpdateSave } from "@/hooks/useSaves";
import { clearStoredActiveSaveId, getStoredActiveSaveId } from "@/lib/auth-storage";
import { extractErrorMessage, playersApi } from "@/services/api";

export type HubOutletContext = {
  saveId: string;
  currentClub: string;
  selectedSeason: string;
  currentSeason: string;
};

const HubLayout = () => {
  const { user, signOut } = useAuth();
  const activeSaveId = user ? getStoredActiveSaveId(user.id) : null;
  const [showNewSeasonModal, setShowNewSeasonModal] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const { data: activeSave, isError } = useSave(activeSaveId);
  const updateSave = useUpdateSave();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (activeSave?.currentSeason) {
      setSelectedSeason(activeSave.currentSeason);
    }
  }, [activeSave?.currentSeason]);

  useEffect(() => {
    if (user && isError && activeSaveId) {
      clearStoredActiveSaveId(user.id);
      navigate("/app", { replace: true });
      toast.error("Não foi possível abrir esse save. Escolha outro para continuar.", { duration: 5000 });
    }
  }, [activeSaveId, isError, navigate, user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!activeSaveId) {
    return <Navigate to="/app" replace />;
  }

  if (!activeSave) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse font-display text-lg">Carregando save...</div>
      </div>
    );
  }

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const handleNewSeason = async (budget: number, europeanCompetitionId: string | null): Promise<boolean> => {
    const currentYear = parseInt(String(activeSave.currentYear), 10);
    if (isNaN(currentYear)) {
      toast.error("Temporada atual inválida. Recarregue a página.", { duration: 5000 });
      return false;
    }
    const newYear = currentYear + 1;
    const newSeason = `${newYear}/${(newYear + 1).toString().slice(-2)}`;

    try {
      const allPlayers = await playersApi.list(activeSave.id);
      const loanedOut = allPlayers.filter(p => !p.isActive);
      if (loanedOut.length > 0) {
        await Promise.all(loanedOut.map(p => playersApi.update(activeSave.id, p.id, { isActive: true })));
        await queryClient.invalidateQueries({ queryKey: ["players", activeSave.id] });
      }

      await updateSave.mutateAsync({
        saveId: activeSave.id,
        data: { currentYear: newYear, currentSeason: newSeason, budget: String(budget), europeanCompetitionId },
      });
      navigate("/dashboard");
      toast.success("Nova temporada iniciada!", { duration: 3000 });
      return true;
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err), { duration: 5000 });
      return false;
    }
  };

  const handleExitSave = () => {
    clearStoredActiveSaveId(user.id);
    navigate("/app");
  };

  const handleSignOut = async () => {
    navigate("/", { replace: true });

    try {
      await signOut();
      toast.success("Sessão encerrada.");
    } catch {
      toast.error("Não foi possível encerrar a sessão.");
    }
  };

  const currentClub = activeSave.currentClubStint?.club ?? "—";
  const statsSeason = selectedSeason || activeSave.currentSeason;
  const isStatsRoute = location.pathname.startsWith("/stats");
  const outletSeason = isStatsRoute ? statsSeason : activeSave.currentSeason;

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      <HubSidebar
        userName={user.name}
        userPlan={user.plan}
        onNewSeason={() => setShowNewSeasonModal(true)}
        onExitSave={handleExitSave}
        onSignOut={handleSignOut}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HubHeader
          saveName={activeSave.name}
          clubName={currentClub}
          season={activeSave.currentSeason}
          availableSeasons={activeSave.availableSeasons}
          selectedSeason={statsSeason}
          onSeasonChange={setSelectedSeason}
          showSeasonSelector={isStatsRoute}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-6 w-full max-w-full">
          <Outlet
            context={{
              saveId: activeSave.id,
              currentClub,
              selectedSeason: outletSeason,
              currentSeason: activeSave.currentSeason,
            } satisfies HubOutletContext}
          />
        </main>
      </div>
      <NewSeasonModal
        open={showNewSeasonModal}
        onOpenChange={setShowNewSeasonModal}
        saveId={activeSave.id}
        currentSeason={activeSave.currentSeason}
        currentClub={currentClub}
        onConfirm={handleNewSeason}
      />
    </div>
  );
};

export default HubLayout;
