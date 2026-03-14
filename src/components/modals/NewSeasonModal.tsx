import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trophy, Target, TrendingUp, BarChart3, Swords, ChevronRight } from "lucide-react";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeamStats } from "@/hooks/useTeamStats";
import { useTrophies } from "@/hooks/useTrophies";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saveId: string;
  currentSeason: string;
  currentClub: string;
  onConfirm: () => void;
}

const NewSeasonModal = ({ open, onOpenChange, saveId, currentSeason, currentClub, onConfirm }: Props) => {
  const [step, setStep] = useState<"confirm" | "overview">("confirm");

  const { data: players = [] } = usePlayers(saveId, true);
  const { data: teamStatsArr = [] } = useTeamStats(saveId, "current");
  const { data: trophies = [] } = useTrophies(saveId);

  const teamStats = teamStatsArr[0];

  const topScorers = [...players].sort((a, b) => (b.seasonStats?.goals ?? 0) - (a.seasonStats?.goals ?? 0)).slice(0, 3);
  const topAssisters = [...players].sort((a, b) => (b.seasonStats?.assists ?? 0) - (a.seasonStats?.assists ?? 0)).slice(0, 3);
  const totalMatches = teamStats ? teamStats.wins + teamStats.draws + teamStats.losses : 0;

  // Extract current year from currentSeason (e.g. "2026/27" -> 2026)
  const currentYear = parseInt(currentSeason.split("/")[0]) || 0;
  const seasonTrophies = trophies.filter((t) => t.year === currentYear);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep("confirm");
    }
    onOpenChange(isOpen);
  };

  const handleConfirm = () => {
    setStep("overview");
  };

  const handleFinish = () => {
    onConfirm();
    setStep("confirm");
    onOpenChange(false);
  };

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
              {topScorers.length > 0 && (topScorers[0].seasonStats?.goals ?? 0) > 0 && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={16} className="text-primary" />
                    <span className="font-display font-semibold text-sm">Artilheiros</span>
                  </div>
                  <div className="space-y-2">
                    {topScorers.filter((p) => (p.seasonStats?.goals ?? 0) > 0).map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                          }`}>{i + 1}</span>
                          <span className="text-sm font-medium">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{p.position}</span>
                        </div>
                        <span className="font-display font-bold text-primary">{p.seasonStats?.goals} gols</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top assisters */}
              {topAssisters.length > 0 && (topAssisters[0].seasonStats?.assists ?? 0) > 0 && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 size={16} className="text-primary" />
                    <span className="font-display font-semibold text-sm">Garçons</span>
                  </div>
                  <div className="space-y-2">
                    {topAssisters.filter((p) => (p.seasonStats?.assists ?? 0) > 0).map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                          }`}>{i + 1}</span>
                          <span className="text-sm font-medium">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{p.position}</span>
                        </div>
                        <span className="font-display font-bold text-primary">{p.seasonStats?.assists} assist.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Next season button */}
            <div className="pt-2">
              <button
                onClick={handleFinish}
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
