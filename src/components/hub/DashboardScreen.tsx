import { Swords, Target, DollarSign, Trophy, TrendingUp, Loader2, AlertTriangle } from "lucide-react";
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
    ? [...players].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.goals ?? 0) - ((a.currentSeasonStats || a.totalStats)?.goals ?? 0))[0]
    : null;

  if (!save) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const budgetNum = save.budget ?? 0;
  const balanceNum = save.balance ?? 0;
  const isLowBalance = budgetNum > 0 && balanceNum < budgetNum * 0.2;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold break-words text-wrap">Visão Geral</h2>
        <p className="text-muted-foreground">{save.name} - Temporada {save.currentSeason}</p>
      </div>

      {/* Financial overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-gamer p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
            <DollarSign size={20} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase">Orçamento</p>
            <p className="text-xl font-display font-bold text-foreground">{save.budgetFormatted ?? save.budget ?? "—"}</p>
          </div>
        </div>
        <div className={`card-gamer p-5 flex items-center gap-4 ${isLowBalance ? "border-destructive/40" : ""}`}>
          <div className={`w-10 h-10 rounded-md flex items-center justify-center ${isLowBalance ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
            {isLowBalance ? <AlertTriangle size={20} /> : <DollarSign size={20} />}
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase">Saldo disponível</p>
            <p className={`text-xl font-display font-bold ${isLowBalance ? "text-destructive" : "text-primary"}`}>
              {save.balanceFormatted ?? save.balance ?? "—"}
            </p>
          </div>
          {isLowBalance && (
            <span className="text-xs text-destructive font-medium">Saldo baixo!</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          label="Artilheiro"
          value={topScorer && (topScorer.currentSeasonStats || topScorer.totalStats)?.goals ? `${topScorer.name} (${(topScorer.currentSeasonStats || topScorer.totalStats)?.goals})` : "—"}
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
              .sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.goals ?? 0) - ((a.currentSeasonStats || a.totalStats)?.goals ?? 0))
              .slice(0, 5)
              .map((p, i) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}>{i + 1}</span>
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.position}</span>
                  </div>
                  <span className="font-display font-bold text-primary">{(p.currentSeasonStats || p.totalStats)?.goals ?? 0}</span>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum jogador no elenco.</p>
        )}
      </div>

      {/* Quem mais evoluiu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-gamer p-6">
          <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" /> Mais evoluídos (OVR)
          </h3>
          {(() => {
            const top = players
              .filter(p => p.ovrDelta != null && p.ovrDelta > 0)
              .sort((a, b) => (b.ovrDelta ?? 0) - (a.ovrDelta ?? 0))
              .slice(0, 5);
            return top.length > 0 ? (
              <div className="space-y-3">
                {top.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.position}</span>
                    </div>
                    <span className="font-display font-bold text-green-500">▲{p.ovrDelta}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Nenhuma evolução registrada.</p>;
          })()}
        </div>

        <div className="card-gamer p-6">
          <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" /> Mais valorizados
          </h3>
          {(() => {
            const top = players
              .filter(p => p.marketValueDelta != null && p.marketValueDelta > 0)
              .sort((a, b) => (b.marketValueDelta ?? 0) - (a.marketValueDelta ?? 0))
              .slice(0, 5);
            return top.length > 0 ? (
              <div className="space-y-3">
                {top.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.position}</span>
                    </div>
                    <span className="font-display font-bold text-green-500">▲€{p.marketValueDelta}M</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Nenhuma valorização registrada.</p>;
          })()}
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
