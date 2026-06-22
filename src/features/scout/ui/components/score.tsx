import { useMemo } from "react";
import { BadgeEuro, Calendar, SlidersHorizontal, Sparkles, Star, Target, X } from "lucide-react";
import type { ElementType } from "react";
import type { ApiPlaybook, Fc26Player } from "@/shared/api/client";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { buildScoutScore, SCOUT_COMPONENT_META, type ScoutComponentKey, type ScoutScoreComponent } from "@/features/scout/lib/scoutScore";
import { formatScore, scoreToneClass } from "@/features/scout/lib/format";
import { PlayerAvatar } from "./common";

export const SCOUT_COMPONENT_ICONS: Record<ScoutComponentKey, ElementType> = {
  overall: Star,
  potential: Sparkles,
  age: Calendar,
  historicalFit: Target,
  marketValue: BadgeEuro,
  wage: BadgeEuro,
};

export function ScoreComponentRow({ component }: { component: ScoutScoreComponent }) {
  const Icon = SCOUT_COMPONENT_ICONS[component.key];
  return (
    <div
      className={`rounded-md border p-3 ${
        component.available ? "border-border bg-background/35" : "border-border/40 bg-background/15 opacity-75"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon size={14} className="shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{component.label}</p>
            <p className="truncate text-[10px] text-muted-foreground/70">{component.help}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-display text-lg font-bold leading-none ${scoreToneClass(component.score)}`}>
            {formatScore(component.score)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {component.share != null ? `${Math.round(component.share)}% weight` : `weight ${component.weight}`}
          </p>
        </div>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${component.available ? "bg-primary" : "bg-transparent"}`}
          style={{ width: `${component.score ?? 0}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
        <span className="text-muted-foreground">{component.valueLabel}</span>
        {component.weightedScore != null && (
          <span className="text-muted-foreground">+{component.weightedScore.toFixed(1)} to score</span>
        )}
      </div>

      {component.reason && (
        <p className={`mt-1.5 text-[11px] ${component.available ? "text-muted-foreground/70" : "text-warning"}`}>
          {component.reason}
        </p>
      )}
    </div>
  );
}

export function ScoreBreakdownModal({
  player,
  playbook,
  budgetMillions,
  onClose,
}: {
  player: Fc26Player;
  playbook: ApiPlaybook | null;
  budgetMillions: number | null;
  onClose: () => void;
}) {
  const { score, components } = useMemo(
    () => buildScoutScore(player, playbook, budgetMillions),
    [player, playbook, budgetMillions],
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 p-3 backdrop-blur-sm sm:p-5"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Scout score breakdown for ${player.name}`}
        onMouseDown={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-md border border-border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="flex min-w-0 items-center gap-3">
            <PlayerAvatar player={player} size="md" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Scout score</p>
              <h3 className="truncate font-display text-lg font-bold text-foreground">{player.name}</h3>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {playbook ? `Playbook · ${playbook.name}` : "No active playbook"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <p className={`font-display text-3xl font-bold leading-none ${scoreToneClass(score)}`}>{score ?? "—"}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">/ 100</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close breakdown"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1" viewportClassName="p-4" scrollbars="vertical">
          {!playbook ? (
            <p className="rounded-md border border-warning/25 bg-warning/10 p-4 text-sm text-warning">
              Set up a playbook to score players in the scout.
            </p>
          ) : components.length === 0 ? (
            <p className="rounded-md border border-border bg-background/35 p-4 text-sm text-muted-foreground">
              This playbook has no weighted criteria.
            </p>
          ) : (
            <div className="space-y-2.5">
              {components.map((component) => (
                <ScoreComponentRow key={component.key} component={component} />
              ))}
            </div>
          )}
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/70">
            Weighted average of the available criteria, mirroring the scout engine. The server
            stays the source of truth for the final ranking.
          </p>
        </ScrollArea>
      </section>
    </div>
  );
}

export function ScorePill({ value, onClick }: { value: number | null; onClick?: () => void }) {
  const color = scoreToneClass(value);
  const content = (
    <>
      <p className="text-[9px] font-semibold text-primary/70">SCORE</p>
      <p className={`font-display text-sm font-bold ${color}`}>{value ?? "—"}</p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title="View score breakdown"
        className="group rounded border border-primary/20 bg-primary/8 px-2 py-1 text-center transition-colors hover:border-primary/50 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className="rounded border border-primary/20 bg-primary/8 px-2 py-1 text-center"
      title={value !== null ? `Scout Score: ${value}/100` : "Score unavailable"}
    >
      {content}
    </div>
  );
}

export function ComparisonScoreTable({
  players,
  playbook,
  budgetMillions,
}: {
  players: Fc26Player[];
  playbook: ApiPlaybook | null;
  budgetMillions: number | null;
}) {
  const evaluated = useMemo(
    () => players.map((player) => ({ player, result: buildScoutScore(player, playbook, budgetMillions) })),
    [players, playbook, budgetMillions],
  );

  if (!playbook) {
    return (
      <div className="overflow-hidden rounded-md border border-border bg-card/55">
        <div className="flex items-center gap-2 border-b border-border bg-muted/25 px-3 py-2">
          <SlidersHorizontal size={15} className="text-primary" />
          <p className="font-display text-sm font-bold text-foreground">Scout Score</p>
        </div>
        <p className="px-3 py-3 text-xs text-muted-foreground">
          Set a default playbook to compare scout scores side by side.
        </p>
      </div>
    );
  }

  const criteria = evaluated.find((e) => e.result.components.length)?.result.components ?? [];
  const bestFinal = Math.max(...evaluated.map((e) => e.result.score ?? Number.NEGATIVE_INFINITY));
  const bestByKey = new Map<ScoutComponentKey, number>();
  criteria.forEach((crit) => {
    const scores = evaluated
      .map((e) => e.result.components.find((c) => c.key === crit.key)?.score)
      .filter((s): s is number => typeof s === "number");
    if (new Set(scores).size > 1) bestByKey.set(crit.key, Math.max(...scores));
  });

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card/55">
      <div className="flex items-center gap-2 border-b border-border bg-muted/25 px-3 py-2">
        <SlidersHorizontal size={15} className="text-primary" />
        <p className="font-display text-sm font-bold text-foreground">Scout Score</p>
        <span className="truncate text-[11px] text-muted-foreground">· {playbook.name}</span>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <th className="w-[220px] px-3 py-2 font-semibold">Criterion</th>
            {evaluated.map(({ player }) => (
              <th key={player.sofifaId} className="min-w-[180px] px-3 py-2 font-semibold">
                <span className="block truncate">{player.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border bg-background/30">
            <td className="w-[220px] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Final score
            </td>
            {evaluated.map(({ player, result }) => {
              const isBest = result.score != null && result.score === bestFinal;
              return (
                <td key={player.sofifaId} className={`min-w-[180px] px-3 py-2 ${isBest ? "bg-primary/10" : ""}`}>
                  <span className={`font-display text-xl font-bold ${scoreToneClass(result.score)}`}>
                    {result.score ?? "—"}
                  </span>
                </td>
              );
            })}
          </tr>
          {criteria.map((crit) => (
            <tr key={crit.key} className="border-b border-border last:border-b-0">
              <td className="w-[220px] px-3 py-2 text-xs font-semibold text-muted-foreground">{crit.label}</td>
              {evaluated.map(({ player, result }) => {
                const comp = result.components.find((c) => c.key === crit.key);
                const isBest = comp?.score != null && bestByKey.get(crit.key) === comp.score;
                return (
                  <td
                    key={player.sofifaId}
                    title={comp?.reason ?? comp?.valueLabel}
                    className={`min-w-[180px] px-3 py-2 text-sm ${
                      comp?.score == null
                        ? "text-muted-foreground/50"
                        : isBest
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-foreground"
                    }`}
                  >
                    <span className="block truncate">
                      {formatScore(comp?.score ?? null)}
                      <span className="ml-1 text-[10px] text-muted-foreground/70">{comp?.valueLabel}</span>
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
