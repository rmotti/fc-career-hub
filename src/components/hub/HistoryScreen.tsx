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

  // Top 5 all-time scorers from totalStats
  const validPlayers = players?.filter(p => p && p.totalStats) ?? [];
  const top5Scorers = validPlayers
    .map(p => ({
      name: p.name,
      total: p.totalStats?.goals ?? 0,
      clubs: [] as string[]
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const top5Assisters = validPlayers
    .map(p => ({
      name: p.name,
      total: p.totalStats?.assists ?? 0,
      clubs: [] as string[]
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const purchases = transfers.filter(t => t.type === "compra");
  const sales = transfers.filter(t => t.type === "venda");
  const feeToNum = (fee?: string) => parseFloat(fee ?? "0") || 0;
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            {trophies.map((t) => {
              const isLeague = /league|liga|serie|ligue|bundesliga|premier|laliga|eredivisie/i.test(t.name);
              const isCup = /cup|copa|coppa|pokal|taça|coupe/i.test(t.name);
              const isChampions = /champions|europa league|conference/i.test(t.name);

              let borderClass = "border-border";
              let bgClass = "bg-muted/50";
              if (isLeague) {
                borderClass = "border-yellow-500/30";
                bgClass = "bg-yellow-500/5";
              } else if (isChampions) {
                borderClass = "border-primary/30";
                bgClass = "bg-primary/5";
              } else if (isCup) {
                borderClass = "border-accent/30";
                bgClass = "bg-accent/5";
              }

              return (
                <div key={t.id} className={`${bgClass} rounded-md p-3 border ${borderClass}`}>
                  <p className="font-display font-bold text-gold flex items-center gap-1.5">
                    🏆 {t.name}
                  </p>
                  <p className="text-sm text-foreground mt-1">{t.club ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{t.year}</p>
                </div>
              );
            })}
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
            <div key={c.id} className="flex items-center justify-between bg-muted/30 rounded-md p-3">
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
              <p className="text-sm text-primary font-bold">{biggestBuy.fee ? `€${biggestBuy.fee}M` : "Livre"}</p>
            </>
          ) : <p className="text-muted-foreground text-sm">—</p>}
        </div>
        <div className="card-gamer p-5">
          <p className="text-xs text-muted-foreground uppercase mb-1">Maior Venda</p>
          {biggestSale ? (
            <>
              <p className="font-display text-lg font-bold">{biggestSale.playerName}</p>
              <p className="text-sm text-accent font-bold">{biggestSale.fee ? `€${biggestSale.fee}M` : "Livre"}</p>
            </>
          ) : <p className="text-muted-foreground text-sm">—</p>}
        </div>
        <div className="card-gamer p-5 md:col-span-2 lg:col-span-1">
          <p className="text-xs text-muted-foreground uppercase mb-3">Top Artilheiros Históricos</p>
          {top5Scorers.length > 0 && top5Scorers[0].total > 0 ? (
            <div className="space-y-3">
              {top5Scorers.filter(p => p.total > 0).map((p, i) => (
                <div key={p.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-md hover:bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <div>
                      <p className="font-display font-medium text-sm">{p.name}</p>
                      {p.clubs.length > 0 && <p className="text-[10px] text-muted-foreground">{p.clubs.join(', ')}</p>}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary">{p.total} cols</span>
                </div>
              ))}
            </div>
          ) : <p className="text-muted-foreground text-sm">—</p>}
        </div>
        <div className="card-gamer p-5 md:col-span-2 lg:col-span-1 border-t md:border-t-0 md:border-l border-border md:pl-5">
          <p className="text-xs text-muted-foreground uppercase mb-3">Top Assistentes Históricos</p>
          {top5Assisters.length > 0 && top5Assisters[0].total > 0 ? (
            <div className="space-y-3">
              {top5Assisters.filter(p => p.total > 0).map((p, i) => (
                <div key={p.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-md hover:bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <div>
                      <p className="font-display font-medium text-sm">{p.name}</p>
                      {p.clubs.length > 0 && <p className="text-[10px] text-muted-foreground">{p.clubs.join(', ')}</p>}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-accent">{p.total} asts</span>
                </div>
              ))}
            </div>
          ) : <p className="text-muted-foreground text-sm">—</p>}
        </div>
      </div>
    </div>
  );
};

export default HistoryScreen;
