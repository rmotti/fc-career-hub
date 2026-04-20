import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { type ApiPlayer, extractErrorMessage } from "@/services/api";
import { usePlayers, useCreatePlayer, useUpdatePlayer, useReleasePlayer, useUpdatePlayerStats } from "@/hooks/usePlayers";
import { useSave } from "@/hooks/useSaves";
import PlayerModal from "@/components/modals/PlayerModal";
import PlayerViewModal from "@/components/modals/PlayerViewModal";
import { getBadge, type SquadRole } from "@/lib/playerBadge";
import Flag from "react-world-flags";
import { formatCurrencyInMillions, formatCurrencyInThousands } from "@/utils/currency";

interface Props {
  saveId: string;
  selectedSeason?: string;
  currentSeason?: string;
}

type SortKey = "name" | "position" | "age" | "ovr" | "potential" | "matches" | "goals" | "assists" | "goalContributions" | "cleanSheets" | "salary" | "marketValue";

const CLEAN_SHEETS_POSITIONS = new Set(["GOL", "ZAG", "LD", "LE", "VOL"]);

const POSITION_ORDER = ["GOL", "LD", "LE", "ZAG", "VOL", "MC", "MEI", "MD", "ME", "PE", "PD", "SA", "ATA"];

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

  const sortedPlayers = useMemo(() => {
    if (!sortField) return players;

    return [...players].sort((a, b) => {
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
  }, [players, sortField, sortOrder]);

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

  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: "Nome" },
    { key: "position", label: "Pos" },
    { key: "age", label: "Idade" },
    { key: "ovr", label: "OVR" },
    { key: "potential", label: "POT" },
    { key: "matches", label: "Part." },
    { key: "goals", label: "Gols" },
    { key: "assists", label: "Assist." },
    { key: "goalContributions", label: "Partic." },
    { key: "cleanSheets", label: "CS" },
    { key: "salary", label: "Salário" },
    { key: "marketValue", label: "Valor" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" /> Carregando elenco...
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold font-display">Elenco</h2>
          <p className="text-muted-foreground">Gerencie seus jogadores</p>
        </div>
        {!isPastSeason && (
          <button
            onClick={() => { setEditingPlayer(null); setModalOpen(true); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity"
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

      <div className="card-gamer overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  >
                    {col.label} {sortField === col.key && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((p) => {
                const stats = p.currentSeasonStats || p.totalStats;
                return (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
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
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${positionColor[p.position]}`}>{p.position}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.age}</td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 text-muted-foreground">{p.potential ?? "—"}</td>
                  <td className="px-4 py-3 font-display">{stats?.matches ?? 0}</td>
                  <td className="px-4 py-3 font-display font-bold">{stats?.goals ?? 0}</td>
                  <td className="px-4 py-3 font-display">{stats?.assists ?? 0}</td>
                  <td className="px-4 py-3 font-display text-primary">{stats?.goalContributions ?? 0}</td>
                  <td className="px-4 py-3 font-display text-accent">
                    {CLEAN_SHEETS_POSITIONS.has(p.position) ? (stats?.cleanSheets ?? 0) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.salary != null ? formatCurrencyInThousands(p.salary) : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span>{p.marketValue != null ? formatCurrencyInMillions(p.marketValue) : "—"}</span>
                      {p.marketValueDelta != null && (
                        <span className={`text-xs font-bold ${p.marketValueDelta > 0 ? "text-green-500" : p.marketValueDelta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {p.marketValueDelta > 0 ? `▲${formatCurrencyInMillions(p.marketValueDelta)}` : p.marketValueDelta < 0 ? `▼${formatCurrencyInMillions(Math.abs(p.marketValueDelta))}` : "—"}
                        </span>
                      )}
                    </div>
                  </td>
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
                            className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
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
                <tr><td colSpan={13} className="px-4 py-8 text-center text-muted-foreground">Nenhum jogador no elenco.</td></tr>
              )}
            </tbody>
          </table>
        </div>
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

export default SquadScreen;
