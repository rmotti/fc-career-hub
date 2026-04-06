import { useState, useEffect } from "react";
import { Outlet, useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import HubSidebar from "@/components/hub/HubSidebar";
import HubHeader from "@/components/hub/HubHeader";
import NewSeasonModal from "@/components/modals/NewSeasonModal";
import { useSave, useUpdateSave } from "@/hooks/useSaves";
import { extractErrorMessage } from "@/services/api";

export type HubOutletContext = {
  saveId: string;
  currentClub: string;
  selectedSeason: string;
  currentSeason: string;
};

const HubLayout = () => {
  const activeSaveId = localStorage.getItem("active-save-id");
  const [showNewSeasonModal, setShowNewSeasonModal] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const { data: activeSave } = useSave(activeSaveId);
  const updateSave = useUpdateSave();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeSave?.currentSeason) {
      setSelectedSeason(activeSave.currentSeason);
    }
  }, [activeSave?.currentSeason]);

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
    localStorage.removeItem("active-save-id");
    navigate("/");
  };

  const currentClub = activeSave.currentClubStint?.club ?? "—";
  const resolvedSeason = selectedSeason || activeSave.currentSeason;

  return (
    <div className="flex min-h-screen w-full relative">
      <HubSidebar
        onNewSeason={() => setShowNewSeasonModal(true)}
        onExitSave={handleExitSave}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <div className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ${collapsed ? "md:ml-16" : "md:ml-60"}`}>
        <HubHeader
          saveName={activeSave.name}
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
