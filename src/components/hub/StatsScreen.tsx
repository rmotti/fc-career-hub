import { useState } from "react";
import { Target, ShieldAlert, Circle, AlertTriangle, Pencil, Loader2 } from "lucide-react";
import StatCard from "./StatCard";
import StatsModal from "@/components/modals/StatsModal";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeamStats, useUpdateTeamStats } from "@/hooks/useTeamStats";
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

  const topScorers = [...players].sort((a, b) => (b.seasonStats?.goals ?? 0) - (a.seasonStats?.goals ?? 0)).slice(0, 5);
  const topAssists = [...players].sort((a, b) => (b.seasonStats?.assists ?? 0) - (a.seasonStats?.assists ?? 0)).slice(0, 5);
  const topCards = [...players].sort((a, b) => {
    const cardA = (a.seasonStats?.yellowCards ?? 0) + (a.seasonStats?.redCards ?? 0) * 3;
    const cardB = (b.seasonStats?.yellowCards ?? 0) + (b.seasonStats?.redCards ?? 0) * 3;
    return cardB - cardA;
  }).slice(0, 5);

  const handleUpdateStats = (stats: { goalsPro: number; goalsAgainst: number; possession: number; wins: number; draws: number; losses: number }) => {
    if (!teamStats) return;
    updateTeamStats.mutate({
      saveId,
      statsId: teamStats._id,
      data: stats,
    }, {
      onSuccess: () => toast.success("Estatísticas atualizadas!"),
      onError: (err) => toast.error(err.message),
    });
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
      <div className="flex items-center justify-between">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Gols Pró" value={teamStats.goalsPro} icon={Target} />
          <StatCard label="Gols Contra" value={teamStats.goalsAgainst} icon={ShieldAlert} accent />
          <StatCard label="Posse de Bola" value={`${teamStats.possession}%`} icon={Circle} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-gamer p-5">
          <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <Target size={16} className="text-primary" /> Artilheiros
          </h3>
          <div className="space-y-3">
            {topScorers.map((p, i) => (
              <div key={p._id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-sm">{p.name}</span>
                </div>
                <span className="font-display font-bold text-primary">{p.seasonStats?.goals ?? 0}</span>
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
              <div key={p._id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-sm">{p.name}</span>
                </div>
                <span className="font-display font-bold text-accent">{p.seasonStats?.assists ?? 0}</span>
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
              <div key={p._id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-sm">{p.name}</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="text-warning font-bold">{p.seasonStats?.yellowCards ?? 0}🟨</span>
                  {(p.seasonStats?.redCards ?? 0) > 0 && <span className="text-destructive font-bold">{p.seasonStats?.redCards}🟥</span>}
                </div>
              </div>
            ))}
            {topCards.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
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
            possession: teamStats.possession,
            wins: teamStats.wins,
            draws: teamStats.draws,
            losses: teamStats.losses,
          }}
          onSave={handleUpdateStats}
        />
      )}
    </div>
  );
};

export default StatsScreen;
