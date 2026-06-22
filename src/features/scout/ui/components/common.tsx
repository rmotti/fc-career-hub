import type { ElementType, ReactNode } from "react";
import { UserRound, Target } from "lucide-react";
import type { Fc26Player, PlayerPosition } from "@/shared/api/client";
import { formatPosition, POSITION_LABELS } from "@/shared/lib/playerPositions";
import { getFitScoreTone, getFitScoreTitle, getOvrClass, getVisibleFitScore } from "@/features/scout/lib/format";

interface SummaryPillProps {
  label: string;
  value: string | number;
  icon: ElementType;
}

export function SummaryPill({ label, value, icon: Icon }: SummaryPillProps) {
  return (
    <div className="flex min-h-[46px] min-w-0 items-center gap-2 rounded-md border border-border bg-muted/35 px-3">
      <Icon size={15} className="shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p className="truncate font-display text-base font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function PositionBadge({ position }: { position: PlayerPosition }) {
  return (
    <span
      title={POSITION_LABELS[position]}
      className="inline-flex h-6 items-center rounded border border-accent/20 bg-accent/10 px-2 font-display text-xs font-bold text-accent"
    >
      {formatPosition(position)}
    </span>
  );
}

export function InfoChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-6 max-w-full items-center rounded border border-primary/20 bg-primary/10 px-2 text-xs font-semibold text-primary">
      <span className="truncate">{children}</span>
    </span>
  );
}

export function MetricLine({ label, value, icon: Icon }: { label: string; value: ReactNode; icon?: ElementType }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-background/35 px-3 py-2">
      <p className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {Icon && <Icon size={11} />}
        {label}
      </p>
      <p className="truncate font-display text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

export function RatingPill({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded border border-border bg-background/45 px-2 py-1 text-center">
      <p className="text-[9px] font-semibold text-muted-foreground">{label}</p>
      <p className="font-display text-sm font-bold text-foreground">{value ?? "—"}</p>
    </div>
  );
}

export function PlayerAvatar({ player, size }: { player: Fc26Player; size: "sm" | "md" | "lg" }) {
  const sizeClass = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-24 w-24",
  }[size];
  const initials = player.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className={`${sizeClass} relative shrink-0 overflow-hidden rounded-md border border-border bg-muted`}>
      <div className="absolute inset-0 flex items-center justify-center font-display text-sm font-bold text-muted-foreground">
        {initials || <UserRound size={18} />}
      </div>
      {player.playerFaceUrl && (
        <img
          src={player.playerFaceUrl}
          alt={player.name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
          className="relative h-full w-full object-cover"
        />
      )}
    </div>
  );
}

export function FitScoreBadge({ player, compact = false }: { player: Fc26Player; compact?: boolean }) {
  const score = getVisibleFitScore(player);
  if (score === null) return null;

  const isLowConfidence = player.fitConfidence === "low";

  return (
    <span
      title={getFitScoreTitle(player)}
      className={`inline-flex h-6 max-w-full items-center gap-1 rounded border px-2 font-display text-xs font-bold ${getFitScoreTone(player.fitConfidence)}`}
    >
      <Target size={compact ? 11 : 12} className="shrink-0" />
      <span className="truncate">Fit {score}{isLowConfidence ? "?" : ""}</span>
    </span>
  );
}

export function getOvrClassName(ovr: number) {
  return getOvrClass(ovr);
}
