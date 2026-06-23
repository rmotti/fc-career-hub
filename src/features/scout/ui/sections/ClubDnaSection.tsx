import { useState } from "react";
import { ChevronDown, ChevronUp, Dna, Loader2, MapPin, ScrollText, Users } from "lucide-react";
import type { PlayerPosition } from "@/shared/api/client";
import { useClubArchetype } from "@/features/scout/model/useClubArchetype";
import type { ClubArchetypeDistributionItem, ClubArchetypeTransfer } from "@/shared/api/client";

const POSITIONS: { code: PlayerPosition; label: string; group: string }[] = [
  { code: "GOL", label: "GK", group: "GK" },
  { code: "ZAG", label: "CB", group: "DEF" },
  { code: "LD", label: "RB", group: "DEF" },
  { code: "LE", label: "LB", group: "DEF" },
  { code: "VOL", label: "DM", group: "MID" },
  { code: "MC", label: "CM", group: "MID" },
  { code: "MD", label: "RM", group: "MID" },
  { code: "ME", label: "LM", group: "MID" },
  { code: "MEI", label: "AM", group: "MID" },
  { code: "PD", label: "RW", group: "ATT" },
  { code: "PE", label: "LW", group: "ATT" },
  { code: "SA", label: "SS", group: "ATT" },
  { code: "ATA", label: "CF", group: "ATT" },
];

const GROUP_LABELS: Record<string, string> = {
  GK: "Goalkeeper",
  DEF: "Defenders",
  MID: "Midfielders",
  ATT: "Attackers",
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  medium: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  low: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  none: "border-border bg-muted/30 text-muted-foreground",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  none: "Insufficient history",
};

function DistributionBar({ items, max = 5 }: { items: ClubArchetypeDistributionItem[]; max?: number }) {
  const visible = items.slice(0, max);
  const topPct = visible[0]?.pct ?? 0;

  return (
    <div className="space-y-2">
      {visible.map((item) => (
        <div key={item.value}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-xs text-foreground">{item.value}</span>
            <span className="shrink-0 text-[11px] text-muted-foreground">{Math.round(item.pct * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${topPct > 0 ? (item.pct / topPct) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AgeProfile({ age }: { age: { median: number; p25: number; p75: number } }) {
  const min = 16;
  const max = 36;
  const span = max - min;
  const p25Pct = ((age.p25 - min) / span) * 100;
  const medianPct = ((age.median - min) / span) * 100;
  const p75Pct = ((age.p75 - min) / span) * 100;

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-1.5">
        <span className="font-display text-2xl font-bold text-foreground">{age.median.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">yrs median</span>
      </div>
      <div className="relative h-2 overflow-visible rounded-full bg-muted">
        <div
          className="absolute h-full rounded-full bg-primary/30"
          style={{ left: `${p25Pct}%`, width: `${p75Pct - p25Pct}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${medianPct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>P25: {age.p25.toFixed(1)}</span>
        <span>P75: {age.p75.toFixed(1)}</span>
      </div>
    </div>
  );
}

function HistoricalSignings({ transfers, profileSize }: { transfers: ClubArchetypeTransfer[] | undefined; profileSize: number }) {
  const [open, setOpen] = useState(false);
  const list = transfers ?? [];

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card/55">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 border-b border-border bg-muted/25 px-3 py-2.5 transition-colors hover:bg-muted/40"
      >
        <div className="flex items-center gap-2">
          <ScrollText size={14} className="shrink-0 text-muted-foreground" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Historical signings
          </p>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {profileSize}
          </span>
        </div>
        {open ? (
          <ChevronUp size={14} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        list.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted-foreground">Detailed history coming soon.</p>
        ) : (
          <div className="divide-y divide-border">
            {list.map((t, i) => (
              <div key={i} className="flex flex-wrap items-center gap-x-4 gap-y-0.5 px-4 py-2.5">
                <span className="min-w-[160px] text-sm font-semibold text-foreground">
                  {t.player_name ?? "Unknown player"}
                </span>
                <span className="text-xs text-muted-foreground">{t.transfer_season ?? "—"}</span>
                {t.from_club_name && (
                  <span className="text-xs text-muted-foreground">from {t.from_club_name}</span>
                )}
                {t.nationality && (
                  <span className="text-xs text-muted-foreground">{t.nationality}</span>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

interface Props {
  saveId: string | null | undefined;
  currentClub: string;
}

export function ClubDnaSection({ saveId, currentClub }: Props) {
  const [selectedPosition, setSelectedPosition] = useState<PlayerPosition>("ATA");
  const [calloutOpen, setCalloutOpen] = useState(true);

  const { data, isLoading, isError } = useClubArchetype(saveId, selectedPosition);

  const grouped = POSITIONS.reduce<Record<string, typeof POSITIONS>>((acc, p) => {
    acc[p.group] = [...(acc[p.group] ?? []), p];
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Explainer callout */}
      <div className="overflow-hidden rounded-md border border-primary/20 bg-primary/5">
        <button
          type="button"
          onClick={() => setCalloutOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/8"
        >
          <div className="flex items-center gap-2.5">
            <Dna size={16} className="shrink-0 text-primary" />
            <p className="text-sm font-semibold text-primary">How does the Fit Score use this?</p>
          </div>
          {calloutOpen ? (
            <ChevronUp size={15} className="shrink-0 text-primary/60" />
          ) : (
            <ChevronDown size={15} className="shrink-0 text-primary/60" />
          )}
        </button>
        {calloutOpen && (
          <p className="border-t border-primary/15 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
            The Fit Score compares each scouted player against the real signing history of{" "}
            <span className="font-semibold text-foreground">{currentClub}</span> for that position in FC 26.
            The profile below shows who the club has historically targeted — age, nationality, and origin league.
            A high score means the candidate closely mirrors that pattern.
          </p>
        )}
      </div>

      {/* Position selector */}
      <div className="overflow-hidden rounded-md border border-border bg-card/55">
        <div className="border-b border-border bg-muted/25 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Position</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-3 p-3">
          {Object.entries(grouped).map(([group, positions]) => (
            <div key={group} className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60 w-7">
                {GROUP_LABELS[group]?.slice(0, 3)}
              </span>
              <div className="flex flex-wrap gap-1">
                {positions.map((p) => (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => setSelectedPosition(p.code)}
                    className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
                      selectedPosition === p.code
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-primary/8 hover:text-primary"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content area */}
      {!saveId ? (
        <div className="rounded-md border border-warning/25 bg-warning/8 p-4 text-sm text-warning">
          Open a save to view the club's signing profile.
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading profile…</span>
        </div>
      ) : isError ? (
        <div className="rounded-md border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive-text">
          Could not load signing profile. Please try again.
        </div>
      ) : !data ? null : !data.available ? (
        <div className="rounded-md border border-border bg-muted/20 p-5">
          <p className="text-sm font-medium text-muted-foreground">No historical profile available for this club / position.</p>
          <p className="mt-1.5 text-[12px] text-muted-foreground/60">
            The fit score will rely only on general criteria for this position.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header card */}
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card/55 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {data.clubName} · {data.positionGroup}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">
                    {data.profile_size} historical signing{data.profile_size !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
            <span
              className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold ${
                CONFIDENCE_STYLES[data.confidence] ?? CONFIDENCE_STYLES.none
              }`}
            >
              {CONFIDENCE_LABELS[data.confidence] ?? data.confidence}
            </span>
          </div>

          {/* Metrics grid */}
          <div className="grid gap-3 md:grid-cols-3">
            {/* Age */}
            <div className="rounded-md border border-border bg-card/55 p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Age profile
              </p>
              <AgeProfile age={data.archetype.age} />
            </div>

            {/* Nationality */}
            <div className="rounded-md border border-border bg-card/55 p-4">
              <div className="mb-3 flex items-center gap-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Top nationalities
                </p>
              </div>
              {data.archetype.nationality.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data</p>
              ) : (
                <DistributionBar items={data.archetype.nationality} max={5} />
              )}
            </div>

            {/* Origin league */}
            <div className="rounded-md border border-border bg-card/55 p-4">
              <div className="mb-3 flex items-center gap-1.5">
                <MapPin size={13} className="text-muted-foreground" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Origin leagues
                </p>
              </div>
              {data.archetype.origin_league.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data</p>
              ) : (
                <DistributionBar items={data.archetype.origin_league} max={5} />
              )}
            </div>
          </div>

          {/* Historical signings list */}
          <HistoricalSignings transfers={data.transfers} profileSize={data.profile_size} />
        </div>
      )}
    </div>
  );
}
