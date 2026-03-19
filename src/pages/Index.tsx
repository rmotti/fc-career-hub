import { useState, useEffect } from "react";
import { toast } from "sonner";
import SaveSelect from "@/components/SaveSelect";
import HubSidebar, { type HubScreen } from "@/components/hub/HubSidebar";
import HubHeader from "@/components/hub/HubHeader";
import DashboardScreen from "@/components/hub/DashboardScreen";
import SquadScreen from "@/components/hub/SquadScreen";
import StatsScreen from "@/components/hub/StatsScreen";
import HistoryScreen from "@/components/hub/HistoryScreen";
import TransfersScreen from "@/components/hub/TransfersScreen";
import ChangeClubScreen from "@/components/hub/ChangeClubScreen";
import NewSeasonModal from "@/components/modals/NewSeasonModal";
import { useSaves, useSave, useCreateSave, useUpdateSave } from "@/hooks/useSaves";
import { type ApiSave, extractErrorMessage } from "@/services/api";

const Index = () => {
  const [activeSaveId, setActiveSaveId] = useState<string | null>(null);
  const [screen, setScreen] = useState<HubScreen>("dashboard");
  const [showNewSeasonModal, setShowNewSeasonModal] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  const { data: saves = [], isLoading: savesLoading } = useSaves();
  const { data: activeSave } = useSave(activeSaveId);

  useEffect(() => {
    if (activeSave?.currentSeason) {
      setSelectedSeason(activeSave.currentSeason);
    }
  }, [activeSave?.currentSeason]);
  const createSave = useCreateSave();
  const updateSave = useUpdateSave();

  const handleSelectSave = (save: ApiSave) => {
    setActiveSaveId(save.id);
    setScreen("dashboard");
  };

  const handleCreateSave = (name: string, club: string, budget: string) => {
    createSave.mutate({ name, club, budget }, {
      onSuccess: (newSave) => {
        setActiveSaveId(newSave.id);
        setScreen("dashboard");
        toast.success("Save criado com sucesso!", { duration: 3000 });
      },
      onError: (err) => toast.error(extractErrorMessage(err), { duration: 5000 }),
    });
  };

  const handleNewSeason = async (budget: number): Promise<boolean> => {
    if (!activeSave) return false;
    const currentYear = parseInt(String(activeSave.currentYear), 10);
    if (isNaN(currentYear)) {
      toast.error("Temporada atual inválida. Recarregue a página.", { duration: 5000 });
      return false;
    }
    const newYear = currentYear + 1;
    const newSeason = `${newYear}/${(newYear + 1).toString().slice(-2)}`;

    try {
      await updateSave.mutateAsync({ saveId: activeSave.id, data: { currentYear: newYear, currentSeason: newSeason, budget: String(budget) } });
      setScreen("dashboard");
      toast.success("Nova temporada iniciada!", { duration: 3000 });
      return true;
    } catch (err: any) {
      toast.error(extractErrorMessage(err), { duration: 5000 });
      return false;
    }
  };

  if (!activeSaveId) {
    return (
      <SaveSelect
        saves={saves}
        loading={savesLoading}
        onSelectSave={handleSelectSave}
        onCreateSave={handleCreateSave}
        creating={createSave.isPending}
      />
    );
  }

  if (!activeSave) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse font-display text-lg">Carregando save...</div>
      </div>
    );
  }

  const currentClub = activeSave.currentClubStint?.club ?? "—";

  const renderScreen = () => {
    switch (screen) {
      case "dashboard":
        return <DashboardScreen saveId={activeSave.id} currentClub={currentClub} />;
      case "squad":
        return <SquadScreen saveId={activeSave.id} selectedSeason={selectedSeason || activeSave.currentSeason} currentSeason={activeSave.currentSeason} />;
      case "stats":
        return <StatsScreen saveId={activeSave.id} selectedSeason={selectedSeason || activeSave.currentSeason} currentSeason={activeSave.currentSeason} />;
      case "history":
        return <HistoryScreen saveId={activeSave.id} />;
      case "transfers":
        return <TransfersScreen saveId={activeSave.id} currentClub={currentClub} currentSeason={activeSave.currentSeason} selectedSeason={selectedSeason || activeSave.currentSeason} />;
      case "changeClub":
        return <ChangeClubScreen saveId={activeSave.id} currentClub={currentClub} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full relative">
      <HubSidebar 
        active={screen} 
        onNavigate={setScreen} 
        onNewSeason={() => setShowNewSeasonModal(true)} 
        onExitSave={() => setActiveSaveId(null)} 
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <div className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ${collapsed ? "md:ml-16" : "md:ml-60"}`}>
        <HubHeader
          saveName={activeSave.name}
          clubName={currentClub}
          season={activeSave.currentSeason}
          availableSeasons={activeSave.availableSeasons}
          selectedSeason={selectedSeason || activeSave.currentSeason}
          onSeasonChange={setSelectedSeason}
        />
        <main className="flex-1 p-6 overflow-y-auto w-full max-w-full">
          {renderScreen()}
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

export default Index;
