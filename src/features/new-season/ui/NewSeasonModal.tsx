import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Trophy, Target, TrendingUp, BarChart3, Swords, ChevronRight, DollarSign, Star, Loader2 } from "lucide-react";
import { usePlayers } from "@/features/squad/model/usePlayers";
import { useTeamStats } from "@/features/stats/model/useTeamStats";
import { useTrophies } from "@/features/history/model/useTrophies";
import { useFinancialSnapshot } from "@/features/dashboard/model/useFinancialSnapshot";
import { useEuropeanCompetitions } from "@/features/change-club/model/useCompetitions";
import { CUP_LABELS, formatTrophyLabel, getLeagueStats } from "@/shared/lib/competitions";
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

const NewSeasonModal = ({ open, onOpenChange, saveId, currentSeason, currentClub, onConfirm }: Props) => {
  const [step, setStep] = useState<"confirm" | "overview" | "budget">("confirm");
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

  const topScorers = [...players].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.goals ?? 0) - ((a.currentSeasonStats || a.totalStats)?.goals ?? 0)).slice(0, 3);
  const topAssisters = [...players].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.assists ?? 0) - ((a.currentSeasonStats || a.totalStats)?.assists ?? 0)).slice(0, 3);
  const totalMatches = teamStats ? teamStats.wins + teamStats.draws + teamStats.losses : 0;

  const nextSeason = computeNextSeason(save?.currentSeason ?? currentSeason);
  const seasonTrophies = trophies.filter((t) => `${t.year}/${String(t.year + 1).slice(-2)}` === currentSeason);
  const displayBudget = save && typeof save.budget === "number" ? formatCurrency(save.budget) : save?.budgetFormatted ?? "—";
  const displayBalance = save && typeof save.balance === "number" ? formatCurrency(save.balance) : save?.balanceFormatted ?? "—";
  const parsedBudget = parseBudgetInMillionsInput(budgetInput);

  useEffect(() => {
    if (open) {
      setNextEuropeanCompetitionId(save?.europeanCompetitionId ?? "none");
    }
  }, [open, save?.europeanCompetitionId]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep("confirm");
      setBudgetInput("");
      setBudgetError("");
      setNextEuropeanCompetitionId("none");
    }
    onOpenChange(isOpen);
  };

  const handleConfirm = () => {
    setStep("overview");
  };

  const handleFinish = async () => {
    if (parsedBudget === null) {
      setBudgetError("Enter a valid value in millions. E.g.: 150 = 150M.");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onConfirm(
        parsedBudget,
        nextEuropeanCompetitionId === "none" ? null : nextEuropeanCompetitionId
      );

      if (success) {
        setStep("confirm");
        setBudgetInput("");
        setBudgetError("");
        setNextEuropeanCompetitionId("none");
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "text-xs text-muted-foreground uppercase mb-1 block";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-hidden p-0">
        <ScrollArea className="max-h-[85vh]" viewportClassName="p-6" scrollbars="vertical">
        {step === "confirm" ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-lg">End Season</DialogTitle>
              <DialogDescription>
                Are you sure you want to end season <strong>{currentSeason}</strong>?
                Season statistics will be reset.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 my-2">
              {teamStats && (
                <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-2">
                  {teamStats.leaguePosition && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">League position</span>
                      <span className="font-display font-bold text-primary">{teamStats.leaguePosition}º</span>
                    </div>
                  )}
                  {cupStats
                    .filter((item) => item.cupResult && item.cupResult !== "NaoParticipou")
                    .map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.competition?.name ?? "Competition"}</span>
                        <span className="font-display font-semibold">{CUP_LABELS[item.cupResult!] ?? item.cupResult}</span>
                      </div>
                    ))}
                  {!!save?.balance && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Final balance</span>
                      <span className="font-display font-bold">{displayBalance}</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground italic">
                ℹ️ If you finish 1st in the league or win a cup, trophies will be added automatically.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirm}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Confirm
              </button>
              <button
                onClick={() => handleClose(false)}
                className="bg-muted text-muted-foreground px-5 py-2 rounded-md text-sm hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : step === "budget" ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-lg">New Season</DialogTitle>
              <DialogDescription>Set the budget for the next season.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Season</span>
                  {nextSeason
                    ? <span className="font-display font-bold text-primary">{nextSeason}</span>
                    : <span className="text-destructive text-xs">Invalid current season.</span>
                  }
                </div>
              </div>

              <div>
                <label className={labelClass}>Season budget</label>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    className={inputClass}
                    value={budgetInput}
                    onChange={(e) => {
                      setBudgetInput(e.target.value);
                      if (budgetError) setBudgetError("");
                    }}
                    onBlur={() => {
                      if (!budgetInput.trim()) return;
                      if (parsedBudget === null) {
                        setBudgetError("Enter a valid value in millions. E.g.: 150 = 150M.");
                      }
                    }}
                    placeholder="85"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">M€</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Enter the value in millions. E.g.: `150` = `150M`.</p>
                {budgetError && <p className="text-xs text-destructive mt-1.5 font-medium">{budgetError}</p>}
              </div>
              <div>
                <label className={labelClass}>European competition</label>
                <select
                  className={inputClass}
                  value={nextEuropeanCompetitionId}
                  onChange={(e) => setNextEuropeanCompetitionId(e.target.value)}
                >
                  <option value="none">None</option>
                  {europeanCompetitions.map((competition) => (
                    <option key={competition.id} value={competition.id}>{competition.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleFinish}
                disabled={!budgetInput.trim() || parsedBudget === null || !nextSeason || isSubmitting}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><span>Confirm</span><ChevronRight size={16} /></>}
              </button>
              <button
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
                className="bg-muted text-muted-foreground px-5 py-2 rounded-md text-sm hover:text-foreground transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-center">
                📋 Season Summary {currentSeason}
              </DialogTitle>
              <DialogDescription className="text-center">
                {currentClub} — Season ended
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* League position & record */}
              {teamStats && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={16} className="text-primary" />
                    <span className="font-display font-semibold text-sm">League performance</span>
                    {teamStats.leaguePosition && (
                      <span className="ml-auto bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">
                        {teamStats.leaguePosition}th place
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-around">
                    <div className="flex gap-4 text-center">
                      <div>
                        <p className="text-lg font-display font-bold text-primary">{teamStats.wins}</p>
                        <p className="text-xs text-muted-foreground">W</p>
                      </div>
                      <div>
                        <p className="text-lg font-display font-bold text-warning">{teamStats.draws}</p>
                        <p className="text-xs text-muted-foreground">D</p>
                      </div>
                      <div>
                        <p className="text-lg font-display font-bold text-destructive">{teamStats.losses}</p>
                        <p className="text-xs text-muted-foreground">L</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-display font-bold text-foreground">{totalMatches}</p>
                      <p className="text-xs text-muted-foreground">Games</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cup results */}
              {cupStats.some((item) => item.cupResult && item.cupResult !== "NaoParticipou") && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={16} className="text-primary" />
                    <span className="font-display font-semibold text-sm">Cup competitions</span>
                  </div>
                  <div className="space-y-2">
                    {cupStats
                      .filter((item) => item.cupResult && item.cupResult !== "NaoParticipou")
                      .map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{item.competition?.name ?? "Competition"}</span>
                          <span className={`font-display font-semibold ${item.cupResult === "Campeao" ? "text-yellow-500" : ""}`}>
                            {CUP_LABELS[item.cupResult!] ?? item.cupResult}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Balance */}
              {!!save?.balance && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={16} className="text-primary" />
                    <span className="font-display font-semibold text-sm">Finances</span>
                  </div>
                  <div className="flex justify-around text-center">
                    <div>
                      <p className="text-lg font-display font-bold text-foreground">{displayBudget}</p>
                      <p className="text-xs text-muted-foreground">Budget</p>
                    </div>
                    <div>
                      <p className="text-lg font-display font-bold text-primary">{displayBalance}</p>
                      <p className="text-xs text-muted-foreground">Final balance</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Goals */}
              {teamStats && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Swords size={16} className="text-primary" />
                    <span className="font-display font-semibold text-sm">Goals</span>
                  </div>
                  <div className="flex justify-around text-center">
                    <div>
                      <p className="text-2xl font-display font-bold text-primary">{teamStats.goalsPro}</p>
                      <p className="text-xs text-muted-foreground">Scored</p>
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold text-destructive">{teamStats.goalsAgainst}</p>
                      <p className="text-xs text-muted-foreground">Conceded</p>
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold text-foreground">
                        {teamStats.goalsPro - teamStats.goalsAgainst > 0 ? "+" : ""}
                        {teamStats.goalsPro - teamStats.goalsAgainst}
                      </p>
                      <p className="text-xs text-muted-foreground">GD</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Trophies */}
              {seasonTrophies.length > 0 && (
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy size={16} className="text-yellow-500" />
                    <span className="font-display font-semibold text-sm">Titles Won</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {seasonTrophies.map((t) => (
                      <span
                        key={t.id}
                        className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        🏆 {formatTrophyLabel(t)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Top scorers */}
              {topScorers.length > 0 && ((topScorers[0].currentSeasonStats || topScorers[0].totalStats)?.goals ?? 0) > 0 && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={16} className="text-primary" />
                    <span className="font-display font-semibold text-sm">Top Scorers</span>
                  </div>
                  <div className="space-y-2">
                    {topScorers.filter((p) => ((p.currentSeasonStats || p.totalStats)?.goals ?? 0) > 0).map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                          }`}>{i + 1}</span>
                          <span className="text-sm font-medium">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{p.position}</span>
                        </div>
                        <span className="font-display font-bold text-primary">{(p.currentSeasonStats || p.totalStats)?.goals} goals</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top assisters */}
              {topAssisters.length > 0 && ((topAssisters[0].currentSeasonStats || topAssisters[0].totalStats)?.assists ?? 0) > 0 && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 size={16} className="text-primary" />
                    <span className="font-display font-semibold text-sm">Top Assisters</span>
                  </div>
                  <div className="space-y-2">
                    {topAssisters.filter((p) => ((p.currentSeasonStats || p.totalStats)?.assists ?? 0) > 0).map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                          }`}>{i + 1}</span>
                          <span className="text-sm font-medium">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{p.position}</span>
                        </div>
                        <span className="font-display font-bold text-primary">{(p.currentSeasonStats || p.totalStats)?.assists} ast.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Next season button */}
            <div className="pt-2">
              <button
                onClick={() => setStep("budget")}
                className="w-full bg-primary text-primary-foreground px-5 py-3 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <span>Start New Season</span>
                <ChevronRight size={16} />
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
