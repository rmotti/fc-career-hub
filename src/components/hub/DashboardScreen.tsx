import { Swords, Target, DollarSign, Trophy, TrendingUp, Loader2 } from "lucide-react";
import StatCard from "./StatCard";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeamStats } from "@/hooks/useTeamStats";
import { useTrophies } from "@/hooks/useTrophies";
import { useSave } from "@/hooks/useSaves";

interface Props {
  saveId: string;
  currentClub: string;
}

const DashboardScreen = ({ saveId, currentClub }: Props) => {
  const { data: save } = useSave(saveId);
  const { data: players = [], isLoading: playersLoading } = usePlayers(saveId, true);
  const { data: teamStatsArr = [] } = useTeamStats(saveId, "current");
  const { data: trophies = [] } = useTrophies(saveId);

  const teamStats = teamStatsArr[0];

  const topScorer = players.length > 0
    ? [...players].sort((a, b) => (b.seasonStats?.goals ?? 0) - (a.seasonStats?.goals ?? 0))[0]
    : null;

  if (!save) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Visão Geral</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Saldo" value={save.balance || "—"} icon={DollarSign} accent />
        <StatCard label="Orçamento" value={save.budget || "—"} icon={DollarSign} />
        <StatCard
          label="Artilheiro"
          value={topScorer && topScorer.seasonStats?.goals ? `${topScorer.name} (${topScorer.seasonStats.goals})` : "—"}
          icon={Target}
        />
        <StatCard label="Troféus" value={trophies.length} icon={Trophy} />
      </div>

      {/* Season record */}
      {teamStats && (
        <div className="card-gamer p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Temporada Atual</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-display font-bold text-primary">{teamStats.wins}</p>
              <p className="text-xs text-muted-foreground uppercase mt-1">Vitórias</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-warning">{teamStats.draws}</p>
              <p className="text-xs text-muted-foreground uppercase mt-1">Empates</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-destructive">{teamStats.losses}</p>
              <p className="text-xs text-muted-foreground uppercase mt-1">Derrotas</p>
            </div>
          </div>
        </div>
      )}

      {/* Top 5 scorers */}
      <div className="card-gamer p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Top Artilheiros</h3>
        {playersLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 size={14} className="animate-spin" /> Carregando...
          </div>
        ) : players.length > 0 ? (
          <div className="space-y-3">
            {[...players]
              .sort((a, b) => (b.seasonStats?.goals ?? 0) - (a.seasonStats?.goals ?? 0))
              .slice(0, 5)
              .map((p, i) => (
                <div key={p._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}>{i + 1}</span>
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.position}</span>
                  </div>
                  <span className="font-display font-bold text-primary">{p.seasonStats?.goals ?? 0}</span>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum jogador no elenco.</p>
        )}
      </div>
    </div>
  );
};

export default DashboardScreen;
