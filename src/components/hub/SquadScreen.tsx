import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Player } from "@/data/mockData";
import PlayerModal from "@/components/modals/PlayerModal";

interface Props {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
}

type SortKey = keyof Player;

const positionColor: Record<string, string> = {
  GOL: "bg-warning/20 text-warning",
  ZAG: "bg-accent/20 text-accent",
  MEI: "bg-primary/20 text-primary",
  ATA: "bg-destructive/20 text-destructive",
};

const SquadScreen = ({ players, onUpdatePlayers }: Props) => {
  const [sortKey, setSortKey] = useState<SortKey>("ovr");
  const [sortAsc, setSortAsc] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const sorted = [...players].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (typeof va === "number" && typeof vb === "number") return sortAsc ? va - vb : vb - va;
    return String(va).localeCompare(String(vb)) * (sortAsc ? 1 : -1);
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const handleSavePlayer = (player: Player) => {
    const exists = players.find((p) => p.id === player.id);
    if (exists) {
      onUpdatePlayers(players.map((p) => (p.id === player.id ? player : p)));
    } else {
      onUpdatePlayers([...players, player]);
    }
    setEditingPlayer(null);
  };

  const handleDelete = (id: number) => {
    onUpdatePlayers(players.filter((p) => p.id !== id));
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
                  <td className="px-4 py-3 font-display font-bold">{p.goals}</td>
                  <td className="px-4 py-3 font-display">{p.assists}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.salary}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.marketValue}</td>
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
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remover"
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
      />
    </div>
  );
};

export default SquadScreen;
