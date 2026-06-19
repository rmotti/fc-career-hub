import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Trophy, Target, TrendingUp, BarChart3, Swords, ChevronRight, ChevronLeft, DollarSign, Star, Loader2, AlertTriangle } from "lucide-react";
import { usePlayers } from "@/features/squad/model/usePlayers";
import { useTeamStats } from "@/features/stats/model/useTeamStats";
import { useTrophies } from "@/features/history/model/useTrophies";
import { useFinancialSnapshot } from "@/features/dashboard/model/useFinancialSnapshot";
import { useEuropeanCompetitions } from "@/features/change-club/model/useCompetitions";
import { CUP_LABELS, formatTrophyLabel, getLeagueStats } from "@/shared/lib/competitions";
import { formatPosition } from "@/shared/lib/playerPositions";
import { formatCurrency, parseBudgetInMillionsInput } from "@/shared/lib/currency";
import { ScrollArea } from "@/shared/ui/scroll-area";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saveId: string;
  currentSeason: string;
  currentClub: string;
  onConfirm: (budget: number, europeanCompetitionId: string | null) => Promise<boolean>;
}

function computeNextSeason(current: string | null | undefined): string | null {
  if (!current || typeof current !== "string") return null;
  const parts = current.split("/");
  if (parts.length !== 2) return null;
  const startYear = parseInt(parts[0], 10);
  if (isNaN(startYear)) return null;
  const nextStart = startYear + 1;
  const nextEnd = (nextStart + 1).toString().slice(-2);
  return `${nextStart}/${nextEnd}`;
}

// English ordinal suffix for the league-position badge (1st, 2nd, 3rd, 4th…).
function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

const NewSeasonModal = ({ open, onOpenChange, saveId, currentSeason, currentClub, onConfirm }: Props) => {
  const { t } = useTranslation();
  // Two steps now: the celebratory season recap, then the new-season setup.
  // The old standalone "confirm" gate was a redundant second recap, so it's
  // folded into the summary (nothing is destructive until the final confirm).
  const [step, setStep] = useState<"summary" | "setup">("summary");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const [nextEuropeanCompetitionId, setNextEuropeanCompetitionId] = useState<string>("none");

  const { data: save } = useFinancialSnapshot(saveId);
  const { data: players = [] } = usePlayers(saveId, true);
  const { data: teamStatsArr = [] } = useTeamStats(saveId, "current");
  const { data: trophies = [] } = useTrophies(saveId);
  const { data: europeanCompetitions = [] } = useEuropeanCompetitions();

  const teamStats = getLeagueStats(teamStatsArr);
  const cupStats = teamStatsArr.filter((item) => item.competition?.type !== "League");
  const wonCups = cupStats.filter((item) => item.cupResult && item.cupResult !== "NaoParticipou");

  const topScorers = [...players].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.goals ?? 0) - ((a.currentSeasonStats || a.totalStats)?.goals ?? 0)).slice(0, 3);
  const topAssisters = [...players].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.assists ?? 0) - ((a.currentSeasonStats || a.totalStats)?.assists ?? 0)).slice(0, 3);
  const totalMatches = teamStats ? teamStats.wins + teamStats.draws + teamStats.losses : 0;

  const nextSeason = computeNextSeason(save?.currentSeason ?? currentSeason);
  const seasonTrophies = trophies.filter((tr) => `${tr.year}/${String(tr.year + 1).slice(-2)}` === currentSeason);
  const displayBudget = save && typeof save.budget === "number" ? formatCurrency(save.budget) : save?.budgetFormatted ?? "—";
  const displayBalance = save && typeof save.balance === "number" ? formatCurrency(save.balance) : save?.balanceFormatted ?? "—";
  const parsedBudget = parseBudgetInMillionsInput(budgetInput);

  const hasTopScorers = topScorers.length > 0 && ((topScorers[0].currentSeasonStats || topScorers[0].totalStats)?.goals ?? 0) > 0;
  const hasTopAssisters = topAssisters.length > 0 && ((topAssisters[0].currentSeasonStats || topAssisters[0].totalStats)?.assists ?? 0) > 0;
  const hasAnyData = Boolean(teamStats) || wonCups.length > 0 || seasonTrophies.length > 0 || !!save?.balance;

  useEffect(() => {
    if (open) {
      setNextEuropeanCompetitionId(save?.europeanCompetitionId ?? "none");
    }
  }, [open, save?.europeanCompetitionId]);

  const resetState = () => {
    setStep("summary");
    setBudgetInput("");
    setBudgetError("");
    setNextEuropeanCompetitionId("none");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  const handleFinish = async () => {
    if (parsedBudget === null) {
      setBudgetError(t("newSeason.budgetError"));
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onConfirm(
        parsedBudget,
        nextEuropeanCompetitionId === "none" ? null : nextEuropeanCompetitionId,
      );

      if (success) {
        resetState();
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardClass = "rounded-lg border border-border bg-muted/40 p-4";
  const sectionTitleClass = "font-display text-sm font-semibold text-foreground";
  const microLabelClass = "text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg overflow-hidden border-border bg-card p-0">
        <ScrollArea className="max-h-[85vh]" viewportClassName="p-6" scrollbars="vertical">
        {step === "summary" ? (
          <>
            <DialogHeader className="space-y-1.5">
              <span className={microLabelClass}>{t("newSeason.summaryEyebrow")}</span>
              <DialogTitle className="font-display text-xl font-bold">
                {t("newSeason.summaryTitle", { season: currentSeason })}
              </DialogTitle>
              <DialogDescription>{currentClub}</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              {/* Trophies — the emotional payoff, surfaced first when present. */}
              {seasonTrophies.length > 0 && (
                <div className="rounded-lg border border-gold/30 bg-gold/5 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Trophy size={16} className="text-gold" />
                    <span className={sectionTitleClass}>{t("newSeason.trophiesWon")}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {seasonTrophies.map((tr) => (
                      <span
                        key={tr.id}
                        className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold"
                      >
                        🏆 {formatTrophyLabel(tr)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!hasAnyData && (
                <p className="rounded-lg border border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
                  {t("newSeason.emptyState")}
                </p>
              )}

              {/* League performance */}
              {teamStats && (
                <div className={cardClass}>
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp size={16} className="text-primary" />
                    <span className={sectionTitleClass}>{t("newSeason.leaguePerformance")}</span>
                    {teamStats.leaguePosition && (
                      <span className="ml-auto rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        {t("newSeason.placeBadge", { place: ordinal(teamStats.leaguePosition) })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-around">
                    <div className="flex gap-5 text-center">
                      <div>
                        <p className="stat-highlight text-lg">{teamStats.wins}</p>
                        <p className={microLabelClass}>{t("newSeason.wins")}</p>
                      </div>
                      <div>
                        <p className="font-display text-lg font-bold text-warning">{teamStats.draws}</p>
                        <p className={microLabelClass}>{t("newSeason.draws")}</p>
                      </div>
                      <div>
                        <p className="font-display text-lg font-bold text-destructive-text">{teamStats.losses}</p>
                        <p className={microLabelClass}>{t("newSeason.losses")}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-lg font-bold text-foreground">{totalMatches}</p>
                      <p className={microLabelClass}>{t("newSeason.games")}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cup competitions */}
              {wonCups.length > 0 && (
                <div className={cardClass}>
                  <div className="mb-3 flex items-center gap-2">
                    <Star size={16} className="text-primary" />
                    <span className={sectionTitleClass}>{t("newSeason.cupCompetitions")}</span>
                  </div>
                  <div className="space-y-2">
                    {wonCups.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.competition?.name ?? "—"}</span>
                        <span className={`font-display font-semibold ${item.cupResult === "Campeao" ? "text-gold" : "text-foreground"}`}>
                          {CUP_LABELS[item.cupResult!] ?? item.cupResult}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals */}
              {teamStats && (
                <div className={cardClass}>
                  <div className="mb-3 flex items-center gap-2">
                    <Swords size={16} className="text-primary" />
                    <span className={sectionTitleClass}>{t("newSeason.goals")}</span>
                  </div>
                  <div className="flex justify-around text-center">
                    <div>
                      <p className="stat-highlight text-2xl">{teamStats.goalsPro}</p>
                      <p className={microLabelClass}>{t("newSeason.scored")}</p>
                    </div>
                    <div>
                      <p className="font-display text-2xl font-bold text-destructive-text">{teamStats.goalsAgainst}</p>
                      <p className={microLabelClass}>{t("newSeason.conceded")}</p>
                    </div>
                    <div>
                      <p className="font-display text-2xl font-bold text-foreground">
                        {teamStats.goalsPro - teamStats.goalsAgainst > 0 ? "+" : ""}
                        {teamStats.goalsPro - teamStats.goalsAgainst}
                      </p>
                      <p className={microLabelClass}>{t("newSeason.goalDifference")}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Finances */}
              {!!save?.balance && (
                <div className={cardClass}>
                  <div className="mb-3 flex items-center gap-2">
                    <DollarSign size={16} className="text-primary" />
                    <span className={sectionTitleClass}>{t("newSeason.finances")}</span>
                  </div>
                  <div className="flex justify-around text-center">
                    <div>
                      <p className="font-display text-lg font-bold text-foreground">{displayBudget}</p>
                      <p className={microLabelClass}>{t("newSeason.budget")}</p>
                    </div>
                    <div>
                      <p className="stat-highlight text-lg">{displayBalance}</p>
                      <p className={microLabelClass}>{t("newSeason.finalBalance")}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Top scorers */}
              {hasTopScorers && (
                <div className={cardClass}>
                  <div className="mb-3 flex items-center gap-2">
                    <Target size={16} className="text-primary" />
                    <span className={sectionTitleClass}>{t("newSeason.topScorers")}</span>
                  </div>
                  <div className="space-y-2">
                    {topScorers.filter((p) => ((p.currentSeasonStats || p.totalStats)?.goals ?? 0) > 0).map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                          <span className="text-sm font-medium">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{formatPosition(p.position)}</span>
                        </div>
                        <span className="font-display font-bold text-primary">
                          {t("newSeason.goalsCount", { count: (p.currentSeasonStats || p.totalStats)?.goals ?? 0 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top assisters */}
              {hasTopAssisters && (
                <div className={cardClass}>
                  <div className="mb-3 flex items-center gap-2">
                    <BarChart3 size={16} className="text-primary" />
                    <span className={sectionTitleClass}>{t("newSeason.topAssisters")}</span>
                  </div>
                  <div className="space-y-2">
                    {topAssisters.filter((p) => ((p.currentSeasonStats || p.totalStats)?.assists ?? 0) > 0).map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                          <span className="text-sm font-medium">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{formatPosition(p.position)}</span>
                        </div>
                        <span className="font-display font-bold text-primary">
                          {t("newSeason.assistsCount", { count: (p.currentSeasonStats || p.totalStats)?.assists ?? 0 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Consequence note + primary CTA, kept together so the destructive
                side of advancing is read right before the action. */}
            <div className="mt-5 space-y-3">
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-warning" />
                <span>{t("newSeason.resetNote")}</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("setup")}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <span>{t("newSeason.startNewSeason")}</span>
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => handleClose(false)}
                  className="rounded-md bg-muted px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("newSeason.cancel")}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="font-display text-lg">
                {nextSeason ? t("newSeason.setupTitle", { season: nextSeason }) : t("newSeason.title")}
              </DialogTitle>
              <DialogDescription>{t("newSeason.setupSubtitle")}</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className={cardClass}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("newSeason.season")}</span>
                  {nextSeason
                    ? <span className="font-display font-bold text-primary">{nextSeason}</span>
                    : <span className="text-xs text-destructive-text">{t("newSeason.invalidSeason")}</span>}
                </div>
              </div>

              <div>
                <label className={`mb-1 block ${microLabelClass}`}>{t("newSeason.seasonBudget")}</label>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    className="h-9 w-full rounded-md border border-border bg-background/50 px-3 pr-10 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                    value={budgetInput}
                    onChange={(e) => {
                      setBudgetInput(e.target.value);
                      if (budgetError) setBudgetError("");
                    }}
                    onBlur={() => {
                      if (!budgetInput.trim()) return;
                      if (parsedBudget === null) setBudgetError(t("newSeason.budgetError"));
                    }}
                    placeholder="85"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">M€</span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{t("newSeason.budgetHint")}</p>
                {budgetError && <p className="mt-1.5 text-xs font-medium text-destructive-text">{budgetError}</p>}
              </div>

              <div>
                <label className={`mb-1 block ${microLabelClass}`}>{t("newSeason.europeanCompetition")}</label>
                <select
                  className="h-9 w-full rounded-md border border-border bg-background/50 px-3 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                  value={nextEuropeanCompetitionId}
                  onChange={(e) => setNextEuropeanCompetitionId(e.target.value)}
                >
                  <option value="none">{t("newSeason.none")}</option>
                  {europeanCompetitions.map((competition) => (
                    <option key={competition.id} value={competition.id}>{competition.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setStep("summary")}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-md bg-muted px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                {t("newSeason.back")}
              </button>
              <button
                onClick={handleFinish}
                disabled={!budgetInput.trim() || parsedBudget === null || !nextSeason || isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <span>{t("newSeason.finish")}</span>}
              </button>
            </div>
          </>
        )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default NewSeasonModal;
