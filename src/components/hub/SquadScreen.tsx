import { useState } from "react";
import type { Player } from "@/data/mockData";

interface Props {
  players: Player[];
}

type SortKey = keyof Player;

const positionColor: Record<string, string> = {
  GOL: "bg-warning/20 text-warning",
  ZAG: "bg-accent/20 text-accent",
  MEI: "bg-primary/20 text-primary",
  ATA: "bg-destructive/20 text-destructive",
};

const SquadScreen = ({ players }: Props) => {
  const [sortKey, setSortKey] = useState<SortKey>("ovr");
  const [sortAsc, setSortAsc] = useState(false);

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
      <h2 className="font-display text-2xl font-bold">Elenco</h2>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SquadScreen;
