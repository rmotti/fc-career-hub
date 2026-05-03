import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import type React from "react";
import { type ApiPlayer } from "@/shared/api/client";
import { getBadge } from "@/entities/player/model/playerBadge";
import Flag from "react-world-flags";
import {
  BadgeEuro,
  Calendar,
  ChartNoAxesColumnIncreasing,
  CircleDollarSign,
  ClipboardList,
  Flag as FlagIcon,
  Medal,
  Minus,
  Pencil,
  ShieldCheck,
  Shirt,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  formatCurrencyInMillions,
  formatCurrencyInThousands,
  formatSignedCurrencyInMillions,
} from "@/shared/lib/currency";
import { roundToSingleDecimal } from "@/shared/lib/rounding";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { getAlternativePositions } from "@/shared/lib/playerPositions";

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

const Delta = ({ value, suffix = "", moneyUnit }: { value: number | null | undefined; suffix?: string; moneyUnit?: "M" }) => {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const label = moneyUnit === "M" ? formatSignedCurrencyInMillions(value) : `${value > 0 ? "+" : ""}${value}${suffix}`;
  if (value === 0) {
    return (
      <span className="text-muted-foreground flex items-center gap-0.5">
        <Minus size={12} />
        {moneyUnit === "M" ? formatCurrencyInMillions(0) : `0${suffix}`}
      </span>
    );
  }
  if (value > 0) return <span className="text-green-500 flex items-center gap-0.5"><TrendingUp size={12} />{label}</span>;
  return <span className="text-destructive flex items-center gap-0.5"><TrendingDown size={12} />{label}</span>;
};

const PlayerViewModal = ({ open, onOpenChange, player, onEdit }: Props) => {
  if (!player) return null;

  const stats = player.currentSeasonStats || player.totalStats;
  const badge = getBadge(player);
  const positionColor = POSITION_COLORS[player.position] ?? "bg-muted text-muted-foreground";
  const alternativePositions = getAlternativePositions(player);
  const alternativePositionsLabel = alternativePositions.length > 0 ? alternativePositions.join(", ") : "—";
  const statusLabel = STATUS_LABELS[player.status] ?? player.status;
  const statusColor = STATUS_COLORS[player.status] ?? STATUS_COLORS.Role;

  const ovrColor =
    player.ovr >= 83 ? "text-primary" : player.ovr >= 80 ? "text-accent" : "text-foreground";

  const history = player.ovrHistory ?? [];
  const goalContributions = stats?.goalContributions ?? ((stats?.goals ?? 0) + (stats?.assists ?? 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden border-border bg-card p-0">
        <DialogHeader className="border-b border-border px-6 py-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Perfil do jogador</p>
          <DialogTitle className="font-display text-2xl leading-none">
            {player.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(92vh-94px)]" viewportClassName="px-6 pb-6" scrollbars="vertical">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 pt-5 lg:grid-cols-[1fr_180px]">
            <div className="relative overflow-hidden rounded-lg border border-border bg-muted/25 p-5">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-primary/5" />
              <div className="relative flex items-start gap-4">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border text-lg font-display font-bold ${positionColor}`}>
                  {player.position}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {player.shirtNumber != null && (
                      <span className="rounded border border-border bg-background/40 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        #{player.shirtNumber}
                      </span>
                    )}
                    {player.nation && (
                      <Flag code={player.nation} style={{ width: 22, height: 15, borderRadius: 3, objectFit: "cover" }} />
                    )}
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-3xl font-bold leading-none text-foreground">{player.name}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {badge && (
                      <span
                        className="inline-flex items-center rounded px-2 py-1 text-xs font-semibold"
                        style={{ backgroundColor: badge.color + "22", color: badge.color, border: `1px solid ${badge.color}44` }}
                      >
                        {badge.icon} {badge.label}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{player.age} anos</span>
                    {player.potential && <span className="text-xs text-muted-foreground">POT {player.potential}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/8 p-5 text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Overall</p>
              <p className={`mt-2 font-display text-6xl font-bold leading-none ${ovrColor}`}>{player.ovr}</p>
              <div className="mt-2 flex justify-center text-sm font-semibold">
                <Delta value={player.ovrDelta} />
              </div>
              {player.potential && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Potencial <span className="font-semibold text-foreground">{player.potential}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PlayerStatCard icon={Calendar} label="Partidas" value={stats?.matches ?? 0} />
            <PlayerStatCard icon={Target} label="Gols" value={stats?.goals ?? 0} tone="primary" />
            <PlayerStatCard icon={ChartNoAxesColumnIncreasing} label="Assist." value={stats?.assists ?? 0} tone="accent" />
            <PlayerStatCard
              icon={CLEAN_SHEETS_POSITIONS.has(player.position) ? ShieldCheck : Medal}
              label={CLEAN_SHEETS_POSITIONS.has(player.position) ? "Clean sheets" : "Particip."}
              value={CLEAN_SHEETS_POSITIONS.has(player.position) ? (stats?.cleanSheets ?? 0) : goalContributions}
              tone="gold"
            />
          </div>

          <section className="rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <ClipboardList size={15} className="text-primary" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Dados de gestão</p>
            </div>
            <div className="grid grid-cols-1 gap-0 sm:grid-cols-3">
              <PlayerDetail icon={Shirt} label="Posição" value={player.position} badgeClass={positionColor} />
              <PlayerDetail icon={Shirt} label="Alternativas" value={alternativePositionsLabel} />
              <PlayerDetail icon={FlagIcon} label="Nação" value={player.nation ?? "—"} flag={player.nation} />
              <PlayerDetail icon={BadgeEuro} label="Salário" value={player.salary != null ? `${formatCurrencyInThousands(player.salary)}/sem` : "—"} />
              <PlayerDetail icon={CircleDollarSign} label="Valor de mercado" value={player.marketValue != null ? formatCurrencyInMillions(player.marketValue) : "—"} delta={<Delta value={player.marketValueDelta} moneyUnit="M" />} />
              <PlayerDetail icon={Calendar} label="Idade" value={`${player.age} anos`} />
              <PlayerDetail
                icon={ShieldCheck}
                label="Cartões"
                value={`${stats?.yellowCards ?? 0} amarelos / ${stats?.redCards ?? 0} vermelhos`}
              />
            </div>
          </section>

          {history.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Histórico de Overall e Valor de Mercado</p>
            </div>
            <ScrollArea scrollbars="horizontal" className="w-full">
              <table className="min-w-[560px] w-full text-sm">
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
                      ? roundToSingleDecimal(entry.marketValue - prevEntry.marketValue)
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
                              <span>{formatCurrencyInMillions(entry.marketValue)}</span>
                              {mvDelta != null && <Delta value={mvDelta} moneyUnit="M" />}
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollArea>
          </div>
          )}

          {player.history && player.history.length > 1 && (
          <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Histórico de Estatísticas</p>
            </div>
            <ScrollArea scrollbars="horizontal" className="w-full">
              <table className="min-w-[640px] w-full text-sm">
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
            </ScrollArea>
          </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md bg-muted px-5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => { onOpenChange(false); onEdit(); }}
              className="flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-[opacity,transform] hover:opacity-90 active:scale-[0.97]"
            >
              <Pencil size={14} /> Editar jogador
            </button>
          </div>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

type StatTone = "primary" | "accent" | "gold" | "muted";

const statToneClass: Record<StatTone, string> = {
  primary: "text-primary",
  accent: "text-accent",
  gold: "text-[hsl(var(--gold))]",
  muted: "text-foreground",
};

function PlayerStatCard({
  icon: Icon,
  label,
  value,
  tone = "muted",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone?: StatTone;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={14} className={statToneClass[tone]} />
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      </div>
      <p className={`font-display text-3xl font-bold leading-none ${statToneClass[tone]}`}>{value}</p>
    </div>
  );
}

function PlayerDetail({
  icon: Icon,
  label,
  value,
  badgeClass,
  flag,
  delta,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  badgeClass?: string;
  flag?: string | null;
  delta?: React.ReactNode;
}) {
  return (
    <div className="border-b border-border px-4 py-3 sm:border-r [&:nth-child(3n)]:sm:border-r-0 [&:nth-last-child(-n+3)]:sm:border-b-0">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={13} className="text-muted-foreground" />
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      </div>
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {flag && <Flag code={flag} style={{ width: 18, height: 13, borderRadius: 2, objectFit: "cover" }} />}
        {badgeClass ? <span className={`rounded px-2 py-0.5 text-xs font-bold ${badgeClass}`}>{value}</span> : <span>{value}</span>}
        {delta}
      </div>
    </div>
  );
}

export default PlayerViewModal;
