import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Crown,
  Footprints,
  Goal,
  Handshake,
  History,
  Loader2,
  Medal,
  Plus,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useClubStints } from "@/features/history/model/useClubStints";
import { useTrophies } from "@/features/history/model/useTrophies";
import { useTransfers } from "@/features/transfers/model/useTransfers";
import { usePlayers } from "@/features/squad/model/usePlayers";
import { useTeamStats } from "@/features/stats/model/useTeamStats";
import type { ApiTrophy } from "@/shared/api/client";
import { formatTrophyLabel, getCompetitionAccent } from "@/shared/lib/competitions";
import { formatCurrencyInMillions } from "@/shared/lib/currency";
import { m } from "@/shared/lib/money";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { ScrollArea } from "@/shared/ui/scroll-area";

interface Props {
  saveId: string;
}

type ModalType = "scorers" | "assisters" | "matches" | "contributions" | "buys" | "sales" | null;
type Tone = "primary" | "accent" | "gold" | "warning" | "destructive" | "muted";
type PlayerRankingItem = {
  name: string;
  total: number;
  matches?: number;
  goals?: number;
  assists?: number;
  clubs: string[];
};
type TransferRankingItem = {
  id: string;
  playerName: string;
  from: string;
  to: string;
  season: string;
  fee?: number;
};
type TrophyRoomItem = ApiTrophy;

const toneClass: Record<Tone, string> = {
  primary: "text-primary",
  accent: "text-accent",
  gold: "text-[hsl(var(--gold))]",
  warning: "text-[hsl(var(--warning))]",
  destructive: "text-destructive-text",
  muted: "text-muted-foreground",
};

const toneBgClass: Record<Tone, string> = {
  primary: "border-primary/25 bg-primary/10",
  accent: "border-accent/25 bg-accent/10",
  gold: "border-[hsl(var(--gold)/0.25)] bg-[hsl(var(--gold)/0.1)]",
  warning: "border-[hsl(var(--warning)/0.25)] bg-[hsl(var(--warning)/0.1)]",
  destructive: "border-destructive/25 bg-destructive/10",
  muted: "border-border bg-muted/20",
};

const trophyTypeLabel: Record<string, string> = {
  League: "Leagues",
  NationalCup: "Cups",
  SuperCup: "Super Cups",
  EuropeanCup: "European",
};

const feeToNum = (fee?: string | number | null) => {
  const parsed = Number(fee ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatSignedCurrency = (value: number) => {
  if (value === 0) return formatCurrencyInMillions(m(0));

  const formatted = formatCurrencyInMillions(m(Math.abs(value)));
  return `${value > 0 ? "+" : "-"}${formatted}`;
};

const HistoryScreen = ({ saveId }: Props) => {
  const { t } = useTranslation();
  const { data: clubStints = [], isLoading } = useClubStints(saveId);
  const { data: trophies = [] } = useTrophies(saveId);
  const { data: transfers = [] } = useTransfers(saveId);
  const { data: players = [] } = usePlayers(saveId);
  const { data: allTeamStats = [] } = useTeamStats(saveId);

  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [selectedTrophyId, setSelectedTrophyId] = useState<string | null>(null);

  const totals = useMemo(() => {
    const wins = allTeamStats.reduce((sum, stat) => sum + stat.wins, 0);
    const draws = allTeamStats.reduce((sum, stat) => sum + stat.draws, 0);
    const losses = allTeamStats.reduce((sum, stat) => sum + stat.losses, 0);
    const matches = wins + draws + losses;
    const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
    const goalsFor = allTeamStats.reduce((sum, stat) => sum + stat.goalsPro, 0);
    const goalsAgainst = allTeamStats.reduce((sum, stat) => sum + stat.goalsAgainst, 0);

    return {
      wins,
      draws,
      losses,
      matches,
      winRate,
      goalsFor,
      goalsAgainst,
      goalDiff: goalsFor - goalsAgainst,
      competitions: new Set(allTeamStats.map((stat) => stat.competitionId)).size,
      seasons: new Set(allTeamStats.map((stat) => stat.season)).size,
    };
  }, [allTeamStats]);

  const sortedClubStints = useMemo(
    () => [...clubStints].sort((a, b) => a.startYear - b.startYear),
    [clubStints],
  );

  const currentClub = sortedClubStints.find((stint) => stint.isCurrent) ?? sortedClubStints.at(-1);
  const firstYear = sortedClubStints[0]?.startYear;
  const lastYear = currentClub?.endYear ?? currentClub?.startYear;
  const careerYears = firstYear && lastYear ? Math.max(1, lastYear - firstYear + 1) : totals.seasons;

  const sortedTrophies = useMemo(
    () => [...trophies].sort((a, b) => b.year - a.year || a.competition.name.localeCompare(b.competition.name, "en")),
    [trophies],
  );
  const latestTrophy = sortedTrophies[0];
  const selectedTrophy = sortedTrophies.find((trophy) => trophy.id === selectedTrophyId) ?? latestTrophy;
  const trophyGroups = useMemo(() => {
    return sortedTrophies.reduce<Record<string, number>>((acc, trophy) => {
      const type = trophy.competition.type;
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {});
  }, [sortedTrophies]);

  const validPlayers = players?.filter((player) => player && player.totalStats) ?? [];

  const allScorers = validPlayers
    .map((player) => ({
      name: player.name,
      total: player.totalStats?.goals ?? 0,
      matches: player.totalStats?.matches ?? 0,
      clubs: player.clubs ?? [],
    }))
    .filter((player) => player.total > 0)
    .sort((a, b) => b.total - a.total);

  const allAssisters = validPlayers
    .map((player) => ({
      name: player.name,
      total: player.totalStats?.assists ?? 0,
      matches: player.totalStats?.matches ?? 0,
      clubs: player.clubs ?? [],
    }))
    .filter((player) => player.total > 0)
    .sort((a, b) => b.total - a.total);

  const allByMatches = validPlayers
    .map((player) => ({
      name: player.name,
      total: player.totalStats?.matches ?? 0,
      goals: player.totalStats?.goals ?? 0,
      assists: player.totalStats?.assists ?? 0,
      clubs: player.clubs ?? [],
    }))
    .filter((player) => player.total > 0)
    .sort((a, b) => b.total - a.total);

  const allByGoalContributions = validPlayers
    .map((player) => ({
      name: player.name,
      total: player.totalStats?.goalContributions ?? ((player.totalStats?.goals ?? 0) + (player.totalStats?.assists ?? 0)),
      goals: player.totalStats?.goals ?? 0,
      assists: player.totalStats?.assists ?? 0,
      matches: player.totalStats?.matches ?? 0,
      clubs: player.clubs ?? [],
    }))
    .filter((player) => player.total > 0)
    .sort((a, b) => b.total - a.total);

  const purchases = transfers.filter((transfer) => transfer.type === "compra");
  const sales = transfers.filter((transfer) => transfer.type === "venda");
  const transferSpend = m(purchases.reduce((sum, transfer) => sum + feeToNum(transfer.fee), 0));
  const transferRevenue = m(sales.reduce((sum, transfer) => sum + feeToNum(transfer.fee), 0));
  const transferNet = transferRevenue - transferSpend;

  const top5Buys = [...purchases]
    .sort((a, b) => feeToNum(b.fee) - feeToNum(a.fee))
    .slice(0, 5);

  const top5Sales = [...sales]
    .sort((a, b) => feeToNum(b.fee) - feeToNum(a.fee))
    .slice(0, 5);

  const top20Buys = [...purchases]
    .sort((a, b) => feeToNum(b.fee) - feeToNum(a.fee))
    .slice(0, 20);

  const top20Sales = [...sales]
    .sort((a, b) => feeToNum(b.fee) - feeToNum(a.fee))
    .slice(0, 20);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" /> {t("history.loading")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section data-tour="history-hero" className="card-gamer relative overflow-hidden p-5 md:p-6">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-[hsl(var(--gold)/0.08)] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-[hsl(var(--gold)/0.25)] bg-[hsl(var(--gold)/0.09)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--gold))]">
                <History size={14} />
                {t("history.legacy.label")}
              </div>
              <h2 className="font-display text-3xl font-bold leading-none tracking-tight text-foreground md:text-4xl">
                {t("history.legacy.title", { years: careerYears || 0 })}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {sortedClubStints.length > 0
                  ? t("history.legacy.managed", { count: sortedClubStints.length, trophies: trophies.length, matches: totals.matches })
                  : t("history.legacy.empty")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <LegacyMetric label={t("history.legacy.matches")} value={totals.matches} icon={Users} tone="primary" />
              <LegacyMetric label={t("history.legacy.wins")} value={totals.wins} icon={ArrowUpRight} tone="primary" />
              <LegacyMetric label={t("history.legacy.draws")} value={totals.draws} icon={Handshake} tone="warning" />
              <LegacyMetric label={t("history.legacy.losses")} value={totals.losses} icon={ArrowDownRight} tone="destructive" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <CompactLegacyStat label={t("history.legacy.winRate")} value={`${totals.winRate}%`} tone={totals.winRate >= 60 ? "primary" : totals.winRate >= 45 ? "warning" : "destructive"} />
              <CompactLegacyStat label={t("history.legacy.goalDiff")} value={`${totals.goalDiff > 0 ? "+" : ""}${totals.goalDiff}`} tone={totals.goalDiff >= 0 ? "accent" : "destructive"} />
              <CompactLegacyStat label={t("history.legacy.competitions")} value={totals.competitions || "-"} tone="gold" />
            </div>
          </div>

          <div className="rounded-lg border border-[hsl(var(--gold)/0.24)] bg-[linear-gradient(135deg,hsl(var(--gold)/0.12),hsl(var(--card)/0.25))] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("history.trophies.room")}</p>
                <p className="mt-2 font-display text-6xl font-bold leading-none text-[hsl(var(--gold))]">{trophies.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[hsl(var(--gold)/0.25)] bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold))]">
                <Trophy size={25} />
              </div>
            </div>

            {latestTrophy ? (
              <div className="mt-6 rounded-md border border-border/80 bg-background/25 p-3">
                <p className="text-xs text-muted-foreground">{t("history.trophies.latest")}</p>
                <p className="mt-1 truncate font-display text-xl font-bold text-foreground">{latestTrophy.competition.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatTrophyLabel(latestTrophy)}</p>
              </div>
            ) : (
              <div className="mt-6 rounded-md border border-dashed border-border bg-background/20 p-3 text-sm text-muted-foreground">
                {t("history.trophies.none")}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              {Object.entries(trophyTypeLabel).map(([type, label]) => (
                <div key={type} className="rounded-md border border-border bg-background/20 p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-display text-xl font-bold text-foreground">{trophyGroups[type] ?? 0}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div data-tour="history-clubs" className="card-gamer p-5 md:p-6">
          <SectionTitle icon={Footprints} kicker={t("history.clubs.kicker")} title={t("history.clubs.title")} />

          {sortedClubStints.length > 0 ? (
            <div className="mt-5 space-y-3">
              {sortedClubStints.map((club, index) => (
                <div key={club.id} className="grid grid-cols-[32px_1fr] gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md border font-display text-sm font-bold ${
                      club.isCurrent ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-muted/20 text-muted-foreground"
                    }`}>
                      {index + 1}
                    </div>
                    {index < sortedClubStints.length - 1 && <div className="mt-2 h-full min-h-8 w-px bg-border" />}
                  </div>
                  <div className="rounded-lg border border-border bg-background/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-display text-lg font-bold text-foreground">{club.club}</p>
                      {club.isCurrent && (
                        <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                          {t("history.legacy.club")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays size={14} />
                      {club.startYear}-{club.endYear ?? t("history.clubs.present")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel text={t("history.clubs.none")} />
          )}
        </div>

        <div data-tour="history-trophies" className="card-gamer p-5 md:p-6">
          <SectionTitle icon={Trophy} kicker={t("history.trophies.kicker")} title={t("history.trophies.title")} />

          {sortedTrophies.length > 0 ? (
            <TrophyRoom
              trophies={sortedTrophies}
              selectedTrophy={selectedTrophy}
              selectedTrophyId={selectedTrophy?.id}
              onSelect={setSelectedTrophyId}
            />
          ) : (
            <EmptyPanel text={t("history.trophies.none")} />
          )}
        </div>
      </section>

      <section className="card-gamer p-5 md:p-6">
        <SectionTitle icon={Star} kicker={t("history.hallOfFame.kicker")} title={t("history.hallOfFame.title")} />

        <div className="mt-5 grid gap-4 lg:grid-cols-4">
          <HallOfFameCard
            label={t("history.hallOfFame.mostMatches")}
            icon={Shield}
            tone="gold"
            players={allByMatches.slice(0, 3)}
            meta={allByMatches[0] ? `${allByMatches[0].goals}G ${allByMatches[0].assists}A` : undefined}
            valueLabel={t("history.hallOfFame.matches")}
            onExpand={() => setOpenModal("matches")}
          />
          <HallOfFameCard
            label={t("history.hallOfFame.topScorer")}
            icon={Goal}
            tone="primary"
            players={allScorers.slice(0, 3)}
            meta={allScorers[0] ? `${allScorers[0].matches || "-"} ${t("history.hallOfFame.matches")}` : undefined}
            valueLabel={t("history.hallOfFame.goals")}
            onExpand={() => setOpenModal("scorers")}
          />
          <HallOfFameCard
            label={t("history.hallOfFame.topAssister")}
            icon={Sparkles}
            tone="accent"
            players={allAssisters.slice(0, 3)}
            meta={allAssisters[0] ? `${allAssisters[0].matches || "-"} ${t("history.hallOfFame.matches")}` : undefined}
            valueLabel={t("history.hallOfFame.assists")}
            onExpand={() => setOpenModal("assisters")}
          />
          <HallOfFameCard
            label={t("history.hallOfFame.mostContributions")}
            icon={Medal}
            tone="primary"
            players={allByGoalContributions.slice(0, 3)}
            meta={allByGoalContributions[0] ? `${allByGoalContributions[0].goals}G ${allByGoalContributions[0].assists}A` : undefined}
            valueLabel={t("history.hallOfFame.contributions")}
            onExpand={() => setOpenModal("contributions")}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="card-gamer p-5 md:p-6">
          <SectionTitle icon={CircleDollarSign} kicker={t("history.market.kicker")} title={t("history.market.title")} />

          <div className="mt-5 grid gap-3">
            <CompactLegacyStat label={t("history.market.spent")} value={formatCurrencyInMillions(transferSpend)} tone="destructive" />
            <CompactLegacyStat label={t("history.market.revenue")} value={formatCurrencyInMillions(transferRevenue)} tone="accent" />
            <CompactLegacyStat label={t("history.market.balance")} value={formatSignedCurrency(transferNet)} tone={transferNet >= 0 ? "primary" : "destructive"} />
          </div>

          <Link
            to="/transfers"
            className="mt-5 inline-flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {t("history.market.viewAll")}
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TransferRecordCard
            title={t("transfers.highlights.biggestPurchase")}
            icon={ArrowDownRight}
            tone="primary"
            transfers={top5Buys}
            empty={t("transfers.highlights.noPurchases")}
            onExpand={() => setOpenModal("buys")}
          />
          <TransferRecordCard
            title={t("transfers.highlights.biggestSale")}
            icon={ArrowUpRight}
            tone="accent"
            transfers={top5Sales}
            empty={t("transfers.highlights.noSales")}
            onExpand={() => setOpenModal("sales")}
          />
        </div>
      </section>

      <Dialog open={openModal !== null} onOpenChange={(open) => { if (!open) setOpenModal(null); }}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <RankingModalContent
            openModal={openModal}
            allScorers={allScorers}
            allAssisters={allAssisters}
            allByMatches={allByMatches}
            allByGoalContributions={allByGoalContributions}
            top20Buys={top20Buys}
            top20Sales={top20Sales}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SectionTitle = ({ icon: Icon, kicker, title }: { icon: React.ElementType; kicker: string; title: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
      <Icon size={17} />
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{kicker}</p>
      <h3 className="font-display text-xl font-bold leading-none text-foreground">{title}</h3>
    </div>
  </div>
);

const LegacyMetric = ({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: React.ElementType; tone: Tone }) => (
  <div className={`rounded-lg border p-4 ${toneBgClass[tone]}`}>
    <Icon size={18} className={toneClass[tone]} />
    <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className={`mt-1 font-display text-3xl font-bold leading-none ${toneClass[tone]}`}>{value}</p>
  </div>
);

const CompactLegacyStat = ({ label, value, tone }: { label: string; value: string | number; tone: Tone }) => (
  <div className="rounded-md border border-border bg-background/20 p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`mt-1 font-display text-xl font-bold leading-none ${toneClass[tone]}`}>{value}</p>
  </div>
);

const EmptyPanel = ({ text }: { text: string }) => (
  <div className="mt-5 rounded-lg border border-dashed border-border bg-background/20 p-5 text-sm text-muted-foreground">
    {text}
  </div>
);

const TrophyRoom = ({
  trophies,
  selectedTrophy,
  selectedTrophyId,
  onSelect,
}: {
  trophies: TrophyRoomItem[];
  selectedTrophy?: TrophyRoomItem;
  selectedTrophyId?: string;
  onSelect: (id: string) => void;
}) => {
  const selectedIndex = Math.max(0, trophies.findIndex((trophy) => trophy.id === selectedTrophyId));
  const activeTrophy = selectedTrophy ?? trophies[0];
  const activeAccent = getCompetitionAccent(activeTrophy?.competition);
  const canMove = trophies.length > 1;

  const selectByOffset = (offset: number) => {
    if (!canMove) return;

    const nextIndex = (selectedIndex + offset + trophies.length) % trophies.length;
    onSelect(trophies[nextIndex].id);
  };

  if (!activeTrophy) return null;

  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-[hsl(var(--gold)/0.22)] bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--background)))]">
      <div className="relative overflow-hidden border-b border-border p-3 sm:p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-8%,hsl(var(--gold)/0.2),transparent_34%),radial-gradient(circle_at_12%_12%,hsl(var(--accent)/0.12),transparent_22%)]" />
        <div className="absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,hsl(var(--gold)/0.16),transparent)]" />
        <div className="relative rounded-lg border border-white/10 bg-[linear-gradient(180deg,hsl(220_12%_86%/0.16),hsl(220_18%_10%/0.76))] p-3 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.16),0_24px_70px_hsl(0_0%_0%/0.32)]">
          <div className="absolute inset-0 rounded-lg bg-[linear-gradient(110deg,transparent_0%,hsl(0_0%_100%/0.1)_18%,transparent_34%,transparent_62%,hsl(0_0%_100%/0.07)_76%,transparent_100%)] pointer-events-none" />
          <div className="absolute inset-y-3 left-1/3 w-px bg-white/12" />
          <div className="absolute inset-y-3 right-1/3 w-px bg-white/12" />

          <div className="grid min-h-[360px] grid-rows-[auto_1fr] gap-8">
            <div className="relative z-10 mx-auto mt-3 flex w-full max-w-sm flex-col items-center">
              <div className="relative w-44 bg-[hsl(var(--gold))] px-4 pb-5 pt-4 text-center text-[hsl(var(--gold-foreground))] shadow-[0_0_36px_hsl(var(--gold)/0.22)]">
                <div className="absolute inset-x-0 -bottom-6 mx-auto h-0 w-0 border-l-[88px] border-r-[88px] border-t-[24px] border-l-transparent border-r-transparent border-t-[hsl(var(--gold))]" />
                <p className="font-display text-lg font-bold leading-none">FC</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-75">Trophy Room</p>
                <div className="my-3 h-px bg-black/25" />
                <div className="mx-auto mb-2 flex justify-center">
                  <CssTrophy type={activeTrophy.competition.type} selected miniature />
                </div>
                <p className="line-clamp-2 min-h-10 font-display text-xl font-bold leading-tight">{activeTrophy.competition.name}</p>
                <p className="mt-2 text-xs font-bold uppercase">{activeTrophy.club ?? "Club"}</p>
                <p className="font-display text-2xl font-bold leading-none">{activeTrophy.year}</p>
              </div>
              <div className="mt-8 flex items-center gap-2">
                <span className={`rounded-md border px-2 py-1 text-xs font-semibold uppercase tracking-wider ${activeAccent.borderClass} ${activeAccent.bgClass} text-muted-foreground`}>
                  {trophyTypeLabel[activeTrophy.competition.type] ?? "Title"}
                </span>
                <span className="rounded-md border border-[hsl(var(--gold)/0.2)] bg-[hsl(var(--gold)/0.08)] px-2 py-1 text-xs font-semibold text-[hsl(var(--gold))]">
                  {selectedIndex + 1} / {trophies.length}
                </span>
              </div>
            </div>

            <TrophyShelfRow
              trophies={trophies}
              activeId={activeTrophy.id}
              onSelect={onSelect}
            />
          </div>

          <div className="pointer-events-none absolute inset-x-3 bottom-[28%] h-px bg-[linear-gradient(90deg,transparent,hsl(0_0%_100%/0.55),transparent)]" />
          <div className="pointer-events-none absolute inset-x-6 bottom-[28%] h-5 bg-white/10 blur-lg" />
        </div>
      </div>

      <div className="grid gap-4 bg-card/80 p-4 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Featured title</p>
          <p className="mt-1 truncate font-display text-2xl font-bold text-foreground">{activeTrophy.competition.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{formatTrophyLabel(activeTrophy)}</p>
        </div>
        {canMove && (
          <div className="flex items-center gap-2 lg:justify-end">
            <button
              type="button"
              onClick={() => selectByOffset(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background/30 text-muted-foreground transition-colors hover:border-[hsl(var(--gold)/0.35)] hover:text-[hsl(var(--gold))]"
              aria-label="Select previous trophy"
              title="Select previous trophy"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() => selectByOffset(1)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background/30 text-muted-foreground transition-colors hover:border-[hsl(var(--gold)/0.35)] hover:text-[hsl(var(--gold))]"
              aria-label="Select next trophy"
              title="Select next trophy"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background/25 px-4 py-4">
        <ScrollArea scrollbars="horizontal" className="w-full" viewportClassName="pb-3">
          <div className="flex min-w-max gap-3">
            {trophies.map((trophy, index) => {
              const isSelected = trophy.id === activeTrophy.id;
              const accent = getCompetitionAccent(trophy.competition);

              return (
                <button
                  key={trophy.id}
                  type="button"
                  onClick={() => onSelect(trophy.id)}
                  className={`group relative flex w-32 shrink-0 items-center gap-3 rounded-md border px-3 py-3 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-[hsl(var(--gold)/0.52)] bg-[hsl(var(--gold)/0.1)] shadow-[0_0_24px_hsl(var(--gold)/0.14)]"
                      : `${accent.borderClass} ${accent.bgClass} hover:-translate-y-0.5 hover:border-[hsl(var(--gold)/0.35)]`
                  }`}
                  aria-label={`Select ${trophy.competition.name}`}
                  title={trophy.competition.name}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    isSelected
                      ? "border-[hsl(var(--gold)/0.45)] bg-[hsl(var(--gold)/0.16)] text-[hsl(var(--gold))]"
                      : "border-border bg-background/35 text-muted-foreground group-hover:text-[hsl(var(--gold))]"
                  }`}>
                    <CssTrophy type={trophy.competition.type} selected={isSelected} miniature />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold leading-tight text-foreground">{trophy.competition.name}</span>
                    <span className="mt-1 block text-[10px] text-muted-foreground">#{index + 1} · {trophy.year}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

const TrophyShelfRow = ({
  trophies,
  activeId,
  onSelect,
}: {
  trophies: TrophyRoomItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) => (
  <div className="relative z-10 flex min-h-[160px] items-end px-1 pb-8 sm:px-3">
    <div className="pointer-events-none absolute inset-x-1 bottom-4 h-5 rounded-sm border border-white/15 bg-[linear-gradient(180deg,hsl(0_0%_100%/0.28),hsl(220_16%_12%/0.86))] shadow-[0_14px_26px_hsl(0_0%_0%/0.42),inset_0_1px_0_hsl(0_0%_100%/0.32)]" />
    <div className="pointer-events-none absolute inset-x-4 bottom-9 h-px bg-[linear-gradient(90deg,transparent,hsl(0_0%_100%/0.58),transparent)]" />
    <ScrollArea scrollbars="horizontal" className="relative w-full" viewportClassName="pb-2">
      <div className="flex min-w-max items-end gap-4 px-3">
        {trophies.map((trophy, index) => {
          const isSelected = trophy.id === activeId;

          return (
            <button
              key={trophy.id}
              type="button"
              onClick={() => onSelect(trophy.id)}
              className={`group relative flex h-28 w-24 shrink-0 flex-col items-center justify-end rounded-md border bg-black/10 pb-4 transition-all duration-200 hover:-translate-y-1 ${
                isSelected
                  ? "border-[hsl(var(--gold)/0.62)] shadow-[0_0_28px_hsl(var(--gold)/0.28)]"
                  : "border-white/10 hover:border-[hsl(var(--gold)/0.32)]"
              }`}
              aria-label={`Select ${trophy.competition.name}`}
              title={trophy.competition.name}
            >
              <span className={`absolute inset-x-3 top-2 h-8 rounded-full blur-lg ${isSelected ? "bg-[hsl(var(--gold)/0.3)]" : "bg-white/10"}`} />
              <CssTrophy type={trophy.competition.type} selected={isSelected} />
              <span className="absolute bottom-3 h-2 w-16 rounded-[50%] bg-black/40 blur-md" />
              <span className="absolute bottom-2 right-2 font-display text-[10px] font-bold text-white/40">{index + 1}</span>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  </div>
);

const CssTrophy = ({ type, selected, miniature = false }: { type: string; selected?: boolean; miniature?: boolean }) => {
  const visual = getTrophyVisual(type);
  const scale = miniature ? "scale-[0.58]" : "scale-100";
  const opacity = selected ? "opacity-100" : "opacity-75 group-hover:opacity-100";

  return (
    <span className={`relative flex h-20 w-16 origin-bottom items-end justify-center ${scale} ${opacity} transition-opacity`}>
      {visual.handles && (
        <>
          <span className={`absolute bottom-9 left-0 h-8 w-6 rounded-l-full border-l-2 border-t-2 border-b-2 ${visual.border}`} />
          <span className={`absolute bottom-9 right-0 h-8 w-6 rounded-r-full border-r-2 border-t-2 border-b-2 ${visual.border}`} />
        </>
      )}
      <span className={`absolute bottom-[34px] h-10 ${visual.bowlWidth} ${visual.bowlShape} border ${visual.border} ${visual.fill} shadow-[inset_0_1px_0_hsl(0_0%_100%/0.35),0_0_18px_currentColor]`} />
      <span className={`absolute bottom-[26px] h-3 w-8 rounded-b-md border-x border-b ${visual.border} ${visual.fill}`} />
      <span className={`absolute bottom-[14px] h-4 w-3 border-x ${visual.border} ${visual.fill}`} />
      <span className={`absolute bottom-2 h-3 w-10 rounded-t-sm border ${visual.border} ${visual.fill}`} />
      <span className={`absolute bottom-0 h-3 w-14 rounded-sm border ${visual.border} ${visual.baseFill}`} />
    </span>
  );
};

const getTrophyVisual = (type: string) => {
  if (type === "League") {
    return {
      fill: "bg-[linear-gradient(135deg,hsl(var(--gold)/0.95),hsl(48_100%_74%/0.86))] text-[hsl(var(--gold))]",
      baseFill: "bg-[linear-gradient(180deg,hsl(44_80%_42%/0.9),hsl(38_52%_20%/0.95))]",
      border: "border-yellow-100/60",
      bowlWidth: "w-12",
      bowlShape: "rounded-b-2xl rounded-t-md",
      handles: true,
    };
  }

  if (type === "EuropeanCup") {
    return {
      fill: "bg-[linear-gradient(135deg,hsl(160_84%_54%/0.92),hsl(194_95%_62%/0.82))] text-primary",
      baseFill: "bg-[linear-gradient(180deg,hsl(170_70%_35%/0.9),hsl(200_54%_18%/0.95))]",
      border: "border-emerald-100/60",
      bowlWidth: "w-14",
      bowlShape: "rounded-t-full rounded-b-lg",
      handles: true,
    };
  }

  if (type === "SuperCup") {
    return {
      fill: "bg-[linear-gradient(135deg,hsl(195_90%_62%/0.92),hsl(210_95%_82%/0.76))] text-accent",
      baseFill: "bg-[linear-gradient(180deg,hsl(198_76%_38%/0.9),hsl(216_48%_18%/0.95))]",
      border: "border-cyan-100/60",
      bowlWidth: "w-10",
      bowlShape: "rounded-full",
      handles: false,
    };
  }

  return {
    fill: "bg-[linear-gradient(135deg,hsl(205_90%_62%/0.92),hsl(220_95%_82%/0.78))] text-accent",
    baseFill: "bg-[linear-gradient(180deg,hsl(205_72%_38%/0.9),hsl(222_44%_18%/0.95))]",
    border: "border-sky-100/60",
    bowlWidth: "w-11",
    bowlShape: "rounded-b-xl rounded-t-sm",
    handles: true,
  };
};

const RankingModalContent = ({
  openModal,
  allScorers,
  allAssisters,
  allByMatches,
  allByGoalContributions,
  top20Buys,
  top20Sales,
}: {
  openModal: ModalType;
  allScorers: PlayerRankingItem[];
  allAssisters: PlayerRankingItem[];
  allByMatches: PlayerRankingItem[];
  allByGoalContributions: PlayerRankingItem[];
  top20Buys: TransferRankingItem[];
  top20Sales: TransferRankingItem[];
}) => {
  const { t } = useTranslation();
  const config = getRankingModalConfig(openModal, t);

  if (!config) return null;

  const isTransferRanking = openModal === "buys" || openModal === "sales";
  const players =
    openModal === "scorers"
      ? allScorers.slice(0, 20)
      : openModal === "assisters"
        ? allAssisters.slice(0, 20)
        : openModal === "matches"
          ? allByMatches.slice(0, 20)
          : openModal === "contributions"
            ? allByGoalContributions.slice(0, 20)
            : [];
  const transfers = openModal === "buys" ? top20Buys : openModal === "sales" ? top20Sales : [];
  const totalEntries = isTransferRanking ? transfers.length : players.length;
  const leadingEntry = isTransferRanking ? transfers[0] : players[0];

  return (
    <div className="relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-32 ${config.glowClass}`} />
      <div className="relative border-b border-border bg-card/95 px-5 py-5">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${toneBgClass[config.tone]} ${toneClass[config.tone]}`}>
              <config.icon size={19} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{config.kicker}</p>
              <DialogTitle className="mt-1 font-display text-2xl leading-none text-foreground">
                {config.title}
              </DialogTitle>
              <p className="mt-2 text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
        </DialogHeader>
      </div>

      {leadingEntry ? (
        <div className="border-b border-border bg-background/30 px-5 py-4">
          {isTransferRanking ? (
            <TransferPodium transfer={leadingEntry as TransferRankingItem} tone={config.tone} />
          ) : (
            <PlayerPodium player={leadingEntry as PlayerRankingItem} tone={config.tone} valueLabel={config.valueLabel} meta={getPlayerMeta(leadingEntry as PlayerRankingItem, openModal, t)} />
          )}
        </div>
      ) : (
        <div className="border-b border-border bg-background/30 px-5 py-4 text-sm text-muted-foreground">
          {t("history.ranking.noRecord")}
        </div>
      )}

      <div className="bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("history.ranking.complete")}</p>
          <span className={`font-display text-sm font-bold ${toneClass[config.tone]}`}>{t("history.ranking.records", { count: totalEntries })}</span>
        </div>

        <ScrollArea className="h-[min(46vh,420px)]" viewportClassName="px-3 py-3 pr-5" scrollbars="vertical">
          <div className="space-y-2">
            {isTransferRanking
              ? transfers.map((transfer, index) => (
                  <TransferRecordRow key={transfer.id} transfer={transfer} index={index} tone={config.tone} />
                ))
              : players.map((player, index) => (
                  <PlayerRecordRow
                    key={player.name}
                    index={index}
                    name={player.name}
                    clubs={player.clubs}
                    meta={getPlayerMeta(player, openModal, t)}
                    rightMeta={getPlayerRightMeta(player, openModal, t)}
                    value={`${player.total} ${config.valueLabel}`}
                    tone={config.tone}
                  />
                ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

const getRankingModalConfig = (openModal: ModalType, t: (key: string) => string) => {
  switch (openModal) {
    case "scorers":
      return {
        title: t("history.ranking.scorers.title"),
        kicker: t("history.ranking.scorers.kicker"),
        description: t("history.ranking.scorers.desc"),
        valueLabel: t("history.ranking.scorers.valueLabel"),
        tone: "primary" as Tone,
        icon: Goal,
        glowClass: "bg-primary/10",
      };
    case "assisters":
      return {
        title: t("history.ranking.assisters.title"),
        kicker: t("history.ranking.assisters.kicker"),
        description: t("history.ranking.assisters.desc"),
        valueLabel: t("history.ranking.assisters.valueLabel"),
        tone: "accent" as Tone,
        icon: Sparkles,
        glowClass: "bg-accent/10",
      };
    case "matches":
      return {
        title: t("history.ranking.matches.title"),
        kicker: t("history.ranking.matches.kicker"),
        description: t("history.ranking.matches.desc"),
        valueLabel: t("history.ranking.matches.valueLabel"),
        tone: "gold" as Tone,
        icon: Shield,
        glowClass: "bg-[hsl(var(--gold)/0.12)]",
      };
    case "contributions":
      return {
        title: t("history.ranking.contributions.title"),
        kicker: t("history.ranking.contributions.kicker"),
        description: t("history.ranking.contributions.desc"),
        valueLabel: t("history.ranking.contributions.valueLabel"),
        tone: "primary" as Tone,
        icon: Medal,
        glowClass: "bg-primary/10",
      };
    case "buys":
      return {
        title: t("history.ranking.buys.title"),
        kicker: t("history.ranking.buys.kicker"),
        description: t("history.ranking.buys.desc"),
        valueLabel: t("history.ranking.buys.valueLabel"),
        tone: "primary" as Tone,
        icon: ArrowDownRight,
        glowClass: "bg-primary/10",
      };
    case "sales":
      return {
        title: t("history.ranking.sales.title"),
        kicker: t("history.ranking.sales.kicker"),
        description: t("history.ranking.sales.desc"),
        valueLabel: t("history.ranking.sales.valueLabel"),
        tone: "accent" as Tone,
        icon: ArrowUpRight,
        glowClass: "bg-accent/10",
      };
    default:
      return null;
  }
};

const getPlayerMeta = (player: PlayerRankingItem, openModal: ModalType, t: (key: string) => string) => {
  if (openModal === "matches" || openModal === "contributions") {
    return `${player.goals ?? 0}G ${player.assists ?? 0}A`;
  }

  return player.matches ? `${player.matches} ${t("history.hallOfFame.matches")}` : undefined;
};

const getPlayerRightMeta = (player: PlayerRankingItem, openModal: ModalType, t: (key: string) => string) => {
  if (openModal === "contributions") {
    return player.matches ? `${player.matches} ${t("history.hallOfFame.matches")}` : undefined;
  }
  return undefined;
};

const PlayerPodium = ({
  player,
  tone,
  valueLabel,
  meta,
}: {
  player: PlayerRankingItem;
  tone: Tone;
  valueLabel: string;
  meta?: string;
}) => (
  <div className={`rounded-lg border p-4 ${toneBgClass[tone]}`}>
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-[hsl(var(--gold)/0.25)] bg-[hsl(var(--gold)/0.1)] px-2 py-1 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--gold))]">
          <Crown size={14} />
          Ranking leader
        </div>
        <p className="truncate font-display text-3xl font-bold leading-none text-foreground">{player.name}</p>
        <p className="mt-2 truncate text-sm text-muted-foreground">{player.clubs.length > 0 ? player.clubs.join(", ") : meta}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`font-display text-5xl font-bold leading-none ${toneClass[tone]}`}>{player.total}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{valueLabel}</p>
      </div>
    </div>
    {player.clubs.length > 0 && meta && <p className="mt-4 text-xs text-muted-foreground">{meta}</p>}
  </div>
);

const TransferPodium = ({ transfer, tone }: { transfer: TransferRankingItem; tone: Tone }) => (
  <div className={`rounded-lg border p-4 ${toneBgClass[tone]}`}>
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-[hsl(var(--gold)/0.25)] bg-[hsl(var(--gold)/0.1)] px-2 py-1 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--gold))]">
          <Crown size={14} />
          Ranking leader
        </div>
        <p className="truncate font-display text-3xl font-bold leading-none text-foreground">{transfer.playerName}</p>
        <p className="mt-2 truncate text-sm text-muted-foreground">{transfer.from} to {transfer.to} · {transfer.season}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`font-display text-3xl font-bold leading-none ${toneClass[tone]}`}>
          {transfer.fee ? formatCurrencyInMillions(m(transfer.fee)) : "Free"}
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">value</p>
      </div>
    </div>
  </div>
);

const HallOfFameCard = ({
  label,
  icon: Icon,
  tone,
  players,
  meta,
  valueLabel,
  onExpand,
}: {
  label: string;
  icon: React.ElementType;
  tone: Tone;
  players: Array<{ name: string; total: number; clubs: string[] }>;
  meta?: string;
  valueLabel: string;
  onExpand: () => void;
}) => {
  const leader = players[0];
  const runners = players.slice(1, 3);

  return (
    <article className={`rounded-lg border p-4 ${toneBgClass[tone]}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={17} className={toneClass[tone]} />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
        <button
          type="button"
          onClick={onExpand}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background/30 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          aria-label={`View ranking: ${label}`}
          title={`View ranking: ${label}`}
        >
          <Plus size={14} />
        </button>
      </div>

      {leader ? (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate font-display text-2xl font-bold leading-none text-foreground">{leader.name}</p>
            <span className={`shrink-0 font-display text-3xl font-bold leading-none ${toneClass[tone]}`}>
              {leader.total}<span className="ml-1 text-sm font-semibold">{valueLabel}</span>
            </span>
          </div>
          <p className="mt-2 min-h-4 truncate text-xs text-muted-foreground">{leader.clubs.length > 0 ? leader.clubs.join(", ") : meta}</p>

          {runners.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-border/50 pt-3">
              {runners.map((player, i) => (
                <div key={player.name} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-4 shrink-0 text-[10px] text-muted-foreground">{i + 2}.</span>
                    <p className="truncate text-xs text-muted-foreground">{player.name}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-bold ${toneClass[tone]}`}>{player.total}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Not enough records.</p>
      )}
    </article>
  );
};

const TransferRecordCard = ({
  title,
  icon: Icon,
  tone,
  transfers,
  empty,
  onExpand,
}: {
  title: string;
  icon: React.ElementType;
  tone: Tone;
  transfers: Array<{ id: string; playerName: string; from: string; to: string; season: string; fee?: number }>;
  empty: string;
  onExpand: () => void;
}) => (
  <div className="card-gamer p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon size={16} className={toneClass[tone]} />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      </div>
      <button
        type="button"
        onClick={onExpand}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background/30 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        aria-label={`View ranking: ${title}`}
        title={`View ranking: ${title}`}
      >
        <Plus size={14} />
      </button>
    </div>

    {transfers.length > 0 ? (
      <div className="space-y-2">
        {transfers.map((transfer, index) => (
          <TransferRecordRow key={transfer.id} transfer={transfer} index={index} tone={tone} />
        ))}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">{empty}</p>
    )}
  </div>
);

const PlayerRecordRow = ({
  index,
  name,
  clubs,
  meta,
  rightMeta,
  value,
  tone,
}: {
  index: number;
  name: string;
  clubs: string[];
  meta?: string;
  rightMeta?: string;
  value: string;
  tone: Tone;
}) => (
  <div className="flex items-center justify-between gap-3 rounded-md p-2 hover:bg-muted/30">
    <div className="flex min-w-0 items-center gap-2">
      <span className="w-6 shrink-0 text-xs text-muted-foreground">{index + 1}.</span>
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-medium">{name}</p>
        <p className="truncate text-[10px] text-muted-foreground">{clubs.length > 0 ? clubs.join(", ") : meta}</p>
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-3">
      {(rightMeta ?? meta) && <span className="hidden text-xs text-muted-foreground sm:inline">{rightMeta ?? meta}</span>}
      <span className={`text-sm font-bold ${toneClass[tone]}`}>{value}</span>
    </div>
  </div>
);

const TransferRecordRow = ({
  transfer,
  index,
  tone,
}: {
  transfer: { playerName: string; from: string; to: string; season: string; fee?: number };
  index: number;
  tone: Tone;
}) => (
  <div className="flex items-center justify-between gap-3 rounded-md p-2 hover:bg-muted/30">
    <div className="flex min-w-0 items-center gap-2">
      <span className="w-6 shrink-0 text-xs text-muted-foreground">{index + 1}.</span>
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-medium">{transfer.playerName}</p>
        <p className="truncate text-[10px] text-muted-foreground">{transfer.from} - {transfer.to} · {transfer.season}</p>
      </div>
    </div>
    <span className={`shrink-0 text-sm font-bold ${toneClass[tone]}`}>
      {transfer.fee ? formatCurrencyInMillions(m(transfer.fee)) : "Free"}
    </span>
  </div>
);

export default HistoryScreen;
