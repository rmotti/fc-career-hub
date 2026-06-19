import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import type React from "react";
import { Fragment, useState } from "react";
import { type ApiPlayer, type ApiPlayerSeason } from "@/shared/api/client";
import { getBadge } from "@/entities/player/model/playerBadge";
import { usePlayer } from "@/features/squad/model/usePlayers";
import { useTransfers } from "@/features/transfers/model/useTransfers";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Flag from "react-world-flags";
import {
  BadgeEuro,
  Calendar,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Flag as FlagIcon,
  Medal,
  Minus,
  Pencil,
  Plane,
  ShieldCheck,
  Shirt,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  formatCurrency,
  formatCurrencyInMillions,
  formatCurrencyInThousands,
  formatSignedCurrencyInMillions,
} from "@/shared/lib/currency";
import { m, mToEur, type Money } from "@/shared/lib/money";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { getAlternativePositions, formatPosition } from "@/shared/lib/playerPositions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saveId: string;
  player: ApiPlayer | null;
  onEdit: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  Crucial: "Crucial",
  Important: "Important",
  Role: "Rotation",
  Sporadic: "Sporadic",
  Promising: "Promising",
  Loan: "Loaned",
};

const STATUS_COLORS: Record<string, string> = {
  Crucial: "bg-primary/15 text-primary border-primary/30",
  Important: "bg-accent/15 text-accent border-accent/30",
  Role: "bg-muted text-muted-foreground border-border",
  Sporadic: "bg-muted text-muted-foreground border-border",
  Promising: "bg-warning/15 text-warning border-warning/30",
  Loan: "bg-warning/15 text-warning border-warning/30",
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
  PE: "bg-destructive/20 text-destructive-text",
  PD: "bg-destructive/20 text-destructive-text",
  SA: "bg-destructive/20 text-destructive-text",
  ATA: "bg-destructive/20 text-destructive-text",
};

const CLEAN_SHEETS_POSITIONS = new Set(["GOL", "ZAG", "LD", "LE", "VOL"]);

const Delta = ({ value, suffix = "", moneyUnit }: { value: number | null | undefined; suffix?: string; moneyUnit?: "M" }) => {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const label = moneyUnit === "M" ? formatSignedCurrencyInMillions(m(value)) : `${value > 0 ? "+" : ""}${value}${suffix}`;
  if (value === 0) {
    return (
      <span className="text-muted-foreground flex items-center gap-0.5">
        <Minus size={12} />
        {moneyUnit === "M" ? formatCurrencyInMillions(m(0)) : `0${suffix}`}
      </span>
    );
  }
  if (value > 0) return <span className="text-green-500 flex items-center gap-0.5"><TrendingUp size={12} />{label}</span>;
  return <span className="text-destructive-text flex items-center gap-0.5"><TrendingDown size={12} />{label}</span>;
};

/** Aggregates a season's per-club rows into a single season total. */
function sumClubs(clubs: ApiPlayerSeason["clubs"]) {
  return clubs.reduce(
    (acc, c) => ({
      goals: acc.goals + c.goals,
      assists: acc.assists + c.assists,
      matches: acc.matches + c.matches,
      yellowCards: acc.yellowCards + c.yellowCards,
      redCards: acc.redCards + c.redCards,
      cleanSheets: acc.cleanSheets + c.cleanSheets,
      goalContributions: acc.goalContributions + c.goalContributions,
    }),
    { goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, goalContributions: 0 },
  );
}

function TrajectoryTooltip({ active, payload, label }: {
  active?: boolean;
  label?: string;
  payload?: Array<{ dataKey: string; value: number | null }>;
}) {
  if (!active || !payload?.length) return null;
  const ovr = payload.find((entry) => entry.dataKey === "ovr")?.value;
  const mv = payload.find((entry) => entry.dataKey === "marketValue")?.value;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      {ovr != null && <p className="text-primary">OVR <span className="font-display font-bold">{ovr}</span></p>}
      {mv != null && <p className="text-accent">{formatCurrency(mToEur(m(mv)))}</p>}
    </div>
  );
}

// A single-series season trajectory chart. Rendered once per metric (OVR and
// market value) so each gets its own axis and scale instead of sharing one
// dual-axis plot.
function TrajectoryChart({ title, icon: Icon, iconClass, data, dataKey, color, yDomain, yWidth, allowDecimals, yTickFormatter }: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconClass: string;
  data: Array<{ season: string; ovr: number | null; marketValue: Money<"M"> | null }>;
  dataKey: "ovr" | "marketValue";
  color: string;
  yDomain: [number | string, number | string];
  yWidth: number;
  allowDecimals?: boolean;
  yTickFormatter?: (value: number) => string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon size={15} className={iconClass} />
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      </div>
      <div className="h-56 px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="season" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} />
            <YAxis domain={yDomain} allowDecimals={allowDecimals} width={yWidth} tickFormatter={yTickFormatter} tick={{ fill: color, fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<TrajectoryTooltip />} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const PlayerViewModal = ({ open, onOpenChange, saveId, player, onEdit }: Props) => {
  // The list passes a lightweight player; the detail endpoint enriches it with
  // `seasons` / `loanSpells` / `totalStats`. Fetch on open and prefer the
  // enriched copy, falling back to the list item for an instant header render.
  const { data: detail } = usePlayer(saveId, open ? player?.id ?? null : null);
  const { data: transfers = [] } = useTransfers(open ? saveId : null);
  const p = detail ?? player;

  // Per-season club breakdown is collapsed by default; the season row toggles it.
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const toggleSeason = (key: string) =>
    setExpandedSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (!p) return null;

  const showCleanSheets = CLEAN_SHEETS_POSITIONS.has(p.position);
  // The stat cards and the cards detail show the *current season* only; the
  // career-long view lives in the per-season table and trajectory charts below.
  const seasonStats = p.currentSeasonStats;
  const badge = getBadge(p);
  const positionColor = POSITION_COLORS[p.position] ?? "bg-muted text-muted-foreground";
  const alternativePositions = getAlternativePositions(p);
  const alternativePositionsLabel = alternativePositions.length > 0 ? alternativePositions.map(formatPosition).join(", ") : "—";
  const statusLabel = STATUS_LABELS[p.status] ?? p.status;
  const statusColor = STATUS_COLORS[p.status] ?? STATUS_COLORS.Role;

  const ovrColor =
    p.ovr >= 83 ? "text-primary" : p.ovr >= 80 ? "text-accent" : "text-foreground";

  const seasons = p.seasons ?? [];
  const loanSpells = p.loanSpells ?? [];
  const goalContributions = seasonStats?.goalContributions ?? ((seasonStats?.goals ?? 0) + (seasonStats?.assists ?? 0));

  // Fee paid to sign this player, keyed by the season it happened in, so each
  // season row can show what the move cost (purchases only).
  const feeBySeason = new Map<string, Money<"M">>();
  for (const tr of transfers) {
    if (tr.playerId === p.id && tr.type === "compra" && tr.fee != null) {
      feeBySeason.set(tr.season, tr.fee);
    }
  }

  // Chart: one point per season, oldest → newest. Keep nulls as gaps (never plot
  // a missing snapshot as zero).
  const trajectory = seasons.map((s) => ({
    season: s.season,
    ovr: s.ovr,
    marketValue: s.marketValue,
  }));
  const enoughPoints = trajectory.length >= 2;
  const showOvrChart = enoughPoints && seasons.some((s) => s.ovr != null);
  const showMvChart = enoughPoints && seasons.some((s) => s.marketValue != null);

  // Table: most recent first, marking the latest season as "Current".
  const seasonRows = [...seasons].reverse();

  const fmtMv = (value: Money<"M"> | null | undefined) =>
    value == null ? "—" : formatCurrency(mToEur(value));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden border-border bg-card p-0">
        <DialogHeader className="border-b border-border px-6 py-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Player profile</p>
          <DialogTitle className="font-display text-2xl leading-none">
            {p.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(92vh-94px)]" viewportClassName="px-6 pb-6" scrollbars="vertical">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 pt-5 lg:grid-cols-[1fr_180px]">
            <div className="overflow-hidden rounded-lg border border-border bg-muted/25 p-5">
              <div className="flex items-start gap-4">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border text-lg font-display font-bold ${positionColor}`}>
                  {formatPosition(p.position)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.shirtNumber != null && (
                      <span className="rounded border border-border bg-background/40 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        #{p.shirtNumber}
                      </span>
                    )}
                    {p.nation && (
                      <Flag code={p.nation} style={{ width: 22, height: 15, borderRadius: 3, objectFit: "cover" }} />
                    )}
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-3xl font-bold leading-none text-foreground">{p.name}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {badge && (
                      <span
                        className="inline-flex items-center rounded px-2 py-1 text-xs font-semibold"
                        style={{ backgroundColor: badge.color + "22", color: badge.color, border: `1px solid ${badge.color}44` }}
                      >
                        {badge.icon} {badge.label}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{p.age} yrs</span>
                    {p.potential && <span className="text-xs text-muted-foreground">POT {p.potential}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/8 p-5 text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Overall</p>
              <p className={`mt-2 font-display text-6xl font-bold leading-none ${ovrColor}`}>{p.ovr}</p>
              <div className="mt-2 flex justify-center text-sm font-semibold">
                <Delta value={p.ovrDelta} />
              </div>
              {p.potential && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Potential <span className="font-semibold text-foreground">{p.potential}</span>
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Current season</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <PlayerStatCard icon={Calendar} label="Apps" value={seasonStats?.matches ?? 0} />
              <PlayerStatCard icon={Target} label="Goals" value={seasonStats?.goals ?? 0} tone="primary" />
              <PlayerStatCard icon={ChartNoAxesColumnIncreasing} label="Assists" value={seasonStats?.assists ?? 0} tone="accent" />
              <PlayerStatCard
                icon={showCleanSheets ? ShieldCheck : Medal}
                label={showCleanSheets ? "Clean sheets" : "Particip."}
                value={showCleanSheets ? (seasonStats?.cleanSheets ?? 0) : goalContributions}
                tone="gold"
              />
            </div>
          </div>

          <section className="rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <ClipboardList size={15} className="text-primary" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Management data</p>
            </div>
            <div className="grid grid-cols-1 gap-0 sm:grid-cols-3">
              <PlayerDetail icon={Shirt} label="Position" value={formatPosition(p.position)} badgeClass={positionColor} />
              <PlayerDetail icon={Shirt} label="Alternatives" value={alternativePositionsLabel} />
              <PlayerDetail icon={FlagIcon} label="Nation" value={p.nation ?? "—"} flag={p.nation} />
              <PlayerDetail icon={BadgeEuro} label="Salary" value={p.salary != null ? `${formatCurrencyInThousands(p.salary)}/wk` : "—"} />
              <PlayerDetail icon={CircleDollarSign} label="Market value" value={p.marketValue != null ? formatCurrencyInMillions(p.marketValue) : "—"} delta={<Delta value={p.marketValueDelta} moneyUnit="M" />} />
              <PlayerDetail icon={Calendar} label="Age" value={`${p.age} yrs`} />
            </div>
          </section>

          {(showOvrChart || showMvChart) && (
            <div className="space-y-4">
              {showOvrChart && (
                <TrajectoryChart
                  title="OVR trajectory"
                  icon={TrendingUp}
                  iconClass="text-primary"
                  data={trajectory}
                  dataKey="ovr"
                  color="hsl(var(--primary))"
                  yDomain={["dataMin - 3", "dataMax + 3"]}
                  yWidth={32}
                  allowDecimals={false}
                />
              )}
              {showMvChart && (
                <TrajectoryChart
                  title="Market value trajectory"
                  icon={CircleDollarSign}
                  iconClass="text-accent"
                  data={trajectory}
                  dataKey="marketValue"
                  color="hsl(var(--accent))"
                  yDomain={[0, "auto"]}
                  yWidth={48}
                  yTickFormatter={(v: number) => formatCurrency(mToEur(m(v)))}
                />
              )}
            </div>
          )}

          {seasons.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">Season by season</p>
            </div>
            <ScrollArea scrollbars="horizontal" className="w-full">
              <table className="min-w-[680px] w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    {["Season", "OVR", "Value", "Apps", "Goals", "Assists", "G+A", "🟨/🟥", ...(showCleanSheets ? ["CS"] : [])].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-body">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seasonRows.map((season, idx) => {
                    const total = sumClubs(season.clubs);
                    const isLatest = idx === 0;
                    const splitSeason = season.clubs.length > 1;
                    const isExpanded = expandedSeasons.has(season.season);
                    // Clubs played this season, joined with an arrow when a mid-season
                    // transfer split it across more than one club, plus the fee paid
                    // when the player was signed that season.
                    const clubLabel = season.clubs.map((c) => c.club).filter(Boolean).join(" → ");
                    const transferFee = feeBySeason.get(season.season);
                    const clubLine = transferFee != null
                      ? `${clubLabel}${clubLabel ? " · " : ""}${formatCurrencyInMillions(transferFee)}`
                      : clubLabel;
                    return (
                      <Fragment key={season.season}>
                        <tr
                          className={`border-b border-border/30 transition-colors ${isLatest ? "bg-primary/5" : "hover:bg-muted/30"} ${splitSeason ? "cursor-pointer" : ""}`}
                          onClick={splitSeason ? () => toggleSeason(season.season) : undefined}
                        >
                          <td className="px-3 py-2 font-medium text-foreground">
                            <div className="flex items-center gap-1.5">
                              {splitSeason ? (
                                <ChevronDown
                                  size={13}
                                  className={`text-muted-foreground transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                                />
                              ) : (
                                <span className="inline-block w-[13px]" />
                              )}
                              {season.season}
                              {isLatest && <span className="ml-1 text-[10px] text-primary font-semibold uppercase tracking-wider">Current</span>}
                            </div>
                            {clubLine && (
                              <span className="mt-0.5 block pl-[19px] text-xs italic text-muted-foreground">{clubLine}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {season.ovr != null ? (
                              <span className={`font-display font-bold ${season.ovr >= 83 ? "text-primary" : season.ovr >= 80 ? "text-accent" : "text-foreground"}`}>{season.ovr}</span>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{fmtMv(season.marketValue)}</td>
                          <td className="px-3 py-2 font-display">{total.matches}</td>
                          <td className="px-3 py-2 font-display font-bold">{total.goals}</td>
                          <td className="px-3 py-2 font-display">{total.assists}</td>
                          <td className="px-3 py-2 font-display text-primary">{total.goalContributions}</td>
                          <td className="px-3 py-2 text-xs"><span className="text-warning">{total.yellowCards}</span> / <span className="text-destructive-text">{total.redCards}</span></td>
                          {showCleanSheets && <td className="px-3 py-2 font-display text-accent">{total.cleanSheets}</td>}
                        </tr>
                        {splitSeason && isExpanded && season.clubs.map((club) => (
                          <tr key={`${season.season}-${club.club}`} className="border-b border-border/20 bg-background/30 text-xs text-muted-foreground">
                            <td className="py-1.5 pl-7 pr-3 italic">↳ {club.club}</td>
                            <td className="px-3 py-1.5" />
                            <td className="px-3 py-1.5" />
                            <td className="px-3 py-1.5 font-display">{club.matches}</td>
                            <td className="px-3 py-1.5 font-display">{club.goals}</td>
                            <td className="px-3 py-1.5 font-display">{club.assists}</td>
                            <td className="px-3 py-1.5 font-display">{club.goalContributions}</td>
                            <td className="px-3 py-1.5">{club.yellowCards} / {club.redCards}</td>
                            {showCleanSheets && <td className="px-3 py-1.5 font-display">{club.cleanSheets}</td>}
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </ScrollArea>
          </div>
          )}

          {loanSpells.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-warning/30 bg-warning/5">
            <div className="flex items-center gap-2 border-b border-warning/30 px-4 py-3">
              <Plane size={15} className="text-warning" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-warning">While on loan</p>
            </div>
            <p className="px-4 pt-3 text-xs text-muted-foreground">
              Form while loaned out. These figures do <span className="font-semibold text-foreground">not</span> count toward the player's club totals or records.
            </p>
            <ScrollArea scrollbars="horizontal" className="w-full">
              <table className="mt-2 min-w-[520px] w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    {["Season", "Loan club", "Apps", "Goals", "Assists", "G+A"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-body">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loanSpells.map((spell) => (
                    <tr key={`${spell.season}-${spell.loanClub}`} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2 font-medium text-foreground">{spell.season}</td>
                      <td className="px-3 py-2 text-foreground">{spell.loanClub}</td>
                      <td className="px-3 py-2 font-display">{spell.matches}</td>
                      <td className="px-3 py-2 font-display font-bold">{spell.goals}</td>
                      <td className="px-3 py-2 font-display">{spell.assists}</td>
                      <td className="px-3 py-2 font-display text-primary">{spell.goalContributions}</td>
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
              Close
            </button>
            <button
              type="button"
              onClick={() => { onOpenChange(false); onEdit(); }}
              className="flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-[opacity,transform] hover:opacity-90 active:scale-[0.97]"
            >
              <Pencil size={14} /> Edit player
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
