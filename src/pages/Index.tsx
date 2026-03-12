import { useState } from "react";
import { mockSaves, type SaveData, type Player, type Transfer } from "@/data/mockData";
import SaveSelect from "@/components/SaveSelect";
import HubSidebar, { type HubScreen } from "@/components/hub/HubSidebar";
import HubHeader from "@/components/hub/HubHeader";
import DashboardScreen from "@/components/hub/DashboardScreen";
import SquadScreen from "@/components/hub/SquadScreen";
import StatsScreen from "@/components/hub/StatsScreen";
import HistoryScreen from "@/components/hub/HistoryScreen";
import TransfersScreen from "@/components/hub/TransfersScreen";
import ChangeClubScreen from "@/components/hub/ChangeClubScreen";

const Index = () => {
  const [saves, setSaves] = useState<SaveData[]>(mockSaves);
  const [activeSave, setActiveSave] = useState<SaveData | null>(null);
  const [screen, setScreen] = useState<HubScreen>("dashboard");

  const updateActiveSave = (updated: SaveData) => {
    setActiveSave(updated);
    setSaves((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleSelectSave = (save: SaveData) => {
    setActiveSave(save);
    setScreen("dashboard");
  };

  const handleCreateSave = (name: string, club: string) => {
    const newSave: SaveData = {
      id: `save-${Date.now()}`,
      name,
      currentClub: club,
      year: 2026,
      season: "2026/27",
      clubHistory: [{ club, years: "2026-", matches: 0, wins: 0, draws: 0, losses: 0 }],
      players: [],
      transfers: [],
      trophies: [],
      budget: "€30M",
      leaguePosition: 0,
      nextOpponent: "TBD",
      nextMatchDate: "—",
      teamStats: { goalsPro: 0, goalsAgainst: 0, possession: 0, wins: 0, draws: 0, losses: 0 },
      balance: "€30M",
    };
    setSaves((prev) => [...prev, newSave]);
    setActiveSave(newSave);
    setScreen("dashboard");
  };

  const handleChangeClub = (club: string) => {
    if (!activeSave) return;
    const updated: SaveData = {
      ...activeSave,
      currentClub: club,
      clubHistory: [
        ...activeSave.clubHistory,
        { club, years: `${activeSave.year}-`, matches: 0, wins: 0, draws: 0, losses: 0 },
      ],
      players: [],
      budget: "€20M",
      balance: "€20M",
      leaguePosition: 0,
      nextOpponent: "TBD",
      nextMatchDate: "—",
      teamStats: { goalsPro: 0, goalsAgainst: 0, possession: 0, wins: 0, draws: 0, losses: 0 },
    };
    updateActiveSave(updated);
    setScreen("dashboard");
  };

  const handleUpdatePlayers = (players: Player[]) => {
    if (!activeSave) return;
    updateActiveSave({ ...activeSave, players });
  };

  const handleUpdateStats = (teamStats: SaveData["teamStats"]) => {
    if (!activeSave) return;
    updateActiveSave({ ...activeSave, teamStats });
  };

  const handleUpdateTransfers = (transfers: Transfer[]) => {
    if (!activeSave) return;
    updateActiveSave({ ...activeSave, transfers });
  };

  if (!activeSave) {
    return <SaveSelect saves={saves} onSelectSave={handleSelectSave} onCreateSave={handleCreateSave} />;
  }

  const renderScreen = () => {
    switch (screen) {
      case "dashboard": return <DashboardScreen save={activeSave} />;
      case "squad": return <SquadScreen players={activeSave.players} onUpdatePlayers={handleUpdatePlayers} />;
      case "stats": return <StatsScreen save={activeSave} onUpdateStats={handleUpdateStats} />;
      case "history": return <HistoryScreen save={activeSave} />;
      case "transfers": return <TransfersScreen save={activeSave} onUpdateTransfers={handleUpdateTransfers} />;
      case "changeClub": return <ChangeClubScreen currentClub={activeSave.currentClub} onChangeClub={handleChangeClub} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <HubSidebar active={screen} onNavigate={setScreen} onExitSave={() => setActiveSave(null)} />
      <div className="flex-1 flex flex-col min-w-0">
        <HubHeader saveName={activeSave.name} clubName={activeSave.currentClub} season={activeSave.season} />
        <main className="flex-1 p-6 overflow-y-auto">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
};

export default Index;
