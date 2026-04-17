import { Trophy, TrendingUp, TrendingDown, User, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import StatCard from "./StatCard";
import { useClubStints } from "@/hooks/useClubStints";
import { useTrophies } from "@/hooks/useTrophies";
import { useTransfers } from "@/hooks/useTransfers";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeamStats } from "@/hooks/useTeamStats";
import { formatTrophyLabel, getCompetitionAccent } from "@/utils/competitions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  saveId: string;
}

type ModalType = "scorers" | "assisters" | "matches" | "buys" | "sales" | null;

const HistoryScreen = ({ saveId }: Props) => {
  const { data: clubStints = [], isLoading } = useClubStints(saveId);
  const { data: trophies = [] } = useTrophies(saveId);
  const { data: transfers = [] } = useTransfers(saveId);
  const { data: players = [] } = usePlayers(saveId);
  const { data: allTeamStats = [] } = useTeamStats(saveId);

  const [openModal, setOpenModal] = useState<ModalType>(null);

  // Aggregate team stats across all seasons
  const allLeagueStats = allTeamStats.filter((ts) => ts.competition?.type === "League");
  const totalWins = allLeagueStats.reduce((s, ts) => s + ts.wins, 0);
  const totalDraws = allLeagueStats.reduce((s, ts) => s + ts.draws, 0);
  const totalLosses = allLeagueStats.reduce((s, ts) => s + ts.losses, 0);
  const totalMatches = totalWins + totalDraws + totalLosses;

  // Top all-time scorers from totalStats
  const validPlayers = players?.filter(p => p && p.totalStats) ?? [];

  const allScorers = validPlayers
    .map(p => ({
      name: p.name,
      total: p.totalStats?.goals ?? 0,
      matches: p.totalStats?.matches ?? 0,
      clubs: [...new Set(((p as any).history ?? []).map((h: any) => h.club))] as string[]
    }))
    .filter(p => p.total > 0)
    .sort((a, b) => b.total - a.total);

  const allAssisters = validPlayers
    .map(p => ({
      name: p.name,
      total: p.totalStats?.assists ?? 0,
      matches: p.totalStats?.matches ?? 0,
      clubs: [...new Set(((p as any).history ?? []).map((h: any) => h.club))] as string[]
    }))
    .filter(p => p.total > 0)
    .sort((a, b) => b.total - a.total);

  const allByMatches = validPlayers
    .map(p => ({
      name: p.name,
      total: p.totalStats?.matches ?? 0,
      goals: p.totalStats?.goals ?? 0,
      assists: p.totalStats?.assists ?? 0,
      clubs: [...new Set(((p as any).history ?? []).map((h: any) => h.club))] as string[]
    }))
    .filter(p => p.total > 0)
    .sort((a, b) => b.total - a.total);

  const top5Scorers = allScorers.slice(0, 5);
  const top5Assisters = allAssisters.slice(0, 5);
  const top5ByMatches = allByMatches.slice(0, 5);

  const purchases = transfers.filter(t => t.type === "compra");
  const sales = transfers.filter(t => t.type === "venda");
  const feeToNum = (fee?: string) => parseFloat(fee ?? "0") || 0;

  const top5Buys = [...purchases]
    .sort((a, b) => feeToNum(String(b.fee)) - feeToNum(String(a.fee)))
    .slice(0, 5);

  const top5Sales = [...sales]
    .sort((a, b) => feeToNum(String(b.fee)) - feeToNum(String(a.fee)))
    .slice(0, 5);

  const top20Buys = [...purchases]
    .sort((a, b) => feeToNum(String(b.fee)) - feeToNum(String(a.fee)))
    .slice(0, 20);

  const top20Sales = [...sales]
    .sort((a, b) => feeToNum(String(b.fee)) - feeToNum(String(a.fee)))
    .slice(0, 20);

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
              const { borderClass, bgClass } = getCompetitionAccent(t.competition);

              return (
                <div key={t.id} className={`${bgClass} rounded-md p-3 border ${borderClass}`}>
                  <p className="font-display font-bold text-gold flex items-center gap-1.5">
                    🏆 {t.competition.name}
                  </p>
                  <p className="text-sm text-foreground mt-1">{formatTrophyLabel(t)}</p>
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

        {/* Maior Compra — top 5 */}
        <div className="card-gamer p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase">Maior Compra</p>
            <button
              onClick={() => setOpenModal("buys")}
              className="w-6 h-6 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
          {top5Buys.length > 0 ? (
            <div className="space-y-2">
              {top5Buys.map((t, i) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <div>
                      <p className="font-display font-medium text-sm">{t.playerName}</p>
                      <p className="text-[10px] text-muted-foreground">{t.from} → {t.to} · {t.season}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary">{t.fee ? `€${t.fee}M` : "Livre"}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-muted-foreground text-sm">—</p>}
        </div>

        {/* Maior Venda — top 5 */}
        <div className="card-gamer p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase">Maior Venda</p>
            <button
              onClick={() => setOpenModal("sales")}
              className="w-6 h-6 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
          {top5Sales.length > 0 ? (
            <div className="space-y-2">
              {top5Sales.map((t, i) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <div>
                      <p className="font-display font-medium text-sm">{t.playerName}</p>
                      <p className="text-[10px] text-muted-foreground">{t.from} → {t.to} · {t.season}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-accent">{t.fee ? `€${t.fee}M` : "Livre"}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-muted-foreground text-sm">—</p>}
        </div>

        {/* Top Artilheiros */}
        <div className="card-gamer p-5 md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase">Top Artilheiros Históricos</p>
            <button
              onClick={() => setOpenModal("scorers")}
              className="w-6 h-6 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
          {top5Scorers.length > 0 ? (
            <div className="space-y-3">
              {top5Scorers.map((p, i) => (
                <div key={p.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-md hover:bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <div>
                      <p className="font-display font-medium text-sm">{p.name}</p>
                      {p.clubs.length > 0 && <p className="text-[10px] text-muted-foreground">{p.clubs.join(', ')}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {p.matches > 0 && <span className="text-xs text-muted-foreground">{p.matches} jogos</span>}
                    <span className="text-sm font-bold text-primary">{p.total} Gols</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-muted-foreground text-sm">—</p>}
        </div>

        {/* Top Assistentes */}
        <div className="card-gamer p-5 md:col-span-2 lg:col-span-1 border-t md:border-t-0 md:border-l border-border md:pl-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase">Top Assistentes Históricos</p>
            <button
              onClick={() => setOpenModal("assisters")}
              className="w-6 h-6 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
          {top5Assisters.length > 0 ? (
            <div className="space-y-3">
              {top5Assisters.map((p, i) => (
                <div key={p.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-md hover:bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <div>
                      <p className="font-display font-medium text-sm">{p.name}</p>
                      {p.clubs.length > 0 && <p className="text-[10px] text-muted-foreground">{p.clubs.join(', ')}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {p.matches > 0 && <span className="text-xs text-muted-foreground">{p.matches} jogos</span>}
                    <span className="text-sm font-bold text-accent">{p.total} Assistências</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-muted-foreground text-sm">—</p>}
        </div>

        {/* Mais Partidas */}
        <div className="card-gamer p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase">Mais Partidas Históricas</p>
            <button
              onClick={() => setOpenModal("matches")}
              className="w-6 h-6 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
          {top5ByMatches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {top5ByMatches.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <div>
                      <p className="font-display font-medium text-sm">{p.name}</p>
                      {p.clubs.length > 0 && <p className="text-[10px] text-muted-foreground">{p.clubs.join(', ')}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">{p.goals}G {p.assists}A</span>
                    <span className="text-sm font-bold text-yellow-400">{p.total} Jogos</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-muted-foreground text-sm">—</p>}
        </div>
      </div>

      {/* Top 20 Modal */}
      <Dialog open={openModal !== null} onOpenChange={(open) => { if (!open) setOpenModal(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {openModal === "scorers" && "Top 20 Artilheiros Históricos"}
              {openModal === "assisters" && "Top 20 Assistentes Históricos"}
              {openModal === "matches" && "Top 20 — Mais Partidas"}
              {openModal === "buys" && "Top 20 Maiores Compras"}
              {openModal === "sales" && "Top 20 Maiores Vendas"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1 mt-2">
            {openModal === "scorers" && allScorers.slice(0, 20).map((p, i) => (
              <div key={p.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                  <div>
                    <p className="font-display font-medium text-sm">{p.name}</p>
                    {p.clubs.length > 0 && <p className="text-[10px] text-muted-foreground">{p.clubs.join(', ')}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {p.matches > 0 && <span className="text-xs text-muted-foreground">{p.matches} jogos</span>}
                  <span className="text-sm font-bold text-primary">{p.total} Gols</span>
                </div>
              </div>
            ))}

            {openModal === "assisters" && allAssisters.slice(0, 20).map((p, i) => (
              <div key={p.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                  <div>
                    <p className="font-display font-medium text-sm">{p.name}</p>
                    {p.clubs.length > 0 && <p className="text-[10px] text-muted-foreground">{p.clubs.join(', ')}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {p.matches > 0 && <span className="text-xs text-muted-foreground">{p.matches} jogos</span>}
                  <span className="text-sm font-bold text-accent">{p.total} Assistências</span>
                </div>
              </div>
            ))}

            {openModal === "matches" && allByMatches.slice(0, 20).map((p, i) => (
              <div key={p.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                  <div>
                    <p className="font-display font-medium text-sm">{p.name}</p>
                    {p.clubs.length > 0 && <p className="text-[10px] text-muted-foreground">{p.clubs.join(', ')}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground">{p.goals}G {p.assists}A</span>
                  <span className="text-sm font-bold text-yellow-400">{p.total} Jogos</span>
                </div>
              </div>
            ))}

            {openModal === "buys" && top20Buys.map((t, i) => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                  <div>
                    <p className="font-display font-medium text-sm">{t.playerName}</p>
                    <p className="text-[10px] text-muted-foreground">{t.from} → {t.to} · {t.season}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-primary shrink-0">{t.fee ? `€${t.fee}M` : "Livre"}</span>
              </div>
            ))}

            {openModal === "sales" && top20Sales.map((t, i) => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                  <div>
                    <p className="font-display font-medium text-sm">{t.playerName}</p>
                    <p className="text-[10px] text-muted-foreground">{t.from} → {t.to} · {t.season}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-accent shrink-0">{t.fee ? `€${t.fee}M` : "Livre"}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryScreen;
