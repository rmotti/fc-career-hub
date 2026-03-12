import { Target, ShieldAlert, Circle, AlertTriangle } from "lucide-react";
import type { SaveData } from "@/data/mockData";
import StatCard from "./StatCard";

interface Props {
  save: SaveData;
}

const StatsScreen = ({ save }: Props) => {
  const topScorers = [...save.players].sort((a, b) => b.goals - a.goals).slice(0, 5);
  const topAssists = [...save.players].sort((a, b) => b.assists - a.assists).slice(0, 5);
  const topCards = [...save.players].sort((a, b) => (b.yellowCards + b.redCards * 3) - (a.yellowCards + a.redCards * 3)).slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Estatísticas da Temporada</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Gols Pró" value={save.teamStats.goalsPro} icon={Target} />
        <StatCard label="Gols Contra" value={save.teamStats.goalsAgainst} icon={ShieldAlert} accent />
        <StatCard label="Posse de Bola" value={`${save.teamStats.possession}%`} icon={Circle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scorers */}
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
                <span className="font-display font-bold text-primary">{p.goals}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assists */}
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
                <span className="font-display font-bold text-accent">{p.assists}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cards */}
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
                  <span className="text-warning font-bold">{p.yellowCards}🟨</span>
                  {p.redCards > 0 && <span className="text-destructive font-bold">{p.redCards}🟥</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsScreen;
