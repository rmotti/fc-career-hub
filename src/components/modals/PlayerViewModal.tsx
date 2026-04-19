import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type ApiPlayer } from "@/services/api";
import { getBadge } from "@/lib/playerBadge";
import Flag from "react-world-flags";
import { Pencil, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: ApiPlayer | null;
  onEdit: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  Crucial: "Crucial",
  Important: "Importante",
  Role: "Rotação",
  Sporadic: "Esporádico",
  Promising: "Promissor",
};

const STATUS_COLORS: Record<string, string> = {
  Crucial: "bg-primary/15 text-primary border-primary/30",
  Important: "bg-accent/15 text-accent border-accent/30",
  Role: "bg-muted text-muted-foreground border-border",
  Sporadic: "bg-muted text-muted-foreground border-border",
  Promising: "bg-warning/15 text-warning border-warning/30",
};

const POSITION_COLORS: Record<string, string> = {
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

const CLEAN_SHEETS_POSITIONS = new Set(["GOL", "ZAG", "LD", "LE", "VOL"]);

const Delta = ({ value, suffix = "" }: { value: number | null | undefined; suffix?: string }) => {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  if (value === 0) return <span className="text-muted-foreground flex items-center gap-0.5"><Minus size={12} />0{suffix}</span>;
  if (value > 0) return <span className="text-green-500 flex items-center gap-0.5"><TrendingUp size={12} />+{value}{suffix}</span>;
  return <span className="text-destructive flex items-center gap-0.5"><TrendingDown size={12} />{value}{suffix}</span>;
};

const PlayerViewModal = ({ open, onOpenChange, player, onEdit }: Props) => {
  if (!player) return null;

  const stats = player.currentSeasonStats || player.totalStats;
  const badge = getBadge(player);
  const positionColor = POSITION_COLORS[player.position] ?? "bg-muted text-muted-foreground";
  const statusLabel = STATUS_LABELS[player.status] ?? player.status;
  const statusColor = STATUS_COLORS[player.status] ?? STATUS_COLORS.Role;

  const ovrColor =
    player.ovr >= 83 ? "text-primary" : player.ovr >= 80 ? "text-accent" : "text-foreground";

  const history = player.ovrHistory ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Perfil do Jogador</DialogTitle>
        </DialogHeader>

        {/* Header card */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-display font-bold ${positionColor}`}>
              {player.position}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-xl font-bold text-foreground">{player.name}</span>
                {player.shirtNumber != null && (
                  <span className="text-xs font-mono text-muted-foreground">#{player.shirtNumber}</span>
                )}
                {player.nation && (
                  <Flag code={player.nation} style={{ width: 20, height: 14, borderRadius: 3, objectFit: "cover" }} />
                )}
              </div>
              {badge && (
                <span
                  className="mt-1 inline-block px-2 py-0.5 rounded text-xs font-semibold"
                  style={{ backgroundColor: badge.color + "22", color: badge.color, border: `1px solid ${badge.color}44` }}
                >
                  {badge.icon} {badge.label}
                </span>
              )}
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 flex flex-col justify-center items-center gap-1 min-w-[120px]">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Overall</p>
            <p className={`font-display text-4xl font-bold ${ovrColor}`}>{player.ovr}</p>
            <Delta value={player.ovrDelta} />
            {player.potential && (
              <p className="text-xs text-muted-foreground mt-1">POT <span className="font-semibold text-foreground">{player.potential}</span></p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Partidas", value: stats?.matches ?? 0 },
            { label: "Gols", value: stats?.goals ?? 0 },
            { label: "Assistências", value: stats?.assists ?? 0 },
            ...(CLEAN_SHEETS_POSITIONS.has(player.position)
              ? [{ label: "Clean Sheets", value: stats?.cleanSheets ?? 0 }]
              : [{ label: "Participações", value: stats?.goalContributions ?? 0 }]
            ),
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-muted/30 p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1">{label}</p>
              <p className="font-display text-2xl font-bold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Details grid */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1">Posição</p>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${positionColor}`}>{player.position}</span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1">Idade</p>
            <p className="text-sm font-medium text-foreground">{player.age} anos</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1">Nação</p>
            <div className="flex items-center gap-1.5">
              {player.nation
                ? <Flag code={player.nation} style={{ width: 18, height: 13, borderRadius: 2, objectFit: "cover" }} />
                : null}
              <p className="text-sm font-medium text-foreground">{player.nation ?? "—"}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1">Salário</p>
            <p className="text-sm font-medium text-foreground">
              {player.salaryFormatted ?? (player.salary != null ? `${player.salary}K€` : "—")}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1">Valor de Mercado</p>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">
                {player.marketValueFormatted ?? (player.marketValue != null ? `€${player.marketValue}M` : "—")}
              </p>
              <Delta value={player.marketValueDelta} suffix="M" />
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1">Cartões</p>
            <p className="text-sm font-medium text-foreground">
              <span className="text-warning">{stats?.yellowCards ?? 0} 🟨</span>
              {" · "}
              <span className="text-destructive">{stats?.redCards ?? 0} 🟥</span>
            </p>
          </div>
        </div>

        {/* OVR & Market Value History */}
        {history.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Histórico de Overall e Valor de Mercado</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-body">Temporada</th>
                    <th className="px-4 py-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground font-body">OVR</th>
                    <th className="px-4 py-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground font-body">Variação</th>
                    <th className="px-4 py-2 text-right text-[10px] uppercase tracking-wider text-muted-foreground font-body">Valor de Mercado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, idx) => {
                    const prevEntry = history[idx + 1];
                    const ovrDelta = prevEntry != null ? entry.ovr - prevEntry.ovr : null;
                    const mvDelta = prevEntry?.marketValue != null && entry.marketValue != null
                      ? parseFloat((entry.marketValue - prevEntry.marketValue).toFixed(1))
                      : null;
                    const isLatest = idx === 0;
                    return (
                      <tr key={entry.season} className={`border-b border-border/30 ${isLatest ? "bg-primary/5" : "hover:bg-muted/30"} transition-colors`}>
                        <td className="px-4 py-2.5 font-medium text-foreground">
                          {entry.season}
                          {isLatest && <span className="ml-2 text-[10px] text-primary font-semibold uppercase tracking-wider">Atual</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`font-display font-bold ${entry.ovr >= 83 ? "text-primary" : entry.ovr >= 80 ? "text-accent" : "text-foreground"}`}>
                            {entry.ovr}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-xs font-medium">
                          <Delta value={ovrDelta} />
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">
                          {entry.marketValue != null ? (
                            <span className="flex items-center justify-end gap-1.5">
                              <span>€{entry.marketValue}M</span>
                              {mvDelta != null && <Delta value={mvDelta} suffix="M" />}
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Season stats history */}
        {player.history && player.history.length > 1 && (
          <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Histórico de Estatísticas</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    {["Temporada", "Part.", "Gols", "Assist.", "Partic.", ...(CLEAN_SHEETS_POSITIONS.has(player.position) ? ["CS"] : []), "🟨", "🟥"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-body">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {player.history.map((entry, idx) => (
                    <tr key={entry.season} className={`border-b border-border/30 ${idx === 0 ? "bg-primary/5" : "hover:bg-muted/30"} transition-colors`}>
                      <td className="px-3 py-2 font-medium text-foreground">
                        {entry.season}
                        {idx === 0 && <span className="ml-2 text-[10px] text-primary font-semibold uppercase tracking-wider">Atual</span>}
                      </td>
                      <td className="px-3 py-2 font-display">{entry.matches ?? 0}</td>
                      <td className="px-3 py-2 font-display font-bold">{entry.goals}</td>
                      <td className="px-3 py-2 font-display">{entry.assists}</td>
                      <td className="px-3 py-2 font-display text-primary">{entry.goalContributions ?? 0}</td>
                      {CLEAN_SHEETS_POSITIONS.has(player.position) && (
                        <td className="px-3 py-2 font-display text-accent">{entry.cleanSheets}</td>
                      )}
                      <td className="px-3 py-2 text-warning">{entry.yellowCards}</td>
                      <td className="px-3 py-2 text-destructive">{entry.redCards}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="bg-muted text-muted-foreground px-5 py-2 rounded-md text-sm hover:text-foreground transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => { onOpenChange(false); onEdit(); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-md font-display font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Pencil size={14} /> Editar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerViewModal;
