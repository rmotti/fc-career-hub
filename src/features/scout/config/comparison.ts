import { Activity, Brain, Dumbbell, Footprints, ShieldCheck, Sparkles, Target, UserRound } from "lucide-react";
import type { Fc26Player } from "@/shared/api/client";
import type { ComparisonMetricConfig, PlayerComparisonGroupConfig } from "@/features/scout/ui/types";
import {
  formatAverageRating,
  formatHeight,
  formatMarketValue,
  formatPotentialGrowth,
  formatPreferredFoot,
  formatRating,
  formatStars,
  formatWage,
  getGeneralRatingAverage,
} from "@/features/scout/lib/format";
import { formatPosition } from "@/shared/lib/playerPositions";

export const COMPARISON_GROUPS: PlayerComparisonGroupConfig[] = [
  {
    title: "Quick decision",
    icon: Target,
    metrics: [
      { label: "OVR", render: (player) => player.ovr, score: (player) => player.ovr, better: "higher" },
      { label: "Potential", render: (player) => player.potential, score: (player) => player.potential, better: "higher" },
      {
        label: "Growth",
        render: (player) => formatPotentialGrowth(player),
        score: (player) => player.potential - player.ovr,
        better: "higher",
      },
      { label: "Age", render: (player) => `${player.age} yrs` },
      { label: "Value", render: (player) => formatMarketValue(player.marketValue) },
      { label: "Wage", render: (player) => formatWage(player.wage) },
      { label: "Club", render: (player) => player.club ?? "No club" },
      { label: "League", render: (player) => player.league ?? "League not provided" },
    ] satisfies ComparisonMetricConfig[],
  },
  {
    title: "General ratings",
    icon: Activity,
    metrics: [
      { label: "Tech avg", render: (player) => formatAverageRating(getGeneralRatingAverage(player)), score: getGeneralRatingAverage, better: "higher" },
      { label: "Pace", render: (player) => formatRating(player.pace), score: (player) => player.pace, better: "higher" },
      { label: "Shooting", render: (player) => formatRating(player.shooting), score: (player) => player.shooting, better: "higher" },
      { label: "Passing", render: (player) => formatRating(player.passing), score: (player) => player.passing, better: "higher" },
      { label: "Dribbling", render: (player) => formatRating(player.dribbling), score: (player) => player.dribbling, better: "higher" },
      { label: "Defending", render: (player) => formatRating(player.defending), score: (player) => player.defending, better: "higher" },
      { label: "Physical", render: (player) => formatRating(player.physic), score: (player) => player.physic, better: "higher" },
    ] satisfies ComparisonMetricConfig[],
  },
  {
    title: "Profile",
    icon: UserRound,
    metrics: [
      { label: "Primary", render: (player: Fc26Player) => (player.positions[0] ? formatPosition(player.positions[0]) : "—") },
      { label: "Secondary", render: (player: Fc26Player) => player.positions.slice(1).map(formatPosition).join(", ") || "—" },
      { label: "Nationality", render: (player) => player.nation ?? "—" },
      { label: "Height", render: (player) => formatHeight(player.height), score: (player) => player.height, better: "higher" },
      { label: "Weight", render: (player) => formatHeight(player.weight) },
      { label: "Preferred foot", render: (player) => formatPreferredFoot(player.preferredFoot) },
      { label: "Weak foot", render: (player) => formatStars(player.weakFoot), score: (player) => player.weakFoot, better: "higher" },
      { label: "Skill moves", render: (player) => formatStars(player.skillMoves), score: (player) => player.skillMoves, better: "higher" },
      {
        label: "Reputation",
        render: (player) => formatStars(player.internationalReputation),
        score: (player) => player.internationalReputation,
        better: "higher",
      },
      { label: "Work rate", render: (player) => player.workRate ?? "—" },
    ] satisfies ComparisonMetricConfig[],
  },
  {
    title: "Attacking",
    icon: Target,
    metrics: [
      { label: "Crossing", render: (player) => formatRating(player.attackingCrossing), score: (player) => player.attackingCrossing, better: "higher" },
      { label: "Finishing", render: (player) => formatRating(player.attackingFinishing), score: (player) => player.attackingFinishing, better: "higher" },
      { label: "Heading", render: (player) => formatRating(player.attackingHeadingAccuracy), score: (player) => player.attackingHeadingAccuracy, better: "higher" },
      { label: "Short passing", render: (player) => formatRating(player.attackingShortPassing), score: (player) => player.attackingShortPassing, better: "higher" },
      { label: "Volleys", render: (player) => formatRating(player.attackingVolleys), score: (player) => player.attackingVolleys, better: "higher" },
    ] satisfies ComparisonMetricConfig[],
  },
  {
    title: "Skill",
    icon: Sparkles,
    metrics: [
      { label: "Dribbling", render: (player) => formatRating(player.skillDribbling), score: (player) => player.skillDribbling, better: "higher" },
      { label: "Curve", render: (player) => formatRating(player.skillCurve), score: (player) => player.skillCurve, better: "higher" },
      { label: "FK accuracy", render: (player) => formatRating(player.skillFkAccuracy), score: (player) => player.skillFkAccuracy, better: "higher" },
      { label: "Long passing", render: (player) => formatRating(player.skillLongPassing), score: (player) => player.skillLongPassing, better: "higher" },
      { label: "Ball control", render: (player) => formatRating(player.skillBallControl), score: (player) => player.skillBallControl, better: "higher" },
    ] satisfies ComparisonMetricConfig[],
  },
  {
    title: "Movement",
    icon: Footprints,
    metrics: [
      { label: "Acceleration", render: (player) => formatRating(player.movementAcceleration), score: (player) => player.movementAcceleration, better: "higher" },
      { label: "Sprint speed", render: (player) => formatRating(player.movementSprintSpeed), score: (player) => player.movementSprintSpeed, better: "higher" },
      { label: "Agility", render: (player) => formatRating(player.movementAgility), score: (player) => player.movementAgility, better: "higher" },
      { label: "Reactions", render: (player) => formatRating(player.movementReactions), score: (player) => player.movementReactions, better: "higher" },
      { label: "Balance", render: (player) => formatRating(player.movementBalance), score: (player) => player.movementBalance, better: "higher" },
    ] satisfies ComparisonMetricConfig[],
  },
  {
    title: "Power",
    icon: Dumbbell,
    metrics: [
      { label: "Shot power", render: (player) => formatRating(player.powerShotPower), score: (player) => player.powerShotPower, better: "higher" },
      { label: "Jumping", render: (player) => formatRating(player.powerJumping), score: (player) => player.powerJumping, better: "higher" },
      { label: "Stamina", render: (player) => formatRating(player.powerStamina), score: (player) => player.powerStamina, better: "higher" },
      { label: "Strength", render: (player) => formatRating(player.powerStrength), score: (player) => player.powerStrength, better: "higher" },
      { label: "Long shots", render: (player) => formatRating(player.powerLongShots), score: (player) => player.powerLongShots, better: "higher" },
    ] satisfies ComparisonMetricConfig[],
  },
  {
    title: "Mentality",
    icon: Brain,
    metrics: [
      { label: "Aggression", render: (player) => formatRating(player.mentalityAggression), score: (player) => player.mentalityAggression, better: "higher" },
      { label: "Interceptions", render: (player) => formatRating(player.mentalityInterceptions), score: (player) => player.mentalityInterceptions, better: "higher" },
      { label: "Positioning", render: (player) => formatRating(player.mentalityPositioning), score: (player) => player.mentalityPositioning, better: "higher" },
      { label: "Vision", render: (player) => formatRating(player.mentalityVision), score: (player) => player.mentalityVision, better: "higher" },
      { label: "Penalties", render: (player) => formatRating(player.mentalityPenalties), score: (player) => player.mentalityPenalties, better: "higher" },
      { label: "Composure", render: (player) => formatRating(player.mentalityComposure), score: (player) => player.mentalityComposure, better: "higher" },
    ] satisfies ComparisonMetricConfig[],
  },
  {
    title: "Defending",
    icon: ShieldCheck,
    metrics: [
      { label: "Awareness", render: (player) => formatRating(player.defendingMarkingAwareness), score: (player) => player.defendingMarkingAwareness, better: "higher" },
      { label: "Standing tackle", render: (player) => formatRating(player.defendingStandingTackle), score: (player) => player.defendingStandingTackle, better: "higher" },
      { label: "Sliding tackle", render: (player) => formatRating(player.defendingSlidingTackle), score: (player) => player.defendingSlidingTackle, better: "higher" },
    ] satisfies ComparisonMetricConfig[],
  },
  {
    title: "Goalkeeper",
    icon: UserRound,
    metrics: [
      { label: "Diving", render: (player) => formatRating(player.goalkeepingDiving), score: (player) => player.goalkeepingDiving, better: "higher" },
      { label: "Handling", render: (player) => formatRating(player.goalkeepingHandling), score: (player) => player.goalkeepingHandling, better: "higher" },
      { label: "Kicking", render: (player) => formatRating(player.goalkeepingKicking), score: (player) => player.goalkeepingKicking, better: "higher" },
      { label: "Positioning", render: (player) => formatRating(player.goalkeepingPositioning), score: (player) => player.goalkeepingPositioning, better: "higher" },
      { label: "Reflexes", render: (player) => formatRating(player.goalkeepingReflexes), score: (player) => player.goalkeepingReflexes, better: "higher" },
      { label: "Speed", render: (player) => formatRating(player.goalkeepingSpeed), score: (player) => player.goalkeepingSpeed, better: "higher" },
    ] satisfies ComparisonMetricConfig[],
  },
];
