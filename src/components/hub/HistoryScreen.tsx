import { Trophy, TrendingUp, TrendingDown, User } from "lucide-react";
import type { SaveData } from "@/data/mockData";
import StatCard from "./StatCard";

interface Props {
  save: SaveData;
}

const HistoryScreen = ({ save }: Props) => {
  const allPlayers = save.players;
  const totalMatches = save.clubHistory.reduce((s, c) => s + c.matches, 0);
  const totalWins = save.clubHistory.reduce((s, c) => s + c.wins, 0);
  const totalDraws = save.clubHistory.reduce((s, c) => s + c.draws, 0);
  const totalLosses = save.clubHistory.reduce((s, c) => s + c.losses, 0);

  const topScorer = allPlayers.length > 0 ? [...allPlayers].sort((a, b) => b.goals - a.goals)[0] : null;
  const topAssist = allPlayers.length > 0 ? [...allPlayers].sort((a, b) => b.assists - a.assists)[0] : null;

  const purchases = save.transfers.filter(t => t.type === "compra");
  const sales = save.transfers.filter(t => t.type === "venda");
  const biggestBuy = purchases.sort((a, b) => parseFloat(b.fee.replace(/[^0-9.]/g, "")) - parseFloat(a.fee.replace(/[^0-9.]/g, "")))[0];
  const biggestSale = sales.sort((a, b) => parseFloat(b.fee.replace(/[^0-9.]/g, "")) - parseFloat(a.fee.replace(/[^0-9.]/g, "")))[0];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">História — Legado do Save</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total de Jogos" value={totalMatches} icon={User} />
        <StatCard label="Vitórias" value={totalWins} icon={TrendingUp} />
        <StatCard label="Empates" value={totalDraws} icon={TrendingUp} accent />
        <StatCard label="Derrotas" value={totalLosses} icon={TrendingDown} />
      </div>

      {/* Trophies */}
      <div className="card-gamer p-6">
        <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy size={18} className="text-gold" /> Troféus ({save.trophies.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {save.trophies.map((t) => (
            <div key={t.id} className="bg-muted/50 rounded-md p-3 border border-border">
              <p className="font-display font-bold text-gold">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.club} — {t.year}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Club history */}
      <div className="card-gamer p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Clubes Gerenciados</h3>
        <div className="space-y-3">
          {save.clubHistory.map((c, i) => (
            <div key={i} className="flex items-center justify-between bg-muted/30 rounded-md p-3">
              <div>
                <p className="font-medium">{c.club}</p>
                <p className="text-xs text-muted-foreground">{c.years}</p>
              </div>
              <div className="text-right text-sm">
                <span className="text-primary font-bold">{c.wins}V</span>{" / "}
                <span className="text-warning font-bold">{c.draws}E</span>{" / "}
                <span className="text-destructive font-bold">{c.losses}D</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Records */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-gamer p-5">
          <p className="text-xs text-muted-foreground uppercase mb-1">Maior Compra</p>
          {biggestBuy ? (
            <>
              <p className="font-display text-lg font-bold">{biggestBuy.playerName}</p>
              <p className="text-sm text-primary font-bold">{biggestBuy.fee}</p>
            </>
          ) : <p className="text-muted-foreground text-sm">—</p>}
        </div>
        <div className="card-gamer p-5">
          <p className="text-xs text-muted-foreground uppercase mb-1">Maior Venda</p>
          {biggestSale ? (
            <>
              <p className="font-display text-lg font-bold">{biggestSale.playerName}</p>
              <p className="text-sm text-accent font-bold">{biggestSale.fee}</p>
            </>
          ) : <p className="text-muted-foreground text-sm">—</p>}
        </div>
        <div className="card-gamer p-5">
          <p className="text-xs text-muted-foreground uppercase mb-1">Top Artilheiro Histórico</p>
          <p className="font-display text-lg font-bold">{topScorer.name}</p>
          <p className="text-sm text-primary font-bold">{topScorer.goals} gols</p>
        </div>
        <div className="card-gamer p-5">
          <p className="text-xs text-muted-foreground uppercase mb-1">Top Assistente Histórico</p>
          <p className="font-display text-lg font-bold">{topAssist.name}</p>
          <p className="text-sm text-accent font-bold">{topAssist.assists} assistências</p>
        </div>
      </div>
    </div>
  );
};

export default HistoryScreen;
