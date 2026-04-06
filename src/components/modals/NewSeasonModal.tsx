import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trophy, Target, TrendingUp, BarChart3, Swords, ChevronRight, DollarSign, Star } from "lucide-react";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeamStats } from "@/hooks/useTeamStats";
import { useTrophies } from "@/hooks/useTrophies";
import { useSave } from "@/hooks/useSaves";

const CUP_LABELS: Record<string, string> = {
  NaoParticipou: "Não participou",
  Eliminado: "Fase de grupos / 1ª fase",
  OitavasOuFaseDeGrupos: "Oitavas de final",
  Quartas: "Quartas de final",
  Semifinal: "Semifinal",
  Final: "Final",
  Campeao: "🏆 Campeão",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saveId: string;
  currentSeason: string;
  currentClub: string;
  onConfirm: (budget: number) => Promise<boolean>;
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
  const [budgetInput, setBudgetInput] = useState("");

  const { data: save } = useSave(saveId);
  const { data: players = [] } = usePlayers(saveId, true);
  const { data: teamStatsArr = [] } = useTeamStats(saveId, "current");
  const { data: trophies = [] } = useTrophies(saveId);

  const teamStats = teamStatsArr[0];

  const topScorers = [...players].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.goals ?? 0) - ((a.currentSeasonStats || a.totalStats)?.goals ?? 0)).slice(0, 3);
  const topAssisters = [...players].sort((a, b) => ((b.currentSeasonStats || b.totalStats)?.assists ?? 0) - ((a.currentSeasonStats || a.totalStats)?.assists ?? 0)).slice(0, 3);
  const totalMatches = teamStats ? teamStats.wins + teamStats.draws + teamStats.losses : 0;

  const nextSeason = computeNextSeason(save?.currentSeason ?? currentSeason);
  const seasonTrophies = trophies.filter((t) => t.name.endsWith(currentSeason));

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep("confirm");
      setBudgetInput("");
    }
    onOpenChange(isOpen);
  };

  const handleConfirm = () => {
    setStep("overview");
  };

  const handleFinish = async () => {
    const budget = parseFloat(budgetInput);
    const success = await onConfirm(budget);

    if (success) {
      setStep("confirm");
      setBudgetInput("");
      onOpenChange(false);
    }
  };

  const inputClass = "w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "text-xs text-muted-foreground uppercase mb-1 block";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        {step === "confirm" ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-lg">Encerrar Temporada</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja encerrar a temporada <strong>{currentSeason}</strong>?
                As estatísticas da temporada serão resetadas.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 my-2">
              {teamStats && (
                <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-2">
                  {teamStats.leaguePosition && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Posição na liga</span>
                      <span className="font-display font-bold text-primary">{teamStats.leaguePosition}º</span>
                    </div>
                  )}
                  {teamStats.europeanCupResult && teamStats.europeanCupResult !== "NaoParticipou" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Copa Europeia</span>
                      <span className="font-display font-semibold">{CUP_LABELS[teamStats.europeanCupResult] ?? teamStats.europeanCupResult}</span>
                    </div>
                  )}
                  {teamStats.nationalCupResult && teamStats.nationalCupResult !== "NaoParticipou" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Copa Nacional</span>
                      <span className="font-display font-semibold">{CUP_LABELS[teamStats.nationalCupResult] ?? teamStats.nationalCupResult}</span>
                    </div>
                  )}
                  {save?.balance && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Saldo final</span>
                      <span className="font-display font-bold">{save.balance}</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground italic">
                ℹ️ Se você estiver em 1º lugar na liga ou tiver conquistado alguma copa, os troféus serão adicionados automaticamente.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirm}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Confirmar
              </button>
              <button
                onClick={() => handleClose(false)}
                className="bg-muted text-muted-foreground px-5 py-2 rounded-md text-sm hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            </div>
          </>
        ) : step === "budget" ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-lg">Nova Temporada</DialogTitle>
              <DialogDescription>Defina o orçamento para a próxima temporada.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Temporada</span>
                  {nextSeason
                    ? <span className="font-display font-bold text-primary">{nextSeason}</span>
                    : <span className="text-destructive text-xs">Temporada atual inválida.</span>
                  }
                </div>
              </div>

              <div>
                <label className={labelClass}>Orçamento da temporada</label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min={0}
                    autoFocus
                    className={inputClass}
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    placeholder="85"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">M€</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleFinish}
                disabled={!budgetInput || !nextSeason}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Confirmar</span>
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => handleClose(false)}
                className="bg-muted text-muted-foreground px-5 py-2 rounded-md text-sm hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-center">
                📋 Resumo da Temporada {currentSeason}
              </DialogTitle>
              <DialogDescription className="text-center">
                {currentClub} — Temporada encerrada
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* League position & record */}
              {teamStats && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={16} className="text-primary" />
                    <span className="font-display font-semibold text-sm">Desempenho na Liga</span>
                    {teamStats.leaguePosition && (
                      <span className="ml-auto bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">
                        {teamStats.leaguePosition}º lugar
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-around">
                    <div className="flex gap-4 text-center">
                      <div>
                        <p className="text-lg font-display font-bold text-primary">{teamStats.wins}</p>
                        <p className="text-xs text-muted-foreground">V</p>
                      </div>
                      <div>
                        <p className="text-lg font-display font-bold text-warning">{teamStats.draws}</p>
                        <p className="text-xs text-muted-foreground">E</p>
                      </div>
                      <div>
                        <p className="text-lg font-display font-bold text-destructive">{teamStats.losses}</p>
                        <p className="text-xs text-muted-foreground">D</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-display font-bold text-foreground">{totalMatches}</p>
                      <p className="text-xs text-muted-foreground">Jogos</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cup results */}
              {teamStats && (teamStats.europeanCupResult !== "NaoParticipou" || teamStats.nationalCupResult !== "NaoParticipou") && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={16} className="text-primary" />
                    <span className="font-display font-semibold text-sm">Competições de Copa</span>
                  </div>
                  <div className="space-y-2">
                    {teamStats.europeanCupResult && teamStats.europeanCupResult !== "NaoParticipou" && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Copa Europeia</span>
                        <span className={`font-display font-semibold ${teamStats.europeanCupResult === "Campeao" ? "text-yellow-500" : ""}`}>
                          {CUP_LABELS[teamStats.europeanCupResult] ?? teamStats.europeanCupResult}
                        </span>
                      </div>
                    )}
                    {teamStats.nationalCupResult && teamStats.nationalCupResult !== "NaoParticipou" && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Copa Nacional</span>
                        <span className={`font-display font-semibold ${teamStats.nationalCupResult === "Campeao" ? "text-yellow-500" : ""}`}>
                          {CUP_LABELS[teamStats.nationalCupResult] ?? teamStats.nationalCupResult}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Balance */}
              {save?.balance && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={16} className="text-primary" />
                    <span className="font-display font-semibold text-sm">Financeiro</span>
                  </div>
                  <div className="flex justify-around text-center">
                    <div>
                      <p className="text-lg font-display font-bold text-foreground">{save.budget}</p>
                      <p className="text-xs text-muted-foreground">Orçamento</p>
                    </div>
                    <div>
                      <p className="text-lg font-display font-bold text-primary">{save.balance}</p>
                      <p className="text-xs text-muted-foreground">Saldo final</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Goals */}
              {teamStats && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Swords size={16} className="text-primary" />
                    <span className="font-display font-semibold text-sm">Gols</span>
                  </div>
                  <div className="flex justify-around text-center">
                    <div>
                      <p className="text-2xl font-display font-bold text-primary">{teamStats.goalsPro}</p>
                      <p className="text-xs text-muted-foreground">Marcados</p>
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold text-destructive">{teamStats.goalsAgainst}</p>
                      <p className="text-xs text-muted-foreground">Sofridos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold text-foreground">
                        {teamStats.goalsPro - teamStats.goalsAgainst > 0 ? "+" : ""}
                        {teamStats.goalsPro - teamStats.goalsAgainst}
                      </p>
                      <p className="text-xs text-muted-foreground">Saldo</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Trophies */}
              {seasonTrophies.length > 0 && (
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy size={16} className="text-yellow-500" />
                    <span className="font-display font-semibold text-sm">Títulos Conquistados</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {seasonTrophies.map((t) => (
                      <span
                        key={t.id}
                        className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        🏆 {t.name}
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
                    <span className="font-display font-semibold text-sm">Artilheiros</span>
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
                        <span className="font-display font-bold text-primary">{(p.currentSeasonStats || p.totalStats)?.goals} gols</span>
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
                    <span className="font-display font-semibold text-sm">Garçons</span>
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
                        <span className="font-display font-bold text-primary">{(p.currentSeasonStats || p.totalStats)?.assists} assist.</span>
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
                <span>Iniciar Nova Temporada</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewSeasonModal;
