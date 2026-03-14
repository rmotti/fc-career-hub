import { Trophy, TrendingUp, TrendingDown, User, Loader2 } from "lucide-react";
import StatCard from "./StatCard";
import { useClubStints } from "@/hooks/useClubStints";
import { useTrophies } from "@/hooks/useTrophies";
import { useTransfers } from "@/hooks/useTransfers";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeamStats } from "@/hooks/useTeamStats";

interface Props {
  saveId: string;
}

const HistoryScreen = ({ saveId }: Props) => {
  const { data: clubStints = [], isLoading } = useClubStints(saveId);
  const { data: trophies = [] } = useTrophies(saveId);
  const { data: transfers = [] } = useTransfers(saveId);
  const { data: players = [] } = usePlayers(saveId);
  const { data: allTeamStats = [] } = useTeamStats(saveId);

  // Aggregate team stats across all seasons
  const totalWins = allTeamStats.reduce((s, ts) => s + ts.wins, 0);
  const totalDraws = allTeamStats.reduce((s, ts) => s + ts.draws, 0);
  const totalLosses = allTeamStats.reduce((s, ts) => s + ts.losses, 0);
  const totalMatches = totalWins + totalDraws + totalLosses;

  // All-time top scorers from totalStats
  const topScorer = players.length > 0
    ? [...players].sort((a, b) => (b.totalStats?.goals ?? 0) - (a.totalStats?.goals ?? 0))[0]
    : null;
  const topAssist = players.length > 0
    ? [...players].sort((a, b) => (b.totalStats?.assists ?? 0) - (a.totalStats?.assists ?? 0))[0]
    : null;

  const purchases = transfers.filter(t => t.type === "compra");
  const sales = transfers.filter(t => t.type === "venda");
  const feeToNum = (fee?: string) => parseFloat((fee ?? "0").replace(/[^0-9.]/g, "")) || 0;
  const biggestBuy = purchases.length > 0 ? [...purchases].sort((a, b) => feeToNum(b.fee) - feeToNum(a.fee))[0] : null;
  const biggestSale = sales.length > 0 ? [...sales].sort((a, b) => feeToNum(b.fee) - feeToNum(a.fee))[0] : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" /> Carregando histórico...
      </div>
    );
  }

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
          <Trophy size={18} className="text-gold" /> Troféus ({trophies.length})
        </h3>
        {trophies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {trophies.map((t) => (
              <div key={t._id} className="bg-muted/50 rounded-md p-3 border border-border">
                <p className="font-display font-bold text-gold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.club ?? "—"} — {t.year}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum troféu conquistado ainda.</p>
        )}
      </div>

      {/* Club history */}
      <div className="card-gamer p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Clubes Gerenciados</h3>
        <div className="space-y-3">
          {clubStints.map((c) => (
            <div key={c._id} className="flex items-center justify-between bg-muted/30 rounded-md p-3">
              <div>
                <p className="font-medium">{c.club}</p>
                <p className="text-xs text-muted-foreground">
                  {c.startYear}–{c.endYear ?? "presente"}
                  {c.isCurrent && <span className="ml-2 text-primary">(atual)</span>}
                </p>
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
              <p className="text-sm text-primary font-bold">{biggestBuy.fee || "Livre"}</p>
            </>
          ) : <p className="text-muted-foreground text-sm">—</p>}
        </div>
        <div className="card-gamer p-5">
          <p className="text-xs text-muted-foreground uppercase mb-1">Maior Venda</p>
          {biggestSale ? (
            <>
              <p className="font-display text-lg font-bold">{biggestSale.playerName}</p>
              <p className="text-sm text-accent font-bold">{biggestSale.fee || "Livre"}</p>
            </>
          ) : <p className="text-muted-foreground text-sm">—</p>}
        </div>
        <div className="card-gamer p-5">
          <p className="text-xs text-muted-foreground uppercase mb-1">Top Artilheiro Histórico</p>
          {topScorer && topScorer.totalStats?.goals ? (
            <>
              <p className="font-display text-lg font-bold">{topScorer.name}</p>
              <p className="text-sm text-primary font-bold">{topScorer.totalStats.goals} gols</p>
            </>
          ) : <p className="text-muted-foreground text-sm">—</p>}
        </div>
        <div className="card-gamer p-5">
          <p className="text-xs text-muted-foreground uppercase mb-1">Top Assistente Histórico</p>
          {topAssist && topAssist.totalStats?.assists ? (
            <>
              <p className="font-display text-lg font-bold">{topAssist.name}</p>
              <p className="text-sm text-accent font-bold">{topAssist.totalStats.assists} assistências</p>
            </>
          ) : <p className="text-muted-foreground text-sm">—</p>}
        </div>
      </div>
    </div>
  );
};

export default HistoryScreen;
