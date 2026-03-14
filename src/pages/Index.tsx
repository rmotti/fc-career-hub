import { useState } from "react";
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
import type { ApiSave } from "@/services/api";

const Index = () => {
  const [activeSaveId, setActiveSaveId] = useState<string | null>(null);
  const [screen, setScreen] = useState<HubScreen>("dashboard");
  const [showNewSeasonModal, setShowNewSeasonModal] = useState(false);

  const { data: saves = [], isLoading: savesLoading } = useSaves();
  const { data: activeSave } = useSave(activeSaveId);
  const createSave = useCreateSave();
  const updateSave = useUpdateSave();

  const handleSelectSave = (save: ApiSave) => {
    setActiveSaveId(save._id);
    setScreen("dashboard");
  };

  const handleCreateSave = (name: string, club: string) => {
    createSave.mutate({ name, club }, {
      onSuccess: (newSave) => {
        setActiveSaveId(newSave._id);
        setScreen("dashboard");
        toast.success("Save criado com sucesso!");
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleNewSeason = () => {
    if (!activeSave) return;
    const newYear = activeSave.currentYear + 1;
    const newSeason = `${newYear}/${(newYear + 1).toString().slice(-2)}`;
    updateSave.mutate(
      { saveId: activeSave._id, data: { currentYear: newYear, currentSeason: newSeason } },
      {
        onSuccess: () => {
          setScreen("dashboard");
          toast.success(`Nova temporada ${newSeason} iniciada!`);
        },
        onError: (err) => toast.error(err.message),
      }
    );
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
        return <DashboardScreen saveId={activeSave._id} currentClub={currentClub} />;
      case "squad":
        return <SquadScreen saveId={activeSave._id} />;
      case "stats":
        return <StatsScreen saveId={activeSave._id} />;
      case "history":
        return <HistoryScreen saveId={activeSave._id} />;
      case "transfers":
        return <TransfersScreen saveId={activeSave._id} currentClub={currentClub} currentSeason={activeSave.currentSeason} />;
      case "changeClub":
        return <ChangeClubScreen saveId={activeSave._id} currentClub={currentClub} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <HubSidebar active={screen} onNavigate={setScreen} onNewSeason={() => setShowNewSeasonModal(true)} onExitSave={() => setActiveSaveId(null)} />
      <div className="flex-1 flex flex-col min-w-0">
        <HubHeader saveName={activeSave.name} clubName={currentClub} season={activeSave.currentSeason} />
        <main className="flex-1 p-6 overflow-y-auto">
          {renderScreen()}
        </main>
      </div>
      <NewSeasonModal
        open={showNewSeasonModal}
        onOpenChange={setShowNewSeasonModal}
        saveId={activeSave._id}
        currentSeason={activeSave.currentSeason}
        currentClub={currentClub}
        onConfirm={handleNewSeason}
      />
    </div>
  );
};

export default Index;
