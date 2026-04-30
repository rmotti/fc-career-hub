import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Crown,
  Dumbbell,
  Goal,
  Loader2,
  Medal,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useFinancialSnapshot } from "@/hooks/useFinancialSnapshot";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeamStats } from "@/hooks/useTeamStats";
import { useTransfers } from "@/hooks/useTransfers";
import { useTrophies } from "@/hooks/useTrophies";
import type { ApiPlayer, ApiTransfer } from "@/services/api";
import { CUP_LABELS, getAggregateTeamStats, getLeagueStats } from "@/utils/competitions";
import { formatCurrency, formatCurrencyInMillions, formatSignedCurrencyInMillions } from "@/utils/currency";

interface Props {
  saveId: string;
}

type HighlightTone = "primary" | "accent" | "gold" | "warning" | "destructive" | "muted";

const toneClass: Record<HighlightTone, string> = {
  primary: "text-primary",
  accent: "text-accent",
  gold: "text-[hsl(var(--gold))]",
  warning: "text-[hsl(var(--warning))]",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

const getPlayerStats = (player?: ApiPlayer | null) =>
  player?.currentSeasonStats || player?.totalStats;

const isIncomingTransfer = (transfer: ApiTransfer) =>
  transfer.type === "compra" || transfer.type === "emprestimo_entrada";

const isOutgoingTransfer = (transfer: ApiTransfer) =>
  transfer.type === "venda" || transfer.type === "emprestimo_saida";

const getTransferFeeLabel = (transfer: ApiTransfer) => {
  if (transfer.feeFormatted) return transfer.feeFormatted;
  if (transfer.fee) return formatCurrencyInMillions(transfer.fee);
  if (transfer.type === "emprestimo_entrada" || transfer.type === "emprestimo_saida") return "Empréstimo";
  return "Livre";
};

const DashboardScreen = ({ saveId }: Props) => {
  const { data: save } = useFinancialSnapshot(saveId);
  const { data: players = [], isLoading: playersLoading } = usePlayers(saveId, true);
  const { data: teamStatsArr = [] } = useTeamStats(saveId, "current");
  const { data: trophies = [] } = useTrophies(saveId);
  const { data: transfers = [] } = useTransfers(saveId, "current");

  if (!save) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const teamStats = getAggregateTeamStats(teamStatsArr);
  const leagueStats = getLeagueStats(teamStatsArr);
  const cupStats = teamStatsArr.filter((stat) => stat.competition?.type !== "League");
  const matches = teamStats ? teamStats.wins + teamStats.draws + teamStats.losses : 0;
  const winRate = matches > 0 && teamStats ? Math.round((teamStats.wins / matches) * 100) : 0;
  const goalDifference = teamStats ? teamStats.goalsPro - teamStats.goalsAgainst : 0;
  const goalsPerMatch = teamStats && matches > 0 ? teamStats.goalsPro / matches : 0;
  const concededPerMatch = teamStats && matches > 0 ? teamStats.goalsAgainst / matches : 0;

  const budgetNum = save.budget ?? 0;
  const balanceNum = save.balance ?? 0;
  const balancePct = budgetNum > 0 ? Math.max(0, Math.min(100, (balanceNum / budgetNum) * 100)) : 0;
  const isLowBalance = budgetNum > 0 && balanceNum < budgetNum * 0.2;
  const displayBudget = typeof save.budget === "number" ? formatCurrency(save.budget) : save.budgetFormatted ?? "-";
  const displayBalance = typeof save.balance === "number" ? formatCurrency(save.balance) : save.balanceFormatted ?? "-";

  const sortedByGoals = [...players]
    .sort((a, b) => (getPlayerStats(b)?.goals ?? 0) - (getPlayerStats(a)?.goals ?? 0));
  const sortedByAssists = [...players]
    .sort((a, b) => (getPlayerStats(b)?.assists ?? 0) - (getPlayerStats(a)?.assists ?? 0));
  const sortedByContribution = [...players]
    .sort((a, b) => {
      const bStats = getPlayerStats(b);
      const aStats = getPlayerStats(a);
      const bTotal = bStats?.goalContributions ?? ((bStats?.goals ?? 0) + (bStats?.assists ?? 0));
      const aTotal = aStats?.goalContributions ?? ((aStats?.goals ?? 0) + (aStats?.assists ?? 0));
      return bTotal - aTotal;
    });
  const sortedByOvr = [...players].sort((a, b) => b.ovr - a.ovr);

  const topScorer = sortedByGoals[0] ?? null;
  const topAssistant = sortedByAssists[0] ?? null;
  const keyPlayer = sortedByContribution[0] ?? null;
  const bestOvrPlayer = sortedByOvr[0] ?? null;
  const topOvr = players
    .filter((p) => p.ovrDelta != null && p.ovrDelta > 0)
    .sort((a, b) => (b.ovrDelta ?? 0) - (a.ovrDelta ?? 0))
    .slice(0, 4);
  const topValue = players
    .filter((p) => p.marketValueDelta != null && p.marketValueDelta > 0)
    .sort((a, b) => (b.marketValueDelta ?? 0) - (a.marketValueDelta ?? 0))
    .slice(0, 4);
  const boughtCount = transfers.filter(isIncomingTransfer).length;
  const soldCount = transfers.filter(isOutgoingTransfer).length;
  const transferSpend = transfers
    .filter((transfer) => transfer.type === "compra")
    .reduce((sum, transfer) => sum + (transfer.fee ?? 0), 0);
  const transferRevenue = transfers
    .filter((transfer) => transfer.type === "venda")
    .reduce((sum, transfer) => sum + (transfer.fee ?? 0), 0);
  const transferNet = transferRevenue - transferSpend;
  const biggestPurchase = [...transfers]
    .filter((transfer) => transfer.type === "compra")
    .sort((a, b) => (b.fee ?? 0) - (a.fee ?? 0))[0] ?? null;
  const biggestSale = [...transfers]
    .filter((transfer) => transfer.type === "venda")
    .sort((a, b) => (b.fee ?? 0) - (a.fee ?? 0))[0] ?? null;

  const totalGoals = players.reduce((sum, player) => sum + (getPlayerStats(player)?.goals ?? 0), 0);
  const topScorerGoals = getPlayerStats(topScorer ?? players[0])?.goals ?? 0;
  const topScorerShare = totalGoals > 0 ? Math.round((topScorerGoals / totalGoals) * 100) : 0;

  const metricCards: Array<{
    label: string;
    value: string | number;
    detail: string;
    icon: React.ElementType;
    tone: HighlightTone;
  }> = [
    {
      label: "Taxa de vitorias",
      value: `${winRate}%`,
      detail: `${teamStats?.wins ?? 0} vitorias em ${matches} jogos`,
      icon: ShieldCheck,
      tone: winRate >= 65 ? "primary" : winRate >= 45 ? "warning" : "destructive",
    },
    {
      label: "Saldo de gols",
      value: goalDifference > 0 ? `+${goalDifference}` : goalDifference,
      detail: `${teamStats?.goalsPro ?? 0} feitos / ${teamStats?.goalsAgainst ?? 0} sofridos`,
      icon: Goal,
      tone: goalDifference >= 0 ? "accent" : "destructive",
    },
    {
      label: "Competicoes",
      value: teamStatsArr.length,
      detail: leagueStats ? `Liga + ${cupStats.length} copa(s)` : `${cupStats.length} copa(s) registrada(s)`,
      icon: Users,
      tone: "gold",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{save.name}</p>
          <h2 className="font-display text-3xl font-bold leading-none tracking-tight text-foreground">
            Painel da Temporada
          </h2>
        </div>
        <div className="flex items-center gap-3 sm:text-right">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Temporada</p>
            <p className="font-display text-xl font-bold text-primary text-glow-primary">{save.currentSeason}</p>
          </div>
        </div>
      </div>

      <section data-tour="dashboard-overview" className="grid grid-cols-1 gap-4 lg:grid-cols-[1.45fr_0.9fr]">
        <div className="card-gamer relative overflow-hidden p-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(90deg, hsl(142 70% 49%) 1px, transparent 1px), linear-gradient(0deg, hsl(142 70% 49%) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Crown size={16} className="text-primary" />
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Campanha geral</p>
                </div>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Resultado agregado de todas as competicoes cadastradas. Pontos aparecem apenas na linha da liga.
                </p>
              </div>
              <div className="flex min-h-[58px] min-w-[72px] flex-col items-center justify-center rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-center">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Jogos</p>
                <p className="font-display text-2xl font-bold leading-none text-primary text-glow-primary">{matches}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="pr-4 text-center">
                <p className="font-display text-6xl font-bold leading-none text-primary text-glow-primary">{teamStats?.wins ?? 0}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Vitorias</p>
              </div>
              <div className="px-4 text-center">
                <p className="font-display text-6xl font-bold leading-none text-[hsl(var(--warning))]">{teamStats?.draws ?? 0}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Empates</p>
              </div>
              <div className="pl-4 text-center">
                <p className="font-display text-6xl font-bold leading-none text-destructive">{teamStats?.losses ?? 0}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Derrotas</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {metricCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-md border border-border bg-background/35 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Icon size={14} className={toneClass[card.tone]} />
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{card.label}</p>
                    </div>
                    <p className={`font-display text-2xl font-bold leading-none ${toneClass[card.tone]}`}>{card.value}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{card.detail}</p>
                  </div>
                );
              })}
            </div>

            {teamStatsArr.length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Distribuicao por competicao</p>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {teamStatsArr.map((stat) => {
                    const statMatches = stat.wins + stat.draws + stat.losses;
                    const statGoalDiff = stat.goalsPro - stat.goalsAgainst;
                    const isLeague = stat.competition?.type === "League";
                    const competitionMeta = isLeague
                      ? `${stat.wins * 3 + stat.draws} pts em ${statMatches} jogos`
                      : `${CUP_LABELS[stat.cupResult ?? ""] ?? stat.cupResult ?? "Copa"}`;

                    return (
                      <div key={stat.id} className="rounded-md border border-border bg-background/30 px-3 py-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{stat.competition?.name ?? "Competicao"}</p>
                            <p className="text-xs text-muted-foreground">{competitionMeta}</p>
                          </div>
                          <span className={`shrink-0 font-display text-sm font-bold ${statGoalDiff >= 0 ? "text-primary" : "text-destructive"}`}>
                            {stat.wins}V {stat.draws}E {stat.losses}D
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {stat.goalsPro} GP / {stat.goalsAgainst} GC / {statGoalDiff > 0 ? `+${statGoalDiff}` : statGoalDiff} SG
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card-gamer p-6">
          <div className="mb-5 flex items-center gap-2">
            <Sparkles size={15} className="text-[hsl(var(--gold))]" />
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Protagonistas</p>
          </div>
          <div className="space-y-3">
            <PlayerSpotlight
              label="Maior impacto"
              playerName={keyPlayer?.name}
              meta={keyPlayer ? `${getPlayerStats(keyPlayer)?.goals ?? 0} G / ${getPlayerStats(keyPlayer)?.assists ?? 0} A` : undefined}
              icon={Crown}
              tone="gold"
            />
            <PlayerSpotlight
              label="Artilheiro"
              playerName={topScorer?.name}
              meta={topScorer ? `${getPlayerStats(topScorer)?.goals ?? 0} gols` : undefined}
              icon={Target}
              tone="primary"
            />
            <PlayerSpotlight
              label="Garcom"
              playerName={topAssistant?.name}
              meta={topAssistant ? `${getPlayerStats(topAssistant)?.assists ?? 0} assistencias` : undefined}
              icon={Zap}
              tone="accent"
            />
            <PlayerSpotlight
              label="Maior OVR"
              playerName={bestOvrPlayer?.name}
              meta={bestOvrPlayer ? `${bestOvrPlayer.ovr} OVR` : undefined}
              icon={Medal}
              tone="warning"
            />
          </div>
        </div>
      </section>

      <section>
        <div data-tour="dashboard-finance" className={`card-gamer p-6 ${isLowBalance ? "border-destructive/50" : ""}`}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CircleDollarSign size={15} className={isLowBalance ? "text-destructive" : "text-primary"} />
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Saude financeira</p>
            </div>
            <span className={`text-xs font-semibold ${isLowBalance ? "text-destructive" : "text-primary"}`}>
              {Math.round(balancePct)}% restante
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Orcamento inicial</p>
              <p className="mt-2 font-display text-3xl font-bold leading-none text-foreground">{displayBudget}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Saldo disponivel</p>
              <p className={`mt-2 font-display text-3xl font-bold leading-none ${isLowBalance ? "text-destructive" : "text-primary text-glow-primary"}`}>
                {displayBalance}
              </p>
            </div>
          </div>

          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ${isLowBalance ? "bg-destructive" : "bg-primary"}`}
              style={{
                width: `${balancePct}%`,
                boxShadow: isLowBalance ? "0 0 8px hsl(0 72% 51% / 0.7)" : "0 0 10px hsl(142 70% 49% / 0.7)",
              }}
            />
          </div>
          {topScorer && topScorerShare >= 40 && topScorerGoals > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              {topScorer.name} concentra {topScorerShare}% dos gols do elenco.
            </p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardListCard
          title="Evolucao do elenco"
          icon={Dumbbell}
          empty="Nenhuma evolucao de OVR registrada."
          items={topOvr.map((player) => ({
            id: player.id,
            title: player.name,
            meta: `${player.position} · ${player.ovr} OVR`,
            value: `+${player.ovrDelta}`,
            tone: "primary",
          }))}
        />

        <DashboardListCard
          title="Valorizacao"
          icon={ArrowUpRight}
          empty="Nenhuma valorizacao registrada."
          items={topValue.map((player) => ({
            id: player.id,
            title: player.name,
            meta: `${player.position} · ${player.marketValueFormatted ?? "sem valor"}`,
            value: `+${formatCurrencyInMillions(player.marketValueDelta ?? 0)}`,
            tone: "accent",
          }))}
        />

        <div className="card-gamer p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trophy size={15} className="text-[hsl(var(--gold))]" />
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Legado</p>
            </div>
            <p className="font-display text-3xl font-bold leading-none text-[hsl(var(--gold))]">{trophies.length}</p>
          </div>
          {trophies.length > 0 ? (
            <div className="space-y-2">
              {trophies.slice(0, 4).map((trophy) => (
                <div key={trophy.id} className="rounded-md border border-border bg-background/30 px-3 py-2">
                  <p className="truncate text-sm font-medium text-foreground">{trophy.competition.name}</p>
                  <p className="text-xs text-muted-foreground">{trophy.club ?? "Clube"} · {trophy.year}/{String(trophy.year + 1).slice(-2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum titulo registrado ainda.</p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="card-gamer p-6">
          <div className="mb-5 flex items-center gap-2">
            <Goal size={15} className="text-primary" />
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Producao ofensiva</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CompactMetric label="Gols por jogo" value={goalsPerMatch.toFixed(2)} tone="primary" />
            <CompactMetric label="Sofridos por jogo" value={concededPerMatch.toFixed(2)} tone={concededPerMatch <= 1 ? "accent" : "warning"} />
          </div>
          <div className="mt-5">
            {playersLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" /> Carregando...
              </div>
            ) : sortedByContribution.length > 0 ? (
              <div className="space-y-2">
                {sortedByContribution.slice(0, 5).map((player, index) => {
                  const stats = getPlayerStats(player);
                  const contribution = stats?.goalContributions ?? ((stats?.goals ?? 0) + (stats?.assists ?? 0));
                  return (
                    <div key={player.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/40">
                      <span className="w-5 shrink-0 text-center font-display text-xs font-bold text-muted-foreground/60">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{player.name}</p>
                        <p className="text-xs text-muted-foreground">{stats?.goals ?? 0} G / {stats?.assists ?? 0} A</p>
                      </div>
                      <span className="font-display text-sm font-bold text-primary">{contribution}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum jogador no elenco.</p>
            )}
          </div>
        </div>

        <div className="card-gamer p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="flex items-center gap-2">
              <ArrowDownRight size={15} className="text-accent" />
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Mercado da temporada</p>
            </div>
            <p className="text-xs text-muted-foreground">{boughtCount} entradas · {soldCount} saidas</p>
          </div>
          {transfers.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <CompactMetric label="Saldo" value={formatSignedCurrencyInMillions(transferNet)} tone={transferNet >= 0 ? "primary" : "destructive"} />
                <CompactMetric label="Gasto" value={formatCurrencyInMillions(transferSpend)} tone={transferSpend > 0 ? "warning" : "muted"} />
                <CompactMetric label="Receita" value={formatCurrencyInMillions(transferRevenue)} tone={transferRevenue > 0 ? "accent" : "muted"} />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <MarketHighlight label="Maior compra" transfer={biggestPurchase} empty="Sem compras pagas" tone="primary" />
                <MarketHighlight label="Maior venda" transfer={biggestSale} empty="Sem vendas pagas" tone="accent" />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma movimentacao registrada nesta temporada.</p>
          )}
        </div>
      </section>
    </div>
  );
};

interface MarketHighlightProps {
  label: string;
  transfer: ApiTransfer | null;
  empty: string;
  tone: HighlightTone;
}

function MarketHighlight({ label, transfer, empty, tone }: MarketHighlightProps) {
  return (
    <div className="rounded-md border border-border bg-background/30 p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      {transfer ? (
        <div className="mt-2">
          <p className="truncate text-sm font-semibold text-foreground">{transfer.playerName}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="truncate text-xs text-muted-foreground">
              {transfer.from} {"->"} {transfer.to}
            </p>
            <span className={`shrink-0 font-display text-sm font-bold ${toneClass[tone]}`}>
              {getTransferFeeLabel(transfer)}
            </span>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

interface PlayerSpotlightProps {
  label: string;
  playerName?: string;
  meta?: string;
  icon: React.ElementType;
  tone: HighlightTone;
}

function PlayerSpotlight({ label, playerName, meta, icon: Icon, tone }: PlayerSpotlightProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background/30 p-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted/60 ${toneClass[tone]}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold text-foreground">{playerName ?? "-"}</p>
      </div>
      <p className={`shrink-0 font-display text-sm font-bold ${toneClass[tone]}`}>{meta ?? "-"}</p>
    </div>
  );
}

interface DashboardListCardProps {
  title: string;
  icon: React.ElementType;
  empty: string;
  items: Array<{
    id: string;
    title: string;
    meta: string;
    value: string;
    tone: HighlightTone;
  }>;
}

function DashboardListCard({ title, icon: Icon, empty, items }: DashboardListCardProps) {
  return (
    <div className="card-gamer p-6">
      <div className="mb-5 flex items-center gap-2">
        <Icon size={15} className="text-primary" />
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
      </div>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-center font-display text-xs font-bold text-muted-foreground/50">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight text-foreground/90">{item.title}</p>
                <p className="text-[11px] text-muted-foreground">{item.meta}</p>
              </div>
              <span className={`shrink-0 font-display text-sm font-bold tabular-nums ${toneClass[item.tone]}`}>{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

interface CompactMetricProps {
  label: string;
  value: string;
  tone: HighlightTone;
}

function CompactMetric({ label, value, tone }: CompactMetricProps) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-background/30 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`mt-2 break-words font-display text-[clamp(1.25rem,5.4vw,1.5rem)] font-bold leading-none ${toneClass[tone]}`}>
        {value}
      </p>
    </div>
  );
}

export default DashboardScreen;
