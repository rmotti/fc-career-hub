import { Activity, Brain, Dumbbell, Footprints, ShieldCheck, Sparkles, Target, UserRound, type LucideIcon } from "lucide-react";

export interface AttributeFilterConfig {
  field: string;
  label: string;
  min: number;
  max: number;
}

export interface AttributeFilterGroupConfig {
  title: string;
  icon: LucideIcon;
  filters: AttributeFilterConfig[];
}

export const ATTRIBUTE_FILTER_GROUPS: AttributeFilterGroupConfig[] = [
  {
    title: "Profile",
    icon: UserRound,
    filters: [
      { field: "height", label: "Height", min: 150, max: 230 },
      { field: "weight", label: "Weight", min: 45, max: 120 },
      { field: "weakFoot", label: "Weak foot", min: 1, max: 5 },
      { field: "skillMoves", label: "Skill moves", min: 1, max: 5 },
      { field: "internationalReputation", label: "Reputation", min: 1, max: 5 },
    ],
  },
  {
    title: "General ratings",
    icon: Activity,
    filters: [
      { field: "pace", label: "Pace", min: 1, max: 99 },
      { field: "shooting", label: "Shooting", min: 1, max: 99 },
      { field: "passing", label: "Passing", min: 1, max: 99 },
      { field: "dribbling", label: "Dribbling", min: 1, max: 99 },
      { field: "defending", label: "Defending", min: 1, max: 99 },
      { field: "physic", label: "Physical", min: 1, max: 99 },
    ],
  },
  {
    title: "Attacking",
    icon: Target,
    filters: [
      { field: "attackingCrossing", label: "Crossing", min: 1, max: 99 },
      { field: "attackingFinishing", label: "Finishing", min: 1, max: 99 },
      { field: "attackingHeadingAccuracy", label: "Heading", min: 1, max: 99 },
      { field: "attackingShortPassing", label: "Short passing", min: 1, max: 99 },
      { field: "attackingVolleys", label: "Volleys", min: 1, max: 99 },
    ],
  },
  {
    title: "Skill",
    icon: Sparkles,
    filters: [
      { field: "skillDribbling", label: "Dribbling", min: 1, max: 99 },
      { field: "skillCurve", label: "Curve", min: 1, max: 99 },
      { field: "skillFkAccuracy", label: "FK accuracy", min: 1, max: 99 },
      { field: "skillLongPassing", label: "Long passing", min: 1, max: 99 },
      { field: "skillBallControl", label: "Ball control", min: 1, max: 99 },
    ],
  },
  {
    title: "Movement",
    icon: Footprints,
    filters: [
      { field: "movementAcceleration", label: "Acceleration", min: 1, max: 99 },
      { field: "movementSprintSpeed", label: "Sprint speed", min: 1, max: 99 },
      { field: "movementAgility", label: "Agility", min: 1, max: 99 },
      { field: "movementReactions", label: "Reactions", min: 1, max: 99 },
      { field: "movementBalance", label: "Balance", min: 1, max: 99 },
    ],
  },
  {
    title: "Power",
    icon: Dumbbell,
    filters: [
      { field: "powerShotPower", label: "Shot power", min: 1, max: 99 },
      { field: "powerJumping", label: "Jumping", min: 1, max: 99 },
      { field: "powerStamina", label: "Stamina", min: 1, max: 99 },
      { field: "powerStrength", label: "Strength", min: 1, max: 99 },
      { field: "powerLongShots", label: "Long shots", min: 1, max: 99 },
    ],
  },
  {
    title: "Mentality",
    icon: Brain,
    filters: [
      { field: "mentalityAggression", label: "Aggression", min: 1, max: 99 },
      { field: "mentalityInterceptions", label: "Interceptions", min: 1, max: 99 },
      { field: "mentalityPositioning", label: "Positioning", min: 1, max: 99 },
      { field: "mentalityVision", label: "Vision", min: 1, max: 99 },
      { field: "mentalityPenalties", label: "Penalties", min: 1, max: 99 },
      { field: "mentalityComposure", label: "Composure", min: 1, max: 99 },
    ],
  },
  {
    title: "Defending",
    icon: ShieldCheck,
    filters: [
      { field: "defendingMarkingAwareness", label: "Awareness", min: 1, max: 99 },
      { field: "defendingStandingTackle", label: "Standing tackle", min: 1, max: 99 },
      { field: "defendingSlidingTackle", label: "Sliding tackle", min: 1, max: 99 },
    ],
  },
  {
    title: "Goalkeeper",
    icon: UserRound,
    filters: [
      { field: "goalkeepingDiving", label: "Diving", min: 1, max: 99 },
      { field: "goalkeepingHandling", label: "Handling", min: 1, max: 99 },
      { field: "goalkeepingKicking", label: "Kicking", min: 1, max: 99 },
      { field: "goalkeepingPositioning", label: "Positioning", min: 1, max: 99 },
      { field: "goalkeepingReflexes", label: "Reflexes", min: 1, max: 99 },
      { field: "goalkeepingSpeed", label: "Speed", min: 1, max: 99 },
    ],
  },
];

export const ATTRIBUTE_FILTER_FIELDS = ATTRIBUTE_FILTER_GROUPS.flatMap((group) => group.filters);
