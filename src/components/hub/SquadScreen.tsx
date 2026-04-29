import { useState, useMemo } from "react";
import {
  Activity,
  BarChart3,
  CircleDollarSign,
  Dumbbell,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { type ApiPlayer, extractErrorMessage } from "@/services/api";
import { usePlayers, useCreatePlayer, useUpdatePlayer, useReleasePlayer, useUpdatePlayerStats } from "@/hooks/usePlayers";
import { useSave } from "@/hooks/useSaves";
import PlayerModal from "@/components/modals/PlayerModal";
import PlayerViewModal from "@/components/modals/PlayerViewModal";
import { getBadge, type SquadRole } from "@/lib/playerBadge";
import Flag from "react-world-flags";
import { formatCurrencyInMillions, formatCurrencyInThousands } from "@/utils/currency";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAlternativePositions, playerCanPlayPosition } from "@/utils/playerPositions";

interface Props {
  saveId: string;
  selectedSeason?: string;
  currentSeason?: string;
}

type SortKey = "name" | "position" | "age" | "ovr" | "potential" | "matches" | "goals" | "assists" | "goalContributions" | "cleanSheets" | "salary" | "marketValue";
type SquadView = "all" | "management" | "stats" | "market" | "development";
type SquadFilter = "all" | "attack" | "midfield" | "defense" | "prospects" | "incomplete";

const CLEAN_SHEETS_POSITIONS = new Set(["GOL", "ZAG", "LD", "LE", "VOL"]);

const POSITION_ORDER = ["GOL", "LD", "LE", "ZAG", "VOL", "MC", "MEI", "MD", "ME", "PE", "PD", "SA", "ATA"];
const ATTACK_POSITIONS = new Set(["PE", "PD", "SA", "ATA"]);
const MIDFIELD_POSITIONS = new Set(["VOL", "MC", "ME", "MD", "MEI"]);
const DEFENSE_POSITIONS = new Set(["GOL", "LD", "LE", "ZAG"]);

const formatDecimal = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);

const formatSquadMarketTotal = (valueInMillions: number) => {
  if (valueInMillions >= 1000) return `€${formatDecimal(valueInMillions / 1000, 2)} bi`;
  return formatCurrencyInMillions(valueInMillions);
};

const formatWeeklyWageTotal = (valueInThousands: number) => {
  if (valueInThousands >= 1000) return `€${formatDecimal(valueInThousands / 1000, 2)} mi/sem`;
  return `${formatCurrencyInThousands(valueInThousands)}/sem`;
};

const positionColor: Record<string, string> = {
  GOL: "bg-warning/20 text-warning",
  LD: "bg-accent/20 text-accent",
  LE: "bg-accent/20 text-accent",
  ZAG: "bg-accent/20 text-accent",
  VOL: "bg-primary/20 text-primary",
  MC: "bg-primary/20 text-primary",
  ME: "bg-primary/20 text-primary",
  MD: "bg-primary/20 text-primary",
  MEI: "bg-primary/20 text-primary",
  PE: "bg-destructive/20 text-destructive",
  PD: "bg-destructive/20 text-destructive",
  SA: "bg-destructive/20 text-destructive",
  ATA: "bg-destructive/20 text-destructive",
};

const SquadScreen = ({ saveId, selectedSeason, currentSeason }: Props) => {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<ApiPlayer | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingPlayer, setViewingPlayer] = useState<ApiPlayer | null>(null);
  const [activeView, setActiveView] = useState<SquadView>("all");
  const [activeFilter, setActiveFilter] = useState<SquadFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const isPastSeason = !!(selectedSeason && currentSeason && selectedSeason !== currentSeason);

  const { data: save } = useSave(saveId);
  const { data: players = [], isLoading } = usePlayers(saveId, true);

  const squadRoles = useMemo(() => {
    const roles = new Map<string, SquadRole>();
    if (players.length === 0) return roles;

    const getGoals = (p: typeof players[0]) => (p.currentSeasonStats || p.totalStats)?.goals ?? 0;
    const getAssists = (p: typeof players[0]) => (p.currentSeasonStats || p.totalStats)?.assists ?? 0;
    const getMatches = (p: typeof players[0]) => (p.currentSeasonStats || p.totalStats)?.matches ?? 0;

    const topScorer = players.reduce((a, b) => getGoals(a) >= getGoals(b) ? a : b);
    const topAssister = players.reduce((a, b) => getAssists(a) >= getAssists(b) ? a : b);
    const topMatches = players.reduce((a, b) => getMatches(a) >= getMatches(b) ? a : b);

    if (getGoals(topScorer) > 0) roles.set(topScorer.id, "artilheiro");
    if (getAssists(topAssister) > 0 && !roles.has(topAssister.id)) roles.set(topAssister.id, "garçom");
    if (getMatches(topMatches) > 0 && !roles.has(topMatches.id)) roles.set(topMatches.id, "motor");

    return roles;
  }, [players]);
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();
  const releasePlayer = useReleasePlayer();
  const updateStats = useUpdatePlayerStats();

  const squadSummary = useMemo(() => {
    const totalPlayers = players.length;
    const totalOvr = players.reduce((sum, player) => sum + player.ovr, 0);
    const averageOvr = totalPlayers > 0 ? Math.round((totalOvr / totalPlayers) * 10) / 10 : 0;
    const averageAge = totalPlayers > 0
      ? Math.round((players.reduce((sum, player) => sum + player.age, 0) / totalPlayers) * 10) / 10
      : 0;
    const totalGoals = players.reduce((sum, player) => sum + ((player.currentSeasonStats || player.totalStats)?.goals ?? 0), 0);
    const totalAssists = players.reduce((sum, player) => sum + ((player.currentSeasonStats || player.totalStats)?.assists ?? 0), 0);
    const totalMarketValue = players.reduce((sum, player) => sum + (player.marketValue ?? 0), 0);
    const weeklyWages = players.reduce((sum, player) => sum + (player.salary ?? 0), 0);
    const prospects = players.filter((player) => player.age <= 23 && (player.potential ?? 0) >= Math.max(80, player.ovr + 4)).length;
    const incompleteStats = players.filter((player) => {
      const stats = player.currentSeasonStats || player.totalStats;
      return !stats || ((stats.matches ?? 0) === 0 && stats.goals === 0 && stats.assists === 0 && stats.cleanSheets === 0);
    }).length;

    return {
      totalPlayers,
      averageOvr,
      averageAge,
      totalGoals,
      totalAssists,
      totalMarketValue,
      weeklyWages,
      prospects,
      incompleteStats,
    };
  }, [players]);

  const squadHighlights = useMemo(() => {
    const getStats = (player: ApiPlayer) => player.currentSeasonStats || player.totalStats;
    const impactPlayer = [...players].sort((a, b) => {
      const bStats = getStats(b);
      const aStats = getStats(a);
      const bContribution = bStats?.goalContributions ?? ((bStats?.goals ?? 0) + (bStats?.assists ?? 0));
      const aContribution = aStats?.goalContributions ?? ((aStats?.goals ?? 0) + (aStats?.assists ?? 0));
      return bContribution - aContribution;
    })[0] ?? null;
    const growthPlayer = [...players]
      .filter((player) => (player.ovrDelta ?? 0) > 0)
      .sort((a, b) => (b.ovrDelta ?? 0) - (a.ovrDelta ?? 0))[0] ?? null;
    const valuePlayer = [...players]
      .filter((player) => (player.marketValueDelta ?? 0) > 0)
      .sort((a, b) => (b.marketValueDelta ?? 0) - (a.marketValueDelta ?? 0))[0] ?? null;
    const agingCore = players.filter((player) => player.age >= 30 && ["Crucial", "Important"].includes(player.status)).length;

    return { impactPlayer, growthPlayer, valuePlayer, agingCore };
  }, [players]);

  const filteredPlayers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();

    return players.filter((player) => {
      const stats = player.currentSeasonStats || player.totalStats;
      const matchesSearch = normalizedSearch.length === 0
        || player.name.toLocaleLowerCase().includes(normalizedSearch)
        || player.position.toLocaleLowerCase().includes(normalizedSearch)
        || getAlternativePositions(player).some((position) => position.toLocaleLowerCase().includes(normalizedSearch))
        || player.status.toLocaleLowerCase().includes(normalizedSearch)
        || String(player.shirtNumber ?? "").includes(normalizedSearch);

      if (!matchesSearch) return false;

      if (activeFilter === "attack") return [...ATTACK_POSITIONS].some((position) => playerCanPlayPosition(player, position));
      if (activeFilter === "midfield") return [...MIDFIELD_POSITIONS].some((position) => playerCanPlayPosition(player, position));
      if (activeFilter === "defense") return [...DEFENSE_POSITIONS].some((position) => playerCanPlayPosition(player, position));
      if (activeFilter === "prospects") return player.age <= 23 && (player.potential ?? 0) >= Math.max(80, player.ovr + 4);
      if (activeFilter === "incomplete") {
        return !stats || ((stats.matches ?? 0) === 0 && stats.goals === 0 && stats.assists === 0 && stats.cleanSheets === 0);
      }

      return true;
    });
  }, [activeFilter, players, searchTerm]);

  const sortedPlayers = useMemo(() => {
    if (!sortField) return filteredPlayers;

    return [...filteredPlayers].sort((a, b) => {
      let valA: any;
      let valB: any;

      // Handle stats fields
      if (["matches", "goals", "assists", "goalContributions", "cleanSheets"].includes(sortField)) {
        const statsA = a.currentSeasonStats || a.totalStats;
        const statsB = b.currentSeasonStats || b.totalStats;
        valA = statsA?.[sortField as keyof typeof statsA] ?? 0;
        valB = statsB?.[sortField as keyof typeof statsB] ?? 0;
      } else {
        valA = (a as any)[sortField] ?? 0;
        valB = (b as any)[sortField] ?? 0;
      }
      
      if (typeof valA === "string" && typeof valB === "string") {
        if (sortField === "position") {
          const idxA = POSITION_ORDER.indexOf(valA);
          const idxB = POSITION_ORDER.indexOf(valB);
          const orderA = idxA === -1 ? 999 : idxA;
          const orderB = idxB === -1 ? 999 : idxB;
          return sortOrder === "asc" ? orderA - orderB : orderB - orderA;
        }
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "desc" ? (valB as number) - (valA as number) : (valA as number) - (valB as number);
    });
  }, [filteredPlayers, sortField, sortOrder]);

  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortOrder(prev => prev === "desc" ? "asc" : "desc");
    } else {
      setSortField(key);
      setSortOrder("desc");
    }
  };

  const handleSavePlayer = async (data: any, playerId?: string) => {
    const { goals, assists, yellowCards, redCards, matches, cleanSheets, ...playerData } = data;
    if (playerId) {
      await updatePlayer.mutateAsync({ saveId, playerId, data: playerData });
      toast.success("Jogador atualizado!", { duration: 3000 });
    } else {
      const newPlayer = await createPlayer.mutateAsync({
        saveId,
        data: playerData
      });

      const hasStats = goals > 0 || assists > 0 || yellowCards > 0 || redCards > 0 || matches > 0 || cleanSheets > 0;
      if (hasStats && newPlayer?.id) {
        await updateStats.mutateAsync({
          saveId,
          playerId: newPlayer.id,
          data: { goals, assists, yellowCards, redCards, matches, cleanSheets }
        });
      }

      toast.success("Jogador adicionado ao elenco!", { duration: 3000 });
    }
  };

  const handleDelete = (player: ApiPlayer) => {
    releasePlayer.mutate({ saveId, playerId: player.id }, {
      onSuccess: () => toast.success(`${player.name} foi dispensado.`, { duration: 3000 }),
      onError: (err) => toast.error(extractErrorMessage(err), { duration: 5000 }),
    });
  };

  const allColumns: { key: SortKey; label: string; views: SquadView[]; align?: "right" }[] = [
    { key: "name", label: "Nome", views: ["all", "management", "stats", "market", "development"] },
    { key: "position", label: "Pos", views: ["all", "management", "stats", "market", "development"] },
    { key: "age", label: "Idade", views: ["all", "management", "market", "development"] },
    { key: "ovr", label: "OVR", views: ["all", "management", "market", "development"] },
    { key: "potential", label: "POT", views: ["all", "development"] },
    { key: "matches", label: "Part.", views: ["all", "stats"] },
    { key: "goals", label: "Gols", views: ["all", "stats"] },
    { key: "assists", label: "Assist.", views: ["all", "stats"] },
    { key: "goalContributions", label: "Partic.", views: ["all", "stats"] },
    { key: "cleanSheets", label: "CS", views: ["stats"] },
    { key: "salary", label: "Salário", views: ["all", "management", "market"], align: "right" },
    { key: "marketValue", label: "Valor", views: ["all", "market"], align: "right" },
  ];
  const columns = allColumns.filter((column) => column.views.includes(activeView));

  const viewOptions: Array<{ key: SquadView; label: string; icon: React.ElementType }> = [
    { key: "all", label: "Todos", icon: Users },
    { key: "management", label: "Gestão", icon: SlidersHorizontal },
    { key: "stats", label: "Estatísticas", icon: BarChart3 },
    { key: "market", label: "Mercado", icon: CircleDollarSign },
    { key: "development", label: "Desenvolvimento", icon: Dumbbell },
  ];

  const filterOptions: Array<{ key: SquadFilter; label: string }> = [
    { key: "all", label: "Todos" },
    { key: "attack", label: "Ataque" },
    { key: "midfield", label: "Meio" },
    { key: "defense", label: "Defesa" },
    { key: "prospects", label: "Promessas" },
    { key: "incomplete", label: "Sem stats" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" /> Carregando elenco...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {save?.currentClubStint?.club ?? save?.name ?? "Modo Carreira"}
          </p>
          <h2 className="font-display text-3xl font-bold leading-none tracking-tight text-foreground">Central do Elenco</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Gerencie dados, estatísticas da temporada e sinais de mercado jogador por jogador.
          </p>
        </div>
        {!isPastSeason && (
          <button
            onClick={() => { setEditingPlayer(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-[opacity,transform] hover:opacity-90 active:scale-[0.97]"
          >
            <Plus size={16} /> Adicionar Jogador
          </button>
        )}
      </div>

      {isPastSeason && (
        <div className="mb-4 px-4 py-2 rounded-md bg-muted border border-border text-sm text-muted-foreground flex items-center gap-2">
          📅 Visualizando temporada {selectedSeason} — modo somente leitura
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SquadMetric icon={Users} label="Jogadores" value={squadSummary.totalPlayers} detail={`${squadSummary.averageAge || "-"} anos em média`} />
        <SquadMetric icon={Activity} label="OVR médio" value={squadSummary.averageOvr || "-"} detail={`${squadSummary.prospects} promessa(s)`} tone="primary" />
        <SquadMetric icon={Target} label="Produção" value={`${squadSummary.totalGoals}G`} detail={`${squadSummary.totalAssists} assistências`} tone="accent" />
        <SquadMetric
          icon={CircleDollarSign}
          label="Valor do elenco"
          value={formatSquadMarketTotal(squadSummary.totalMarketValue)}
          detail={`Folha salarial: ${formatWeeklyWageTotal(squadSummary.weeklyWages)}`}
          tone="gold"
        />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <SquadHighlight
          label="Maior impacto"
          player={squadHighlights.impactPlayer}
          value={squadHighlights.impactPlayer ? `${(squadHighlights.impactPlayer.currentSeasonStats || squadHighlights.impactPlayer.totalStats)?.goalContributions ?? 0} particip.` : "-"}
          icon={Target}
          tone="gold"
        />
        <SquadHighlight
          label="Evolução"
          player={squadHighlights.growthPlayer}
          value={squadHighlights.growthPlayer ? `+${squadHighlights.growthPlayer.ovrDelta} OVR` : "-"}
          icon={Dumbbell}
          tone="primary"
        />
        <SquadHighlight
          label="Valorização"
          player={squadHighlights.valuePlayer}
          value={squadHighlights.valuePlayer ? `+${formatCurrencyInMillions(squadHighlights.valuePlayer.marketValueDelta ?? 0)}` : "-"}
          icon={CircleDollarSign}
          tone="accent"
        />
        <SquadHighlight
          label="Atenção"
          player={null}
          value={squadHighlights.agingCore > 0 ? `${squadHighlights.agingCore} veterano(s)` : `${squadSummary.incompleteStats} sem stats`}
          icon={ShieldAlert}
          tone={squadHighlights.agingCore > 0 ? "warning" : "muted"}
        />
      </section>

      <div className="card-gamer overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {viewOptions.map((option) => {
                const Icon = option.icon;
                const isActive = activeView === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setActiveView(option.key)}
                    className={`flex min-h-9 items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-semibold transition-[background-color,border-color,color,transform] active:scale-[0.98] ${
                      isActive
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-background/25 text-muted-foreground hover:border-border/80 hover:text-foreground"
                    }`}
                  >
                    <Icon size={14} />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-[220px]">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar jogador..."
                  className="h-9 w-full rounded-md border border-border bg-background/35 pl-9 pr-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filterOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setActiveFilter(option.key)}
                    className={`min-h-8 rounded-md px-2.5 text-xs font-semibold transition-[background-color,color,transform] active:scale-[0.97] ${
                      activeFilter === option.key
                        ? "bg-accent/15 text-accent"
                        : "bg-muted/45 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <ScrollArea scrollbars="horizontal" className="w-full">
          <table className="min-w-[1120px] w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`cursor-pointer px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground ${col.align === "right" ? "text-right" : "text-left"}`}
                  >
                    {col.label} {sortField === col.key && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((p) => {
                const stats = p.currentSeasonStats || p.totalStats;
                return (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  {columns.map((col) => {
                    if (col.key === "name") {
                      return (
                  <td key={col.key} className="min-w-[230px] px-4 py-3 font-medium">
                    <div>
                      <span className="flex items-center gap-2">
                        {p.name}
                        {p.shirtNumber != null && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                            #{p.shirtNumber}
                            {p.nation && (
                              <Flag code={p.nation} style={{ width: 16, height: 11, borderRadius: 2, objectFit: "cover" }} />
                            )}
                          </span>
                        )}
                      </span>
                      {(() => {
                        const badge = getBadge(p, squadRoles.get(p.id));
                        return badge ? (
                          <span
                            className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs font-semibold"
                            style={{ backgroundColor: badge.color + "22", color: badge.color, border: `1px solid ${badge.color}44` }}
                          >
                            {badge.icon} {badge.label}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </td>
                      );
                    }
                    if (col.key === "position") {
                      const alternativePositions = getAlternativePositions(p);
                      return (
                  <td key={col.key} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${positionColor[p.position]}`}>{p.position}</span>
                      {alternativePositions.map((position) => (
                        <span key={position} className="rounded border border-border bg-muted/35 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {position}
                        </span>
                      ))}
                    </div>
                  </td>
                      );
                    }
                    if (col.key === "age") return <td key={col.key} className="px-4 py-3 text-muted-foreground">{p.age}</td>;
                    if (col.key === "ovr") {
                      return (
                  <td key={col.key} className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-display font-bold ${p.ovr >= 83 ? "text-primary" : p.ovr >= 80 ? "text-accent" : "text-foreground"}`}>
                        {p.ovr}
                      </span>
                      {p.ovrDelta != null && (
                        <span className={`text-xs font-bold ${p.ovrDelta > 0 ? "text-green-500" : p.ovrDelta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {p.ovrDelta > 0 ? `▲${p.ovrDelta}` : p.ovrDelta < 0 ? `▼${Math.abs(p.ovrDelta)}` : "—"}
                        </span>
                      )}
                    </div>
                  </td>
                      );
                    }
                    if (col.key === "potential") return <td key={col.key} className="px-4 py-3 text-muted-foreground">{p.potential ?? "—"}</td>;
                    if (col.key === "matches") return <td key={col.key} className="px-4 py-3 font-display">{stats?.matches ?? 0}</td>;
                    if (col.key === "goals") return <td key={col.key} className="px-4 py-3 font-display font-bold">{stats?.goals ?? 0}</td>;
                    if (col.key === "assists") return <td key={col.key} className="px-4 py-3 font-display">{stats?.assists ?? 0}</td>;
                    if (col.key === "goalContributions") return <td key={col.key} className="px-4 py-3 font-display text-primary">{stats?.goalContributions ?? 0}</td>;
                    if (col.key === "cleanSheets") {
                      return (
                  <td key={col.key} className="px-4 py-3 font-display text-accent">
                    {CLEAN_SHEETS_POSITIONS.has(p.position) ? (stats?.cleanSheets ?? 0) : "—"}
                  </td>
                      );
                    }
                    if (col.key === "salary") return <td key={col.key} className="px-4 py-3 text-right text-muted-foreground">{p.salary != null ? formatCurrencyInThousands(p.salary) : "—"}</td>;
                    if (col.key === "marketValue") {
                      return (
                  <td key={col.key} className="px-4 py-3 text-right text-muted-foreground">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>{p.marketValue != null ? formatCurrencyInMillions(p.marketValue) : "—"}</span>
                      {p.marketValueDelta != null && (
                        <span className={`text-xs font-bold ${p.marketValueDelta > 0 ? "text-green-500" : p.marketValueDelta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {p.marketValueDelta > 0 ? `▲${formatCurrencyInMillions(p.marketValueDelta)}` : p.marketValueDelta < 0 ? `▼${formatCurrencyInMillions(Math.abs(p.marketValueDelta))}` : "—"}
                        </span>
                      )}
                    </div>
                  </td>
                      );
                    }
                    return null;
                  })}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setViewingPlayer(p); setViewModalOpen(true); }}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye size={14} />
                      </button>
                      {!isPastSeason && (
                        <>
                          <button
                            onClick={() => { setEditingPlayer(p); setModalOpen(true); }}
                            className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                            title="Editar dados e estatísticas"
                          >
                            <Pencil size={13} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Dispensar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
              {players.length === 0 && (
                <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">Nenhum jogador no elenco.</td></tr>
              )}
              {players.length > 0 && sortedPlayers.length === 0 && (
                <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">Nenhum jogador encontrado com esses filtros.</td></tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      <PlayerModal
        open={modalOpen}
        onOpenChange={(open) => { setModalOpen(open); if (!open) setEditingPlayer(null); }}
        player={editingPlayer}
        onSave={handleSavePlayer}
        saveId={saveId}
      />

      <PlayerViewModal
        open={viewModalOpen}
        onOpenChange={(open) => { setViewModalOpen(open); if (!open) setViewingPlayer(null); }}
        player={viewingPlayer}
        onEdit={() => { setEditingPlayer(viewingPlayer); setModalOpen(true); setViewingPlayer(null); }}
      />
    </div>
  );
};

type Tone = "primary" | "accent" | "gold" | "warning" | "muted";

const toneClass: Record<Tone, string> = {
  primary: "text-primary",
  accent: "text-accent",
  gold: "text-[hsl(var(--gold))]",
  warning: "text-[hsl(var(--warning))]",
  muted: "text-muted-foreground",
};

interface SquadMetricProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  detail: string;
  tone?: Tone;
}

function SquadMetric({ icon: Icon, label, value, detail, tone = "muted" }: SquadMetricProps) {
  return (
    <div className="card-gamer p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={15} className={toneClass[tone]} />
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      </div>
      <p className={`font-display text-2xl font-bold leading-none ${toneClass[tone]}`}>{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

interface SquadHighlightProps {
  label: string;
  player: ApiPlayer | null;
  value: string;
  icon: React.ElementType;
  tone: Tone;
}

function SquadHighlight({ label, player, value, icon: Icon, tone }: SquadHighlightProps) {
  const alternativePositions = player ? getAlternativePositions(player) : [];

  return (
    <div className="rounded-lg border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={15} className={toneClass[tone]} />
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        </div>
        <span className={`shrink-0 font-display text-sm font-bold ${toneClass[tone]}`}>{value}</span>
      </div>
      <p className="truncate text-sm font-semibold text-foreground">{player?.name ?? "Monitorar elenco"}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {player ? `${[player.position, ...alternativePositions].join("/")} · ${player.ovr} OVR` : "Use filtros para ajustar dados e detectar lacunas."}
      </p>
    </div>
  );
}

export default SquadScreen;
