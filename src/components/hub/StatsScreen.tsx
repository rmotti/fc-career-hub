import { useState } from "react";
import { Target, ShieldAlert, ShieldCheck, Pencil, Loader2, Trophy, Minus, X, CheckCircle } from "lucide-react";
import StatCard from "./StatCard";
import StatsModal from "@/components/modals/StatsModal";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeamStats, useUpdateTeamStats } from "@/hooks/useTeamStats";
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
  const displayStats = teamStats ?? {
    wins: 0, draws: 0, losses: 0, goalsPro: 0, goalsAgainst: 0, leaguePosition: 1, europeanCupResult: "NaoParticipou", nationalCupResult: "NaoParticipou"
  };

  const topScorers = [...squad].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.goals ?? 0) - ((a.currentSeasonStats || a.totalStats)?.goals ?? 0)).slice(0, 5);
  const topAssists = [...squad].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.assists ?? 0) - ((a.currentSeasonStats || a.totalStats)?.assists ?? 0)).slice(0, 5);
  const CLEAN_SHEETS_POSITIONS = new Set(["GOL", "ZAG", "LD", "LE", "VOL"]);
  const topCleanSheets = [...squad]
    .filter((p) => CLEAN_SHEETS_POSITIONS.has(p.position))
    .sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.cleanSheets ?? 0) - ((a.currentSeasonStats || a.totalStats)?.cleanSheets ?? 0))
    .slice(0, 5);
  const topMatches = [...squad].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.matches ?? 0) - ((a.currentSeasonStats || a.totalStats)?.matches ?? 0)).slice(0, 5);
  const topContributions = [...squad].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.goalContributions ?? 0) - ((a.currentSeasonStats || a.totalStats)?.goalContributions ?? 0)).slice(0, 5);

  const handleUpdateStats = async (stats: any) => {
    if (!teamStats) {
      toast.error("Nenhuma estatística ativa encontrada para editar.");
      return;
    }
    await updateTeamStats.mutateAsync({
      saveId,
      statsId: teamStats.id,
      data: stats,
    });
    toast.success("Estatísticas atualizadas!", { duration: 3000 });
    setStatsModalOpen(false);
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setStatsModalOpen(true);
            }}
            className="btn-gamer-secondary px-3 py-1.5 text-sm flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">Editar</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Vitórias" value={displayStats.wins} icon={CheckCircle} />
          <StatCard label="Empates" value={displayStats.draws} icon={Minus} />
          <StatCard label="Derrotas" value={displayStats.losses} icon={X} accent />
          <StatCard label="Gols Pró" value={displayStats.goalsPro} icon={Target} />
          <StatCard label="Gols Contra" value={displayStats.goalsAgainst} icon={ShieldAlert} accent />
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
            <ShieldCheck size={16} className="text-accent" /> Clean Sheets
          </h3>
          <div className="space-y-3">
            {topCleanSheets.map((p, i) => (
              <div key={p.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-sm">{p.name}</span>
                </div>
                <span className="font-display font-bold text-accent">{(p.currentSeasonStats || p.totalStats)?.cleanSheets ?? 0}</span>
              </div>
            ))}
            {topCleanSheets.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
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

      <StatsModal
        open={statsModalOpen}
        onOpenChange={setStatsModalOpen}
        stats={{
          goalsPro:           displayStats.goalsPro,
          goalsAgainst:       displayStats.goalsAgainst,
          wins:               displayStats.wins,
          draws:              displayStats.draws,
          losses:             displayStats.losses,
          leaguePosition:     displayStats.leaguePosition ?? "",
          europeanCupResult:  displayStats.europeanCupResult ?? "NaoParticipou",
          nationalCupResult:  displayStats.nationalCupResult ?? "NaoParticipou",
        }}
        onSave={handleUpdateStats}
      />
    </div>
  );
};

export default StatsScreen;
