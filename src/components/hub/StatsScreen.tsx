import { useState } from "react";
import { Target, ShieldAlert, AlertTriangle, Pencil, Loader2, Trophy, Minus, X } from "lucide-react";
import StatCard from "./StatCard";
import StatsModal from "@/components/modals/StatsModal";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeamStats, useUpdateTeamStats } from "@/hooks/useTeamStats";
import { extractErrorMessage } from "@/services/api";
import { toast } from "sonner";

interface Props {
  saveId: string;
}

const StatsScreen = ({ saveId }: Props) => {
  const [modalOpen, setModalOpen] = useState(false);

  const { data: players = [] } = usePlayers(saveId, true);
  const { data: teamStatsArr = [], isLoading } = useTeamStats(saveId, "current");
  const updateTeamStats = useUpdateTeamStats();

  const teamStats = teamStatsArr[0];

  const topScorers = [...players].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.goals ?? 0) - ((a.currentSeasonStats || a.totalStats)?.goals ?? 0)).slice(0, 5);
  const topAssists = [...players].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.assists ?? 0) - ((a.currentSeasonStats || a.totalStats)?.assists ?? 0)).slice(0, 5);
  const topCards = [...players].sort((a, b) => {
    const statsA = a.currentSeasonStats || a.totalStats;
    const statsB = b.currentSeasonStats || b.totalStats;
    const cardA = (statsA?.yellowCards ?? 0) + (statsA?.redCards ?? 0) * 3;
    const cardB = (statsB?.yellowCards ?? 0) + (statsB?.redCards ?? 0) * 3;
    return cardB - cardA;
  }).slice(0, 5);
  const topMatches = [...players].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.matches ?? 0) - ((a.currentSeasonStats || a.totalStats)?.matches ?? 0)).slice(0, 5);
  const topContributions = [...players].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.goalContributions ?? 0) - ((a.currentSeasonStats || a.totalStats)?.goalContributions ?? 0)).slice(0, 5);

  const handleUpdateStats = async (stats: any) => {
    if (!teamStats) return;
    await updateTeamStats.mutateAsync({
      saveId,
      statsId: teamStats.id,
      data: stats,
    });
    toast.success("Estatísticas atualizadas!", { duration: 3000 });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" /> Carregando estatísticas...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-bold">Estatísticas da Temporada</h2>
        <button
          onClick={() => setModalOpen(true)}
          disabled={!teamStats}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Pencil size={16} /> Editar Stats
        </button>
      </div>

      {teamStats && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Vitórias" value={teamStats.wins} icon={Trophy} />
            <StatCard label="Empates" value={teamStats.draws} icon={Minus} />
            <StatCard label="Derrotas" value={teamStats.losses} icon={X} accent />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard label="Gols Pró" value={teamStats.goalsPro} icon={Target} />
            <StatCard label="Gols Contra" value={teamStats.goalsAgainst} icon={ShieldAlert} accent />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-gamer p-5">
          <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <Target size={16} className="text-primary" /> Artilheiros
          </h3>
          <div className="space-y-3">
            {topScorers.map((p, i) => (
              <div key={p.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-sm">{p.name}</span>
                </div>
                <span className="font-display font-bold text-primary">{(p.currentSeasonStats || p.totalStats)?.goals ?? 0}</span>
              </div>
            ))}
            {topScorers.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
          </div>
        </div>

        <div className="card-gamer p-5">
          <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <Target size={16} className="text-accent" /> Assistentes
          </h3>
          <div className="space-y-3">
            {topAssists.map((p, i) => (
              <div key={p.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-sm">{p.name}</span>
                </div>
                <span className="font-display font-bold text-accent">{(p.currentSeasonStats || p.totalStats)?.assists ?? 0}</span>
              </div>
            ))}
            {topAssists.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
          </div>
        </div>

        <div className="card-gamer p-5">
          <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-warning" /> Cartões
          </h3>
          <div className="space-y-3">
            {topCards.map((p, i) => (
              <div key={p.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-sm">{p.name}</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-warning font-bold">{(p.currentSeasonStats || p.totalStats)?.yellowCards ?? 0}🟨</span>
                  {((p.currentSeasonStats || p.totalStats)?.redCards ?? 0) > 0 && <span className="text-destructive font-bold">{(p.currentSeasonStats || p.totalStats)?.redCards}🟥</span>}
                </div>
              </div>
            ))}
            {topCards.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-gamer p-5">
          <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <Target size={16} className="text-primary" /> Mais Partidas
          </h3>
          <div className="space-y-3">
            {topMatches.map((p, i) => (
              <div key={p.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-sm">{p.name}</span>
                </div>
                <span className="font-display font-bold text-primary">{(p.currentSeasonStats || p.totalStats)?.matches ?? 0}</span>
              </div>
            ))}
            {topMatches.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
          </div>
        </div>

        <div className="card-gamer p-5">
          <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <Target size={16} className="text-accent" /> Part. em Gols
          </h3>
          <div className="space-y-3">
            {topContributions.map((p, i) => (
              <div key={p.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-sm">{p.name}</span>
                </div>
                <span className="font-display font-bold text-accent">{(p.currentSeasonStats || p.totalStats)?.goalContributions ?? 0}</span>
              </div>
            ))}
            {topContributions.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
          </div>
        </div>
      </div>

      {teamStats && (
        <StatsModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          stats={{
            goalsPro: teamStats.goalsPro,
            goalsAgainst: teamStats.goalsAgainst,
            wins: teamStats.wins,
            draws: teamStats.draws,
            losses: teamStats.losses,
            leaguePosition: teamStats.leaguePosition ?? 1,
            europeanCupResult: teamStats.europeanCupResult ?? "NaoParticipou",
            nationalCupResult: teamStats.nationalCupResult ?? "NaoParticipou",
          }}
          onSave={handleUpdateStats}
        />
      )}
    </div>
  );
};

export default StatsScreen;
