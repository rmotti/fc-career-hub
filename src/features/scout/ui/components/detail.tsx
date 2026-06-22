import { Activity, BadgeEuro, Brain, Calendar, Dumbbell, Footprints, Ruler, ShieldCheck, Sparkles, Star, Target, UserRound, Weight, X } from "lucide-react";
import type { ElementType } from "react";
import type { Fc26Player } from "@/shared/api/client";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { extractErrorMessage } from "@/shared/api/client";
import { formatDate, formatHeight, formatMarketValue, formatPreferredFoot, formatRating, formatStars, formatWage, getOvrClass } from "@/features/scout/lib/format";
import { isPlayStylePlus } from "@/features/scout/lib/filters";
import { FitScoreBadge, InfoChip, MetricLine, PlayerAvatar, PositionBadge } from "./common";

export function AttributeMeter({ label, value }: { label: string; value: number | null }) {
  const normalizedValue = Math.min(Math.max(value ?? 0, 0), 99);

  return (
    <div className="rounded-md border border-border bg-background/35 px-3 py-2">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="truncate text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="font-display text-sm font-bold text-foreground">{formatRating(value)}</p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${normalizedValue}%` }} />
      </div>
    </div>
  );
}

export function ChipPanel({ title, items, emptyLabel }: { title: string; items: string[]; emptyLabel: string }) {
  return (
    <div className="card-gamer p-4">
      <p className="mb-3 font-display text-sm font-bold text-foreground">{title}</p>
      {items.length ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <InfoChip key={item}>{item}</InfoChip>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

export function AttributeGroup({
  title,
  icon: Icon,
  attributes,
}: {
  title: string;
  icon: ElementType;
  attributes: Array<{ label: string; value: number | null }>;
}) {
  return (
    <div className="card-gamer p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        <p className="font-display text-sm font-bold text-foreground">{title}</p>
      </div>
      <div className="grid gap-2">
        {attributes.map((attribute) => (
          <AttributeMeter key={attribute.label} label={attribute.label} value={attribute.value} />
        ))}
      </div>
    </div>
  );
}

export function PlayerDetailDrawer({
  player,
  isLoading,
  isError,
  error,
  onClose,
}: {
  player: Fc26Player | null | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onClose: () => void;
}) {
  const generalRatings = player
    ? [
        { label: "Pace", value: player.pace },
        { label: "Final.", value: player.shooting },
        { label: "Passing", value: player.passing },
        { label: "Dribbling", value: player.dribbling },
        { label: "Defense", value: player.defending },
        { label: "Physical", value: player.physic },
      ]
    : [];
  const hasGeneralRatings = generalRatings.some((item) => item.value !== null && item.value !== undefined);
  const radarData = generalRatings.map((item) => ({ ...item, value: item.value ?? 0 }));
  const attributeGroups = player
    ? [
        {
          title: "Attack",
          icon: Target,
          attributes: [
            { label: "Crossing", value: player.attackingCrossing },
            { label: "Finishing", value: player.attackingFinishing },
            { label: "Heading", value: player.attackingHeadingAccuracy },
            { label: "Short passing", value: player.attackingShortPassing },
            { label: "Volleys", value: player.attackingVolleys },
          ],
        },
        {
          title: "Skill",
          icon: Sparkles,
          attributes: [
            { label: "Dribbling", value: player.skillDribbling },
            { label: "Curve", value: player.skillCurve },
            { label: "FK accuracy", value: player.skillFkAccuracy },
            { label: "Long passing", value: player.skillLongPassing },
            { label: "Ball control", value: player.skillBallControl },
          ],
        },
        {
          title: "Movement",
          icon: Footprints,
          attributes: [
            { label: "Acceleration", value: player.movementAcceleration },
            { label: "Sprint speed", value: player.movementSprintSpeed },
            { label: "Agility", value: player.movementAgility },
            { label: "Reactions", value: player.movementReactions },
            { label: "Balance", value: player.movementBalance },
          ],
        },
        {
          title: "Power",
          icon: Dumbbell,
          attributes: [
            { label: "Power do chute", value: player.powerShotPower },
            { label: "Jumping", value: player.powerJumping },
            { label: "Stamina", value: player.powerStamina },
            { label: "Power", value: player.powerStrength },
            { label: "Long shots", value: player.powerLongShots },
          ],
        },
        {
          title: "Mentality",
          icon: Brain,
          attributes: [
            { label: "Aggression", value: player.mentalityAggression },
            { label: "Interceptions", value: player.mentalityInterceptions },
            { label: "Positioning", value: player.mentalityPositioning },
            { label: "Vision", value: player.mentalityVision },
            { label: "Penalties", value: player.mentalityPenalties },
            { label: "Composure", value: player.mentalityComposure },
          ],
        },
        {
          title: "Defense",
          icon: ShieldCheck,
          attributes: [
            { label: "Awareness", value: player.defendingMarkingAwareness },
            { label: "Stand. tackle", value: player.defendingStandingTackle },
            { label: "Slide tackle", value: player.defendingSlidingTackle },
          ],
        },
        {
          title: "Goalkeeper",
          icon: UserRound,
          attributes: [
            { label: "Diving", value: player.goalkeepingDiving },
            { label: "Handling", value: player.goalkeepingHandling },
            { label: "Kicking", value: player.goalkeepingKicking },
            { label: "Positioning", value: player.goalkeepingPositioning },
            { label: "Reflexes", value: player.goalkeepingReflexes },
            { label: "Speed", value: player.goalkeepingSpeed },
          ],
        },
      ]
    : [];
  const playerPlayStyles = player?.playerTraits ?? [];
  const basePlayStyles = playerPlayStyles.filter((playStyle) => !isPlayStylePlus(playStyle));
  const plusPlayStyles = playerPlayStyles.filter(isPlayStylePlus);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={player ? `Details for ${player.name}` : "Player details"}
        onMouseDown={(event) => event.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-4xl flex-col overflow-hidden border-l border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border bg-card/95 p-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Scout report</p>
            <h3 className="mt-1 font-display text-xl font-bold text-foreground">{player?.name ?? "Loading player"}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close details"
          >
            <X size={16} />
          </button>
        </div>

        <ScrollArea className="min-h-0 flex-1" viewportClassName="p-4 sm:p-5" scrollbars="vertical">
          {isLoading && !player ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              Loading details...
            </div>
          ) : isError && !player ? (
            <div className="rounded-md border border-destructive/25 bg-destructive/10 p-5 text-sm text-destructive-text">
              {extractErrorMessage(error)}
            </div>
          ) : player ? (
            <div className="space-y-4">
              <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="card-gamer p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <PlayerAvatar player={player} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate font-display text-2xl font-bold text-foreground">{player.name}</h4>
                          <p className="mt-1 truncate text-sm text-muted-foreground">{player.longName ?? "Full name not provided"}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-display text-4xl font-bold leading-none ${getOvrClass(player.ovr)}`}>{player.ovr}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">OVR</p>
                          <div className="mt-2 flex justify-end">
                            <FitScoreBadge player={player} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {player.positions.map((position) => (
                          <PositionBadge key={position} position={position} />
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <MetricLine label="Potential" value={player.potential} icon={Star} />
                        <MetricLine label="Age" value={`${player.age} yr`} icon={Calendar} />
                        <MetricLine label="Height" value={formatHeight(player.height)} icon={Ruler} />
                        <MetricLine label="Foot" value={formatPreferredFoot(player.preferredFoot)} icon={Footprints} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-gamer p-4">
                  <p className="mb-3 font-display text-sm font-bold text-foreground">Market</p>
                  <div className="grid gap-2">
                    <MetricLine label="Value" value={formatMarketValue(player.marketValue)} icon={BadgeEuro} />
                    <MetricLine label="Salary" value={formatWage(player.wage)} />
                    <MetricLine label="Contract" value={player.contractUntil ?? "—"} />
                    <MetricLine label="Clause" value={formatMarketValue(player.releaseClause)} icon={BadgeEuro} />
                  </div>
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
                <div className="card-gamer p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-primary" />
                    <p className="font-display text-sm font-bold text-foreground">General ratings</p>
                  </div>
                  {hasGeneralRatings ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 99]} tick={false} axisLine={false} />
                          <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.24} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="rounded-md border border-border bg-background/35 p-4 text-sm text-muted-foreground">
                      General ratings not available for this profile.
                    </p>
                  )}
                </div>

                <div className="card-gamer p-4">
                  <p className="mb-3 font-display text-sm font-bold text-foreground">Technical summary</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {generalRatings.map((rating) => (
                      <AttributeMeter key={rating.label} label={rating.label} value={rating.value} />
                    ))}
                    <MetricLine label="Weak foot" value={formatStars(player.weakFoot)} icon={Footprints} />
                    <MetricLine label="Skill moves" value={formatStars(player.skillMoves)} icon={Sparkles} />
                    <MetricLine label="Reputation" value={formatStars(player.internationalReputation)} icon={Star} />
                    <MetricLine label="Work rate" value={player.workRate ?? "—"} />
                    <MetricLine label="Body type" value={player.bodyType ?? "—"} icon={Weight} />
                    <MetricLine label="Date of birth" value={formatDate(player.dob)} icon={Calendar} />
                  </div>
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-3">
                <ChipPanel title="Style tags" items={player.playerTags ?? []} emptyLabel="No tags registered" />
                <ChipPanel title="PlayStyles" items={basePlayStyles} emptyLabel="No PlayStyles registered" />
                <ChipPanel title="PlayStyles+" items={plusPlayStyles} emptyLabel="No PlayStyles+ registered" />
              </section>

              <section className="grid gap-4 lg:grid-cols-2">
                {attributeGroups.map((group) => (
                  <AttributeGroup key={group.title} title={group.title} icon={group.icon} attributes={group.attributes} />
                ))}
              </section>
            </div>
          ) : null}
        </ScrollArea>
      </aside>
    </div>
  );
}
