import { useState, useEffect } from "react";
import { Outlet, useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import HubSidebar from "@/components/hub/HubSidebar";
import HubHeader from "@/components/hub/HubHeader";
import NewSeasonModal from "@/components/modals/NewSeasonModal";
import { useAuth } from "@/contexts/AuthContext";
import { useSave, useUpdateSave } from "@/hooks/useSaves";
import { clearStoredActiveSaveId, getStoredActiveSaveId } from "@/lib/auth-storage";
import { extractErrorMessage } from "@/services/api";

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
  const navigate = useNavigate();

  useEffect(() => {
    if (activeSave?.currentSeason) {
      setSelectedSeason(activeSave.currentSeason);
    }
  }, [activeSave?.currentSeason]);

  useEffect(() => {
    if (user && isError && activeSaveId) {
      clearStoredActiveSaveId(user.id);
      navigate("/", { replace: true });
      toast.error("Não foi possível abrir esse save. Escolha outro para continuar.", { duration: 5000 });
    }
  }, [activeSaveId, isError, navigate, user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!activeSaveId) {
    return <Navigate to="/" replace />;
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

  const handleNewSeason = async (budget: number): Promise<boolean> => {
    const currentYear = parseInt(String(activeSave.currentYear), 10);
    if (isNaN(currentYear)) {
      toast.error("Temporada atual inválida. Recarregue a página.", { duration: 5000 });
      return false;
    }
    const newYear = currentYear + 1;
    const newSeason = `${newYear}/${(newYear + 1).toString().slice(-2)}`;

    try {
      await updateSave.mutateAsync({
        saveId: activeSave.id,
        data: { currentYear: newYear, currentSeason: newSeason, budget: String(budget) },
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
    navigate("/");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
    toast.success("Sessão encerrada.");
  };

  const currentClub = activeSave.currentClubStint?.club ?? "—";
  const resolvedSeason = selectedSeason || activeSave.currentSeason;

  return (
    <div className="flex min-h-screen w-full relative">
      <HubSidebar
        onNewSeason={() => setShowNewSeasonModal(true)}
        onExitSave={handleExitSave}
        onSignOut={handleSignOut}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <div className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ${collapsed ? "md:ml-16" : "md:ml-60"}`}>
        <HubHeader
          saveName={activeSave.name}
          userName={user.name}
          userPlan={user.plan}
          clubName={currentClub}
          season={activeSave.currentSeason}
          availableSeasons={activeSave.availableSeasons}
          selectedSeason={resolvedSeason}
          onSeasonChange={setSelectedSeason}
        />
        <main className="flex-1 p-6 overflow-y-auto w-full max-w-full">
          <Outlet
            context={{
              saveId: activeSave.id,
              currentClub,
              selectedSeason: resolvedSeason,
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
