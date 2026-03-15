import { useState, useMemo } from "react";
import { Target, ShieldAlert, AlertTriangle, Pencil, Loader2, Trophy, Minus, X, CheckCircle } from "lucide-react";
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
  const [statsModalOpen, setStatsModalOpen] = useState(false);

  const { data: squad = [], isLoading: isLoadingPlayers } = usePlayers(saveId, true);
  const { data: teamStatsData = [], isLoading: isLoadingTeamStats } = useTeamStats(saveId, "current");
  const updateTeamStats = useUpdateTeamStats();

  const teamStats = teamStatsData[0];

  const topScorers = [...squad].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.goals ?? 0) - ((a.currentSeasonStats || a.totalStats)?.goals ?? 0)).slice(0, 5);
  const topAssists = [...squad].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.assists ?? 0) - ((a.currentSeasonStats || a.totalStats)?.assists ?? 0)).slice(0, 5);
  const topCards = [...squad].sort((a, b) => {
    const statsA = a.currentSeasonStats || a.totalStats;
    const statsB = b.currentSeasonStats || b.totalStats;
    const cardA = (statsA?.yellowCards ?? 0) + (statsA?.redCards ?? 0) * 3;
    const cardB = (statsB?.yellowCards ?? 0) + (statsB?.redCards ?? 0) * 3;
    return cardB - cardA;
  }).slice(0, 5);
  const topMatches = [...squad].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.matches ?? 0) - ((a.currentSeasonStats || a.totalStats)?.matches ?? 0)).slice(0, 5);
  const topContributions = [...squad].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.goalContributions ?? 0) - ((a.currentSeasonStats || a.totalStats)?.goalContributions ?? 0)).slice(0, 5);

  const handleUpdateStats = async (stats: any) => {
    if (!teamStats) return;
    await updateTeamStats.mutateAsync({
      saveId,
      statsId: teamStats.id,
      data: stats,
    });
    toast.success("Estatísticas atualizadas!", { duration: 3000 });
  };

  if (isLoadingPlayers || isLoadingTeamStats) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" /> Carregando estatísticas...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">
            Estatísticas da Temporada
          </h1>
          <p className="text-muted-foreground mt-1">Estatísticas do time e destaques individuais</p>
        </div>
      </div>

      {/* Seção de Estatísticas do Time */}
      <div className="card-gamer p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 transition-transform duration-500 group-hover:scale-110" />
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Desempenho do Time
          </h2>
          <button
            onClick={() => setStatsModalOpen(true)}
            className="btn-gamer-secondary px-3 py-1.5 text-sm flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">Editar</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Vitórias" value={teamStats?.wins ?? 0} icon={CheckCircle} />
          <StatCard label="Empates" value={teamStats?.draws ?? 0} icon={Minus} />
          <StatCard label="Derrotas" value={teamStats?.losses ?? 0} icon={X} accent />
          <StatCard label="Gols Pró" value={teamStats?.goalsPro ?? 0} icon={Target} />
          <StatCard label="Gols Contra" value={teamStats?.goalsAgainst ?? 0} icon={ShieldAlert} accent />
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          open={statsModalOpen}
          onOpenChange={setStatsModalOpen}
          stats={{
            goalsPro: teamStats?.goalsPro ?? 0,
            goalsAgainst: teamStats?.goalsAgainst ?? 0,
            wins: teamStats?.wins ?? 0,
            draws: teamStats?.draws ?? 0,
            losses: teamStats?.losses ?? 0,
            leaguePosition: teamStats?.leaguePosition ?? 1,
            europeanCupResult: teamStats?.europeanCupResult ?? "NaoParticipou",
            nationalCupResult: teamStats?.nationalCupResult ?? "NaoParticipou",
          }}
          onSave={handleUpdateStats}
        />
      )}
    </div>
  );
};

export default StatsScreen;
