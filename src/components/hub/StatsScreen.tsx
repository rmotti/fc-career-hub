import { useMemo, useState } from "react";
import { Target, ShieldAlert, ShieldCheck, Pencil, Loader2, Trophy, Minus, X, CheckCircle, Plus, Users } from "lucide-react";
import StatCard from "./StatCard";
import StatsModal from "@/components/modals/StatsModal";
import { usePlayers } from "@/hooks/usePlayers";
import { useTeamStats, useUpdateTeamStats } from "@/hooks/useTeamStats";
import { toast } from "sonner";
import type { ApiPlayer, ApiTeamStats } from "@/services/api";
import { CUP_LABELS, getAggregateTeamStats, groupTeamStatsBySeason } from "@/utils/competitions";
import Flag from "react-world-flags";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  saveId: string;
  selectedSeason?: string;
  currentSeason?: string;
}

type PlayerStatModalKey = "goals" | "assists" | "cleanSheets" | "matches" | "goalContributions" | null;

interface PlayerRankingCardProps {
  title: string;
  colorClass: string;
  icon: typeof Target;
  players: ApiPlayer[];
  onOpenAll: () => void;
  getValue: (player: ApiPlayer) => number;
  formatValue?: (value: number) => string;
  emptyLabel?: string;
}

const PlayerRankingCard = ({
  title,
  colorClass,
  icon: Icon,
  players,
  onOpenAll,
  getValue,
  formatValue = (value) => String(value),
  emptyLabel = "—",
}: PlayerRankingCardProps) => {
  const visiblePlayers = players.slice(0, 5);

  return (
    <div className="card-gamer p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold flex items-center gap-2">
            <Icon size={16} className={colorClass} /> {title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {players.length > 0 ? `${players.length} jogador${players.length === 1 ? "" : "es"} com estatística registrada` : emptyLabel}
          </p>
        </div>
        {players.length > 0 && (
          <button
            type="button"
            onClick={onOpenAll}
            className="w-6 h-6 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Mostrar todos"
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {visiblePlayers.map((p, i) => (
          <div key={p.id} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
              <span className="text-sm">{p.name}</span>
            </div>
            <span className={`font-display font-bold ${colorClass}`}>{formatValue(getValue(p))}</span>
          </div>
        ))}
        {players.length === 0 && <p className="text-sm text-muted-foreground">{emptyLabel}</p>}
      </div>
    </div>
  );
};

const StatsScreen = ({ saveId, selectedSeason, currentSeason }: Props) => {
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<ApiTeamStats | null>(null);
  const [playerStatModal, setPlayerStatModal] = useState<PlayerStatModalKey>(null);

  const isPastSeason = !!(selectedSeason && currentSeason && selectedSeason !== currentSeason);
  const statsSeason = selectedSeason || currentSeason;

  const { data: squad = [], isLoading: isLoadingPlayers } = usePlayers(saveId, true, statsSeason);
  const { data: teamStatsData = [], isLoading: isLoadingTeamStats } = useTeamStats(saveId, statsSeason);
  const updateTeamStats = useUpdateTeamStats();

  const teamStats = getAggregateTeamStats(teamStatsData);
  const groupedStats = groupTeamStatsBySeason(teamStatsData);
  const displayStats = teamStats ?? {
    wins: 0, draws: 0, losses: 0, goalsPro: 0, goalsAgainst: 0
  };

  const CLEAN_SHEETS_POSITIONS = new Set(["GOL", "ZAG", "LD", "LE", "VOL"]);
  const getStatValue = (player: ApiPlayer, stat: "goals" | "assists" | "cleanSheets" | "matches" | "goalContributions") =>
    (player.currentSeasonStats || player.totalStats)?.[stat] ?? 0;

  const positiveStatPlayers = useMemo(() => ({
    goals: [...squad]
      .filter((player) => getStatValue(player, "goals") > 0)
      .sort((a, b) => getStatValue(b, "goals") - getStatValue(a, "goals")),
    assists: [...squad]
      .filter((player) => getStatValue(player, "assists") > 0)
      .sort((a, b) => getStatValue(b, "assists") - getStatValue(a, "assists")),
    cleanSheets: [...squad]
      .filter((player) => CLEAN_SHEETS_POSITIONS.has(player.position) && getStatValue(player, "cleanSheets") > 0)
      .sort((a, b) => getStatValue(b, "cleanSheets") - getStatValue(a, "cleanSheets")),
    matches: [...squad]
      .filter((player) => getStatValue(player, "matches") > 0)
      .sort((a, b) => getStatValue(b, "matches") - getStatValue(a, "matches")),
    goalContributions: [...squad]
      .filter((player) => getStatValue(player, "goalContributions") > 0)
      .sort((a, b) => getStatValue(b, "goalContributions") - getStatValue(a, "goalContributions")),
  }), [squad]);

  const playerStatModalMeta: Record<Exclude<PlayerStatModalKey, null>, { title: string; players: ApiPlayer[]; colorClass: string; getValue: (player: ApiPlayer) => number; formatValue?: (value: number) => string; }> = {
    goals: {
      title: "Todos os Artilheiros",
      players: positiveStatPlayers.goals,
      colorClass: "text-primary",
      getValue: (player) => getStatValue(player, "goals"),
      formatValue: (value) => `${value} gols`,
    },
    assists: {
      title: "Todos os Assistentes",
      players: positiveStatPlayers.assists,
      colorClass: "text-accent",
      getValue: (player) => getStatValue(player, "assists"),
      formatValue: (value) => `${value} assist.`,
    },
    cleanSheets: {
      title: "Todos os Clean Sheets",
      players: positiveStatPlayers.cleanSheets,
      colorClass: "text-accent",
      getValue: (player) => getStatValue(player, "cleanSheets"),
      formatValue: (value) => `${value} CS`,
    },
    matches: {
      title: "Todos com Partidas",
      players: positiveStatPlayers.matches,
      colorClass: "text-primary",
      getValue: (player) => getStatValue(player, "matches"),
      formatValue: (value) => `${value} partidas`,
    },
    goalContributions: {
      title: "Todas as Participações em Gol",
      players: positiveStatPlayers.goalContributions,
      colorClass: "text-accent",
      getValue: (player) => getStatValue(player, "goalContributions"),
      formatValue: (value) => `${value} part.`,
    },
  };

  const handleUpdateStats = async (stats: any) => {
    if (!selectedStat) {
      toast.error("Nenhuma estatística ativa encontrada para editar.");
      return;
    }
    await updateTeamStats.mutateAsync({
      saveId,
      statsId: selectedStat.id,
      data: selectedStat.competition.type === "League"
        ? {
            goalsPro: stats.goalsPro,
            goalsAgainst: stats.goalsAgainst,
            wins: stats.wins,
            draws: stats.draws,
            losses: stats.losses,
            leaguePosition: stats.leaguePosition,
          }
        : {
            goalsPro: stats.goalsPro,
            goalsAgainst: stats.goalsAgainst,
            wins: stats.wins,
            draws: stats.draws,
            losses: stats.losses,
            cupResult: stats.cupResult,
          },
    });
    toast.success("Estatísticas atualizadas!", { duration: 3000 });
    setStatsModalOpen(false);
    setSelectedStat(null);
  };

  if (isLoadingPlayers || isLoadingTeamStats) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" /> Carregando estatísticas...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {isPastSeason && (
        <div className="px-4 py-2 rounded-md bg-muted border border-border text-sm text-muted-foreground flex items-center gap-2">
          📅 Visualizando temporada {selectedSeason} — modo somente leitura
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">
            Estatísticas da Temporada
          </h1>
          <p className="text-muted-foreground mt-1">Estatísticas do time e destaques individuais</p>
        </div>
      </div>

      {/* Seção de Estatísticas do Time */}
      <div className="card-gamer p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 transition-transform duration-500 group-hover:scale-110" />
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Desempenho do Time
          </h2>
          <span className="text-sm text-muted-foreground">
            {statsSeason ? `Temporada ${statsSeason}` : "Sem temporada selecionada"}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Vitórias" value={displayStats.wins} icon={CheckCircle} />
          <StatCard label="Empates" value={displayStats.draws} icon={Minus} />
          <StatCard label="Derrotas" value={displayStats.losses} icon={X} accent />
          <StatCard label="Gols Pró" value={displayStats.goalsPro} icon={Target} />
          <StatCard label="Gols Contra" value={displayStats.goalsAgainst} icon={ShieldAlert} accent />
        </div>
      </div>

      <div className="space-y-4">
        {groupedStats.map((group) => (
          <div key={group.season} className="card-gamer p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-display text-lg font-bold">Competições de {group.season}</h3>
                <p className="text-sm text-muted-foreground">Uma linha por competição cadastrada na temporada.</p>
              </div>
            </div>

            <div className="space-y-3">
              {group.stats.map((stat) => {
                const isLeague = stat.competition.type === "League";
                const matches = stat.wins + stat.draws + stat.losses;

                return (
                  <div key={stat.id} className="rounded-xl border border-border bg-muted/25 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-display text-base font-bold">{stat.competition.name}</p>
                          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                            {stat.competition.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isLeague
                            ? `Posição: ${stat.leaguePosition ? `${stat.leaguePosition}º lugar` : "não informada"}`
                            : `Resultado: ${stat.cupResult ? (CUP_LABELS[stat.cupResult] ?? stat.cupResult) : "não informado"}`}
                        </p>
                      </div>

                      {!isPastSeason && (
                        <button
                          onClick={() => {
                            setSelectedStat(stat);
                            setStatsModalOpen(true);
                          }}
                          className="btn-gamer-secondary px-3 py-1.5 text-sm flex items-center gap-2 self-start"
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Editar</span>
                        </button>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
                      <StatCard label="Vitórias" value={stat.wins} icon={CheckCircle} />
                      <StatCard label="Empates" value={stat.draws} icon={Minus} />
                      <StatCard label="Derrotas" value={stat.losses} icon={X} accent />
                      <StatCard label="Gols Pró" value={stat.goalsPro} icon={Target} />
                      <StatCard label="Gols Contra" value={stat.goalsAgainst} icon={ShieldAlert} accent />
                      <StatCard label="Jogos" value={matches} icon={Trophy} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-primary/8 via-background to-accent/8 px-5 py-4">
        <div className="absolute inset-y-0 left-0 w-1 rounded-full bg-primary/70" />
        <div className="ml-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users size={18} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Estatísticas dos Jogadores</h2>
            <p className="text-sm text-muted-foreground">Rankings individuais da temporada. Use o botão <strong>+</strong> para expandir e ver todos com valor acima de 0.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PlayerRankingCard
          title="Artilheiros"
          colorClass="text-primary"
          icon={Target}
          players={positiveStatPlayers.goals}
          onOpenAll={() => setPlayerStatModal("goals")}
          getValue={(player) => getStatValue(player, "goals")}
        />

        <PlayerRankingCard
          title="Assistentes"
          colorClass="text-accent"
          icon={Target}
          players={positiveStatPlayers.assists}
          onOpenAll={() => setPlayerStatModal("assists")}
          getValue={(player) => getStatValue(player, "assists")}
        />

        <PlayerRankingCard
          title="Clean Sheets"
          colorClass="text-accent"
          icon={ShieldCheck}
          players={positiveStatPlayers.cleanSheets}
          onOpenAll={() => setPlayerStatModal("cleanSheets")}
          getValue={(player) => getStatValue(player, "cleanSheets")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlayerRankingCard
          title="Mais Partidas"
          colorClass="text-primary"
          icon={Target}
          players={positiveStatPlayers.matches}
          onOpenAll={() => setPlayerStatModal("matches")}
          getValue={(player) => getStatValue(player, "matches")}
        />

        <PlayerRankingCard
          title="Part. em Gols"
          colorClass="text-accent"
          icon={Target}
          players={positiveStatPlayers.goalContributions}
          onOpenAll={() => setPlayerStatModal("goalContributions")}
          getValue={(player) => getStatValue(player, "goalContributions")}
        />
      </div>

      <StatsModal
        open={statsModalOpen}
        onOpenChange={setStatsModalOpen}
        stat={selectedStat}
        onSave={handleUpdateStats}
      />

      <Dialog open={playerStatModal !== null} onOpenChange={(open) => { if (!open) setPlayerStatModal(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {playerStatModal ? playerStatModalMeta[playerStatModal].title : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1 mt-2">
            {playerStatModal && playerStatModalMeta[playerStatModal].players.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                  <div>
                    <p className="font-display font-medium text-sm">{player.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span>{player.position}</span>
                        {player.nation && (
                          <Flag
                            code={player.nation}
                            style={{ width: 14, height: 10, borderRadius: 2, objectFit: "cover" }}
                          />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {playerStatModal !== "matches" && (
                    <span className="text-xs text-muted-foreground">{getStatValue(player, "matches")} partidas</span>
                  )}
                  <span className={`text-sm font-bold ${playerStatModalMeta[playerStatModal].colorClass}`}>
                    {playerStatModalMeta[playerStatModal].formatValue
                      ? playerStatModalMeta[playerStatModal].formatValue!(playerStatModalMeta[playerStatModal].getValue(player))
                      : playerStatModalMeta[playerStatModal].getValue(player)}
                  </span>
                </div>
              </div>
            ))}

            {playerStatModal && playerStatModalMeta[playerStatModal].players.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum jogador com estatística registrada.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StatsScreen;
