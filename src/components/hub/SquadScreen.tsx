import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ApiPlayer } from "@/services/api";
import { usePlayers, useCreatePlayer, useUpdatePlayer, useReleasePlayer } from "@/hooks/usePlayers";
import PlayerModal from "@/components/modals/PlayerModal";

interface Props {
  saveId: string;
}

type SortKey = "name" | "position" | "age" | "ovr" | "goals" | "assists" | "salary" | "marketValue";

const positionColor: Record<string, string> = {
  GOL: "bg-warning/20 text-warning",
  ZAG: "bg-accent/20 text-accent",
  MEI: "bg-primary/20 text-primary",
  ATA: "bg-destructive/20 text-destructive",
};

const SquadScreen = ({ saveId }: Props) => {
  const [sortKey, setSortKey] = useState<SortKey>("ovr");
  const [sortAsc, setSortAsc] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<ApiPlayer | null>(null);

  const { data: players = [], isLoading } = usePlayers(saveId, true);
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();
  const releasePlayer = useReleasePlayer();

  const getValue = (p: ApiPlayer, key: SortKey): string | number => {
    if (key === "goals") return p.seasonStats?.goals ?? 0;
    if (key === "assists") return p.seasonStats?.assists ?? 0;
    return (p as unknown as Record<string, string | number>)[key] ?? "";
  };

  const sorted = [...players].sort((a, b) => {
    const va = getValue(a, sortKey);
    const vb = getValue(b, sortKey);
    if (typeof va === "number" && typeof vb === "number") return sortAsc ? va - vb : vb - va;
    return String(va).localeCompare(String(vb)) * (sortAsc ? 1 : -1);
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const handleSavePlayer = (data: { name: string; position: string; age: number; status: string; ovr: number; salary?: string; marketValue?: string; goals?: number; assists?: number; yellowCards?: number; redCards?: number }, playerId?: string) => {
    const { goals, assists, yellowCards, redCards, ...playerData } = data;
    if (playerId) {
      updatePlayer.mutate({ saveId, playerId, data: playerData }, {
        onSuccess: () => toast.success("Jogador atualizado!"),
        onError: (err) => toast.error(err.message),
      });
    } else {
      createPlayer.mutate({ saveId, data: playerData }, {
        onSuccess: () => toast.success("Jogador adicionado!"),
        onError: (err) => toast.error(err.message),
      });
    }
    setEditingPlayer(null);
  };

  const handleDelete = (player: ApiPlayer) => {
    releasePlayer.mutate({ saveId, playerId: player.id }, {
      onSuccess: () => toast.success(`${player.name} foi dispensado.`),
      onError: (err) => toast.error(err.message),
    });
  };

  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: "Nome" },
    { key: "position", label: "Pos" },
    { key: "age", label: "Idade" },
    { key: "ovr", label: "OVR" },
    { key: "goals", label: "Gols" },
    { key: "assists", label: "Assist" },
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Elenco</h2>
        <button
          onClick={() => { setEditingPlayer(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Adicionar Jogador
        </button>
      </div>

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
                    {col.label} {sortKey === col.key && (sortAsc ? "↑" : "↓")}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${positionColor[p.position]}`}>{p.position}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.age}</td>
                  <td className="px-4 py-3">
                    <span className={`font-display font-bold ${p.ovr >= 83 ? "text-primary" : p.ovr >= 80 ? "text-accent" : "text-foreground"}`}>
                      {p.ovr}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-display font-bold">{p.seasonStats?.goals ?? 0}</td>
                  <td className="px-4 py-3 font-display">{p.seasonStats?.assists ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.salary ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.marketValue ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
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
                    </div>
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Nenhum jogador no elenco.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PlayerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        player={editingPlayer}
        onSave={handleSavePlayer}
        saveId={saveId}
      />
    </div>
  );
};

export default SquadScreen;
