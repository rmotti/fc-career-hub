import { useEffect, useMemo, useRef, useState, type ElementType, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Archive,
  BadgeEuro,
  Bot,
  BookmarkCheck,
  BookmarkPlus,
  Brain,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  Eye,
  Footprints,
  Folder,
  FolderOpen,
  GitCompareArrows,
  ListChecks,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  Pencil,
  RotateCcw,
  Ruler,
  Save,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Trash2,
  UserRound,
  UsersRound,
  Weight,
  X,
  Zap,
} from "lucide-react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { useFc26Player, useFc26PlayerFilters, useFc26Players } from "@/features/scout/model/useFc26Players";
import { filterOutCurrentClubPlayers, isSameClubName } from "@/features/scout/model/currentClubFilter";
import { usePlaybooks } from "@/features/playbooks/model/usePlaybooks";
import {
  extractErrorMessage,
  fc26PlayersApi,
  type ApiPlaybook,
  type Fc26FitConfidence,
  type Fc26FitObjective,
  type Fc26Player,
  type Fc26PlayerFilters,
  type Fc26PlayerListParams,
  type PlayerPosition,
} from "@/shared/api/client";
import { PLAYER_POSITIONS } from "@/shared/lib/playerPositions";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/features/auth/model/useAuth";
import { useJuniorChat, type ConversationEntry } from "@/features/scout/model/useJuniorChat";

interface Props {
  section: ScoutSection;
  saveId?: string | null;
  currentClub: string;
  currentSeason: string;
}

export type ScoutSection = "ai" | "filters" | "archive" | "shortlist";

type AttributeRangeDraft = Record<string, { min: string; max: string }>;

interface AttributeFilterConfig {
  field: string;
  label: string;
  min: number;
  max: number;
}

interface AttributeFilterGroupConfig {
  title: string;
  icon: ElementType;
  filters: AttributeFilterConfig[];
}

type ComparisonDirection = "higher" | "lower";

interface ComparisonMetricConfig {
  label: string;
  render: (player: Fc26Player) => ReactNode;
  score?: (player: Fc26Player) => number | null | undefined;
  better?: ComparisonDirection;
}

interface PlayerComparisonGroupConfig {
  title: string;
  icon: ElementType;
  metrics: ComparisonMetricConfig[];
}

type DraftFilters = {
  primaryPositions: PlayerPosition[];
  secondaryPositions: PlayerPosition[];
  nations: string[];
  leagues: string[];
  clubs: string[];
  minOvr: string;
  maxOvr: string;
  minAge: string;
  maxAge: string;
  minPotential: string;
  maxPotential: string;
  minMarketValue: string;
  maxMarketValue: string;
  preferredFoot: "" | "Left" | "Right";
  objective: Fc26FitObjective;
  playStyles: string[];
  playStylesPlus: string[];
  attributeRanges: AttributeRangeDraft;
  limit: string;
};

type AppliedScoutFilters = Fc26PlayerFilters & {
  primaryPositions?: PlayerPosition[];
  secondaryPositions?: PlayerPosition[];
};

type SavedScoutQuerySource = "assistant" | "manual";

interface SavedScoutQuery {
  id: string;
  title: string;
  description: string;
  source: SavedScoutQuerySource;
  club: string;
  season: string;
  createdAt: string;
  filters: AppliedScoutFilters;
  results: Fc26Player[];
  total: number;
}

interface ShortlistPositionGroup {
  position: PlayerPosition;
  players: Fc26Player[];
}


type ScoutSortBy = NonNullable<Fc26PlayerFilters["sortBy"]>;
type ScoutSortOrder = NonNullable<Fc26PlayerFilters["sortOrder"]>;

const POSITION_LABELS: Record<PlayerPosition, string> = {
  GOL: "Goleiro",
  ZAG: "Zagueiro",
  LE: "Lateral Esquerdo",
  LD: "Lateral Direito",
  VOL: "Volante",
  MC: "Meia Central",
  ME: "Meia Esquerda",
  MD: "Meia Direita",
  MEI: "Meia Atacante",
  PE: "Ponta Esquerda",
  PD: "Ponta Direita",
  SA: "Segundo Atacante",
  ATA: "Atacante",
};

const LIMIT_OPTIONS = ["20", "40", "60", "100"];

const FOOT_LABELS: Record<"Left" | "Right", string> = {
  Left: "Canhoto",
  Right: "Destro",
};

const FIT_OBJECTIVE_LABELS: Record<Fc26FitObjective, string> = {
  balanced: "Equilibrado",
  title: "Brigar por título",
  youth: "Desenvolver base",
  rebuild: "Reconstrução",
};

const FIT_OBJECTIVE_OPTIONS: Array<{ value: Fc26FitObjective; label: string }> = [
  { value: "balanced", label: FIT_OBJECTIVE_LABELS.balanced },
  { value: "title", label: FIT_OBJECTIVE_LABELS.title },
  { value: "youth", label: FIT_OBJECTIVE_LABELS.youth },
  { value: "rebuild", label: FIT_OBJECTIVE_LABELS.rebuild },
];

const FIT_CONFIDENCE_LABELS: Record<Fc26FitConfidence, string> = {
  high: "confiança alta",
  medium: "confiança média",
  low: "confiança baixa",
  none: "sem histórico suficiente",
};

const PLAYSTYLE_OPTIONS = [
  "Acrobatic",
  "Aerial",
  "Anticipate",
  "Block",
  "Bruiser",
  "Chip Shot",
  "Dead Ball",
  "Finesse Shot",
  "First Touch",
  "Flair",
  "Incisive Pass",
  "Intercept",
  "Jockey",
  "Long Ball Pass",
  "Long Throw",
  "Pinged Pass",
  "Power Header",
  "Power Shot",
  "Press Proven",
  "Quick Step",
  "Rapid",
  "Relentless",
  "Slide Tackle",
  "Technical",
  "Tiki Taka",
  "Trivela",
  "Whipped Pass",
];

const PLAYSTYLE_PLUS_OPTIONS = PLAYSTYLE_OPTIONS.map((playStyle) => `${playStyle} +`);

const ATTRIBUTE_FILTER_GROUPS: AttributeFilterGroupConfig[] = [
  {
    title: "Perfil",
    icon: UserRound,
    filters: [
      { field: "height", label: "Altura", min: 150, max: 230 },
      { field: "weight", label: "Peso", min: 45, max: 120 },
      { field: "weakFoot", label: "Perna ruim", min: 1, max: 5 },
      { field: "skillMoves", label: "Skill moves", min: 1, max: 5 },
      { field: "internationalReputation", label: "Reputação", min: 1, max: 5 },
    ],
  },
  {
    title: "Ratings gerais",
    icon: Activity,
    filters: [
      { field: "pace", label: "Ritmo", min: 1, max: 99 },
      { field: "shooting", label: "Finalização", min: 1, max: 99 },
      { field: "passing", label: "Passe", min: 1, max: 99 },
      { field: "dribbling", label: "Drible", min: 1, max: 99 },
      { field: "defending", label: "Defesa", min: 1, max: 99 },
      { field: "physic", label: "Físico", min: 1, max: 99 },
    ],
  },
  {
    title: "Ataque",
    icon: Target,
    filters: [
      { field: "attackingCrossing", label: "Cruzamento", min: 1, max: 99 },
      { field: "attackingFinishing", label: "Finalização", min: 1, max: 99 },
      { field: "attackingHeadingAccuracy", label: "Cabeceio", min: 1, max: 99 },
      { field: "attackingShortPassing", label: "Passe curto", min: 1, max: 99 },
      { field: "attackingVolleys", label: "Voleios", min: 1, max: 99 },
    ],
  },
  {
    title: "Habilidade",
    icon: Sparkles,
    filters: [
      { field: "skillDribbling", label: "Drible", min: 1, max: 99 },
      { field: "skillCurve", label: "Curva", min: 1, max: 99 },
      { field: "skillFkAccuracy", label: "Falta", min: 1, max: 99 },
      { field: "skillLongPassing", label: "Passe longo", min: 1, max: 99 },
      { field: "skillBallControl", label: "Controle", min: 1, max: 99 },
    ],
  },
  {
    title: "Movimentação",
    icon: Footprints,
    filters: [
      { field: "movementAcceleration", label: "Aceleração", min: 1, max: 99 },
      { field: "movementSprintSpeed", label: "Sprint", min: 1, max: 99 },
      { field: "movementAgility", label: "Agilidade", min: 1, max: 99 },
      { field: "movementReactions", label: "Reações", min: 1, max: 99 },
      { field: "movementBalance", label: "Equilíbrio", min: 1, max: 99 },
    ],
  },
  {
    title: "Força",
    icon: Dumbbell,
    filters: [
      { field: "powerShotPower", label: "Força do chute", min: 1, max: 99 },
      { field: "powerJumping", label: "Impulsão", min: 1, max: 99 },
      { field: "powerStamina", label: "Fôlego", min: 1, max: 99 },
      { field: "powerStrength", label: "Força", min: 1, max: 99 },
      { field: "powerLongShots", label: "Chute longo", min: 1, max: 99 },
    ],
  },
  {
    title: "Mentalidade",
    icon: Brain,
    filters: [
      { field: "mentalityAggression", label: "Agressividade", min: 1, max: 99 },
      { field: "mentalityInterceptions", label: "Interceptações", min: 1, max: 99 },
      { field: "mentalityPositioning", label: "Posicionamento", min: 1, max: 99 },
      { field: "mentalityVision", label: "Visão", min: 1, max: 99 },
      { field: "mentalityPenalties", label: "Pênaltis", min: 1, max: 99 },
      { field: "mentalityComposure", label: "Compostura", min: 1, max: 99 },
    ],
  },
  {
    title: "Defesa",
    icon: ShieldCheck,
    filters: [
      { field: "defendingMarkingAwareness", label: "Consciência", min: 1, max: 99 },
      { field: "defendingStandingTackle", label: "Carrinho em pé", min: 1, max: 99 },
      { field: "defendingSlidingTackle", label: "Carrinho", min: 1, max: 99 },
    ],
  },
  {
    title: "Goleiro",
    icon: UserRound,
    filters: [
      { field: "goalkeepingDiving", label: "Mergulho", min: 1, max: 99 },
      { field: "goalkeepingHandling", label: "Manuseio", min: 1, max: 99 },
      { field: "goalkeepingKicking", label: "Chute", min: 1, max: 99 },
      { field: "goalkeepingPositioning", label: "Posição", min: 1, max: 99 },
      { field: "goalkeepingReflexes", label: "Reflexos", min: 1, max: 99 },
      { field: "goalkeepingSpeed", label: "Velocidade", min: 1, max: 99 },
    ],
  },
];

const ATTRIBUTE_FILTER_FIELDS = ATTRIBUTE_FILTER_GROUPS.flatMap((group) => group.filters);

function createDefaultAttributeRanges(): AttributeRangeDraft {
  return Object.fromEntries(ATTRIBUTE_FILTER_FIELDS.map((filter) => [filter.field, { min: "", max: "" }]));
}

const createDefaultDraft = (): DraftFilters => ({
  primaryPositions: [],
  secondaryPositions: [],
  nations: [],
  leagues: [],
  clubs: [],
  minOvr: "",
  maxOvr: "",
  minAge: "",
  maxAge: "",
  minPotential: "",
  maxPotential: "",
  minMarketValue: "",
  maxMarketValue: "",
  preferredFoot: "",
  objective: "balanced",
  playStyles: [],
  playStylesPlus: [],
  attributeRanges: createDefaultAttributeRanges(),
  limit: "20",
});

const DEFAULT_APPLIED_FILTERS: Fc26PlayerFilters = {
  limit: 20,
  offset: 0,
};

const SAVED_SCOUT_QUERIES_STORAGE_KEY = "fc-career-hub.saved-scout-queries";
const MAX_SAVED_SCOUT_QUERIES = 25;
const SCOUT_SHORTLIST_STORAGE_KEY = "fc-career-hub.scout-shortlist";
const MAX_SHORTLIST_PLAYERS = 80;


const GENERAL_RATING_FIELDS = ["pace", "shooting", "passing", "dribbling", "defending", "physic"] as const;
const COMPARISON_RADAR_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--gold))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
];

const COMPARISON_GROUPS: PlayerComparisonGroupConfig[] = [
  {
    title: "Decisão rápida",
    icon: Target,
    metrics: [
      { label: "OVR", render: (player) => player.ovr, score: (player) => player.ovr, better: "higher" },
      { label: "Potencial", render: (player) => player.potential, score: (player) => player.potential, better: "higher" },
      {
        label: "Crescimento",
        render: (player) => formatPotentialGrowth(player),
        score: (player) => player.potential - player.ovr,
        better: "higher",
      },
      { label: "Idade", render: (player) => `${player.age} anos` },
      { label: "Valor", render: (player) => formatMarketValue(player.marketValue) },
      { label: "Salário", render: (player) => formatWage(player.wage) },
      { label: "Clube", render: (player) => player.club ?? "Sem clube" },
      { label: "Liga", render: (player) => player.league ?? "Liga não informada" },
    ],
  },
  {
    title: "Ratings gerais",
    icon: Activity,
    metrics: [
      { label: "Média técnica", render: (player) => formatAverageRating(getGeneralRatingAverage(player)), score: getGeneralRatingAverage, better: "higher" },
      { label: "Ritmo", render: (player) => formatRating(player.pace), score: (player) => player.pace, better: "higher" },
      { label: "Finalização", render: (player) => formatRating(player.shooting), score: (player) => player.shooting, better: "higher" },
      { label: "Passe", render: (player) => formatRating(player.passing), score: (player) => player.passing, better: "higher" },
      { label: "Drible", render: (player) => formatRating(player.dribbling), score: (player) => player.dribbling, better: "higher" },
      { label: "Defesa", render: (player) => formatRating(player.defending), score: (player) => player.defending, better: "higher" },
      { label: "Físico", render: (player) => formatRating(player.physic), score: (player) => player.physic, better: "higher" },
    ],
  },
  {
    title: "Perfil",
    icon: UserRound,
    metrics: [
      { label: "Principal", render: (player) => getPrimaryPosition(player) ?? "—" },
      { label: "Secundárias", render: (player) => getSecondaryPositions(player).join(", ") || "—" },
      { label: "Nacionalidade", render: (player) => player.nation ?? "—" },
      { label: "Altura", render: (player) => formatHeight(player.height), score: (player) => player.height, better: "higher" },
      { label: "Peso", render: (player) => formatWeight(player.weight) },
      { label: "Pé dominante", render: (player) => formatPreferredFoot(player.preferredFoot) },
      { label: "Perna ruim", render: (player) => formatStars(player.weakFoot), score: (player) => player.weakFoot, better: "higher" },
      { label: "Skill moves", render: (player) => formatStars(player.skillMoves), score: (player) => player.skillMoves, better: "higher" },
      {
        label: "Reputação",
        render: (player) => formatStars(player.internationalReputation),
        score: (player) => player.internationalReputation,
        better: "higher",
      },
      { label: "Work rate", render: (player) => player.workRate ?? "—" },
    ],
  },
  {
    title: "Ataque",
    icon: Target,
    metrics: [
      { label: "Cruzamento", render: (player) => formatRating(player.attackingCrossing), score: (player) => player.attackingCrossing, better: "higher" },
      { label: "Finalização", render: (player) => formatRating(player.attackingFinishing), score: (player) => player.attackingFinishing, better: "higher" },
      {
        label: "Cabeceio",
        render: (player) => formatRating(player.attackingHeadingAccuracy),
        score: (player) => player.attackingHeadingAccuracy,
        better: "higher",
      },
      { label: "Passe curto", render: (player) => formatRating(player.attackingShortPassing), score: (player) => player.attackingShortPassing, better: "higher" },
      { label: "Voleios", render: (player) => formatRating(player.attackingVolleys), score: (player) => player.attackingVolleys, better: "higher" },
    ],
  },
  {
    title: "Habilidade",
    icon: Sparkles,
    metrics: [
      { label: "Drible", render: (player) => formatRating(player.skillDribbling), score: (player) => player.skillDribbling, better: "higher" },
      { label: "Curva", render: (player) => formatRating(player.skillCurve), score: (player) => player.skillCurve, better: "higher" },
      { label: "Falta", render: (player) => formatRating(player.skillFkAccuracy), score: (player) => player.skillFkAccuracy, better: "higher" },
      { label: "Passe longo", render: (player) => formatRating(player.skillLongPassing), score: (player) => player.skillLongPassing, better: "higher" },
      { label: "Controle", render: (player) => formatRating(player.skillBallControl), score: (player) => player.skillBallControl, better: "higher" },
    ],
  },
  {
    title: "Movimentação",
    icon: Footprints,
    metrics: [
      { label: "Aceleração", render: (player) => formatRating(player.movementAcceleration), score: (player) => player.movementAcceleration, better: "higher" },
      { label: "Sprint", render: (player) => formatRating(player.movementSprintSpeed), score: (player) => player.movementSprintSpeed, better: "higher" },
      { label: "Agilidade", render: (player) => formatRating(player.movementAgility), score: (player) => player.movementAgility, better: "higher" },
      { label: "Reações", render: (player) => formatRating(player.movementReactions), score: (player) => player.movementReactions, better: "higher" },
      { label: "Equilíbrio", render: (player) => formatRating(player.movementBalance), score: (player) => player.movementBalance, better: "higher" },
    ],
  },
  {
    title: "Força",
    icon: Dumbbell,
    metrics: [
      { label: "Força do chute", render: (player) => formatRating(player.powerShotPower), score: (player) => player.powerShotPower, better: "higher" },
      { label: "Impulsão", render: (player) => formatRating(player.powerJumping), score: (player) => player.powerJumping, better: "higher" },
      { label: "Fôlego", render: (player) => formatRating(player.powerStamina), score: (player) => player.powerStamina, better: "higher" },
      { label: "Força", render: (player) => formatRating(player.powerStrength), score: (player) => player.powerStrength, better: "higher" },
      { label: "Chute longo", render: (player) => formatRating(player.powerLongShots), score: (player) => player.powerLongShots, better: "higher" },
    ],
  },
  {
    title: "Mentalidade",
    icon: Brain,
    metrics: [
      { label: "Agressividade", render: (player) => formatRating(player.mentalityAggression), score: (player) => player.mentalityAggression, better: "higher" },
      { label: "Interceptações", render: (player) => formatRating(player.mentalityInterceptions), score: (player) => player.mentalityInterceptions, better: "higher" },
      { label: "Posicionamento", render: (player) => formatRating(player.mentalityPositioning), score: (player) => player.mentalityPositioning, better: "higher" },
      { label: "Visão", render: (player) => formatRating(player.mentalityVision), score: (player) => player.mentalityVision, better: "higher" },
      { label: "Pênaltis", render: (player) => formatRating(player.mentalityPenalties), score: (player) => player.mentalityPenalties, better: "higher" },
      { label: "Compostura", render: (player) => formatRating(player.mentalityComposure), score: (player) => player.mentalityComposure, better: "higher" },
    ],
  },
  {
    title: "Defesa",
    icon: ShieldCheck,
    metrics: [
      {
        label: "Consciência",
        render: (player) => formatRating(player.defendingMarkingAwareness),
        score: (player) => player.defendingMarkingAwareness,
        better: "higher",
      },
      {
        label: "Carrinho em pé",
        render: (player) => formatRating(player.defendingStandingTackle),
        score: (player) => player.defendingStandingTackle,
        better: "higher",
      },
      { label: "Carrinho", render: (player) => formatRating(player.defendingSlidingTackle), score: (player) => player.defendingSlidingTackle, better: "higher" },
    ],
  },
  {
    title: "Goleiro",
    icon: UserRound,
    metrics: [
      { label: "Mergulho", render: (player) => formatRating(player.goalkeepingDiving), score: (player) => player.goalkeepingDiving, better: "higher" },
      { label: "Manuseio", render: (player) => formatRating(player.goalkeepingHandling), score: (player) => player.goalkeepingHandling, better: "higher" },
      { label: "Chute", render: (player) => formatRating(player.goalkeepingKicking), score: (player) => player.goalkeepingKicking, better: "higher" },
      { label: "Posição", render: (player) => formatRating(player.goalkeepingPositioning), score: (player) => player.goalkeepingPositioning, better: "higher" },
      { label: "Reflexos", render: (player) => formatRating(player.goalkeepingReflexes), score: (player) => player.goalkeepingReflexes, better: "higher" },
      { label: "Velocidade", render: (player) => formatRating(player.goalkeepingSpeed), score: (player) => player.goalkeepingSpeed, better: "higher" },
    ],
  },
];

function readNumber(value: string) {
  if (!value.trim()) return undefined;
  const numericValue = Number(value.trim().replace(",", "."));
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function sanitizeNumberInput(value: string, allowDecimal: boolean) {
  if (!allowDecimal) return value.replace(/\D/g, "");

  const normalizedValue = value.replace(",", ".").replace(/[^\d.]/g, "");
  const [integerPart, ...fractionParts] = normalizedValue.split(".");

  return fractionParts.length ? `${integerPart}.${fractionParts.join("")}` : integerPart;
}

function validateRange(label: string, min?: number, max?: number) {
  if (typeof min === "number" && typeof max === "number" && min > max) {
    toast.error(`${label}: o mínimo não pode ser maior que o máximo.`, { duration: 4000 });
    return false;
  }

  return true;
}

function isPlayStylePlus(playStyle: string) {
  return playStyle.trim().endsWith("+");
}

function toFilterParamKey(prefix: "min" | "max", field: string) {
  return `${prefix}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
}

function buildAttributeFilters(ranges: AttributeRangeDraft): Partial<Fc26PlayerFilters> | null {
  const filters: Record<string, number> = {};

  for (const attribute of ATTRIBUTE_FILTER_FIELDS) {
    const range = ranges[attribute.field] ?? { min: "", max: "" };
    const min = readNumber(range.min);
    const max = readNumber(range.max);

    if (!validateRange(attribute.label, min, max)) return null;

    if (typeof min === "number") {
      filters[toFilterParamKey("min", attribute.field)] = min;
    }

    if (typeof max === "number") {
      filters[toFilterParamKey("max", attribute.field)] = max;
    }
  }

  return filters as Partial<Fc26PlayerFilters>;
}

function getAttributeRangeFromFilters(filters: Fc26PlayerFilters, field: string) {
  const min = filters[toFilterParamKey("min", field) as keyof Fc26PlayerFilters];
  const max = filters[toFilterParamKey("max", field) as keyof Fc26PlayerFilters];

  return {
    min: typeof min === "number" ? String(min) : "",
    max: typeof max === "number" ? String(max) : "",
  };
}

function countAttributeFiltersInDraft(ranges: AttributeRangeDraft) {
  return ATTRIBUTE_FILTER_FIELDS.reduce((count, attribute) => {
    const range = ranges[attribute.field];
    return range?.min || range?.max ? count + 1 : count;
  }, 0);
}

function countAttributeFilters(filters: Fc26PlayerFilters) {
  return ATTRIBUTE_FILTER_FIELDS.reduce((count, attribute) => {
    const min = filters[toFilterParamKey("min", attribute.field) as keyof Fc26PlayerFilters];
    const max = filters[toFilterParamKey("max", attribute.field) as keyof Fc26PlayerFilters];
    return typeof min === "number" || typeof max === "number" ? count + 1 : count;
  }, 0);
}

function getUniquePositions(...groups: PlayerPosition[][]) {
  return Array.from(new Set(groups.flat()));
}

function getPrimaryPosition(player: Fc26Player) {
  return player.positions[0] ?? null;
}

function getSecondaryPositions(player: Fc26Player) {
  return player.positions.slice(1);
}

function hasSplitPositionFilters(filters: AppliedScoutFilters | null) {
  return Boolean(filters?.primaryPositions?.length || filters?.secondaryPositions?.length);
}

function buildFiltersFromDraft(draft: DraftFilters): AppliedScoutFilters | null {
  const minOvr = readNumber(draft.minOvr);
  const maxOvr = readNumber(draft.maxOvr);
  const minAge = readNumber(draft.minAge);
  const maxAge = readNumber(draft.maxAge);
  const minPotential = readNumber(draft.minPotential);
  const maxPotential = readNumber(draft.maxPotential);
  const minMarketValue = readNumber(draft.minMarketValue);
  const maxMarketValue = readNumber(draft.maxMarketValue);
  const traits = [...draft.playStyles, ...draft.playStylesPlus];
  const attributeFilters = buildAttributeFilters(draft.attributeRanges);
  const positions = getUniquePositions(draft.primaryPositions, draft.secondaryPositions);

  if (!validateRange("OVR", minOvr, maxOvr)) return null;
  if (!validateRange("Idade", minAge, maxAge)) return null;
  if (!validateRange("Potencial", minPotential, maxPotential)) return null;
  if (!validateRange("Valor de mercado", minMarketValue, maxMarketValue)) return null;
  if (!attributeFilters) return null;

  return {
    ...(positions.length ? { positions } : {}),
    ...(draft.primaryPositions.length ? { primaryPositions: draft.primaryPositions } : {}),
    ...(draft.secondaryPositions.length ? { secondaryPositions: draft.secondaryPositions } : {}),
    ...(draft.nations.length ? { nations: draft.nations } : {}),
    ...(draft.leagues.length ? { leagues: draft.leagues } : {}),
    ...(draft.leagues.length && draft.clubs.length ? { clubs: draft.clubs } : {}),
    ...(typeof minOvr === "number" ? { minOvr } : {}),
    ...(typeof maxOvr === "number" ? { maxOvr } : {}),
    ...(typeof minAge === "number" ? { minAge } : {}),
    ...(typeof maxAge === "number" ? { maxAge } : {}),
    ...(typeof minPotential === "number" ? { minPotential } : {}),
    ...(typeof maxPotential === "number" ? { maxPotential } : {}),
    ...(typeof minMarketValue === "number" ? { minMarketValue } : {}),
    ...(typeof maxMarketValue === "number" ? { maxMarketValue } : {}),
    ...attributeFilters,
    ...(draft.preferredFoot ? { preferredFoot: draft.preferredFoot } : {}),
    objective: draft.objective,
    ...(traits.length ? { traits } : {}),
    limit: Number(draft.limit) || 20,
    offset: 0,
  };
}

function hasMeaningfulFilters(filters: AppliedScoutFilters) {
  return Boolean(
    filters.primaryPositions?.length ||
    filters.secondaryPositions?.length ||
    (!hasSplitPositionFilters(filters) && filters.positions?.length) ||
    filters.nations?.length ||
    filters.leagues?.length ||
    filters.clubs?.length ||
    typeof filters.minOvr === "number" ||
    typeof filters.maxOvr === "number" ||
    typeof filters.minAge === "number" ||
    typeof filters.maxAge === "number" ||
    typeof filters.minPotential === "number" ||
    typeof filters.maxPotential === "number" ||
    typeof filters.minMarketValue === "number" ||
    typeof filters.maxMarketValue === "number" ||
    countAttributeFilters(filters) > 0 ||
    Boolean(filters.preferredFoot) ||
    Boolean(filters.traits?.length)
  );
}

function draftFromFilters(filters: AppliedScoutFilters): DraftFilters {
  const traits = filters.traits ?? [];

  return {
    primaryPositions: filters.primaryPositions ?? filters.positions ?? [],
    secondaryPositions: filters.secondaryPositions ?? [],
    nations: filters.nations ?? [],
    leagues: filters.leagues ?? [],
    clubs: filters.clubs ?? [],
    minOvr: filters.minOvr ? String(filters.minOvr) : "",
    maxOvr: filters.maxOvr ? String(filters.maxOvr) : "",
    minAge: filters.minAge ? String(filters.minAge) : "",
    maxAge: filters.maxAge ? String(filters.maxAge) : "",
    minPotential: filters.minPotential ? String(filters.minPotential) : "",
    maxPotential: filters.maxPotential ? String(filters.maxPotential) : "",
    minMarketValue: filters.minMarketValue ? String(filters.minMarketValue) : "",
    maxMarketValue: filters.maxMarketValue ? String(filters.maxMarketValue) : "",
    preferredFoot: filters.preferredFoot ?? "",
    objective: filters.objective ?? "balanced",
    playStyles: traits.filter((trait) => !isPlayStylePlus(trait)),
    playStylesPlus: traits.filter(isPlayStylePlus),
    attributeRanges: Object.fromEntries(
      ATTRIBUTE_FILTER_FIELDS.map((attribute) => [attribute.field, getAttributeRangeFromFilters(filters, attribute.field)])
    ),
    limit: String(filters.limit ?? 20),
  };
}

function formatMarketValue(value: number | null) {
  if (value === null || value === undefined) return "—";
  return `€${value.toFixed(value >= 100 ? 0 : 1)}M`;
}

function formatWage(value: number | null) {
  if (value === null || value === undefined) return "—";
  return `€${Math.round(value)}K/sem`;
}

function formatRating(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : value;
}

function formatHeight(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${value} cm`;
}

function formatWeight(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${value} kg`;
}

function formatPreferredFoot(value: Fc26Player["preferredFoot"]) {
  return value ? FOOT_LABELS[value] : "—";
}

function formatStars(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${value}/5`;
}

function formatPotentialGrowth(player: Fc26Player) {
  const growth = player.potential - player.ovr;
  return growth > 0 ? `+${growth}` : String(growth);
}

function getGeneralRatingAverage(player: Fc26Player) {
  const values = GENERAL_RATING_FIELDS.map((field) => player[field]).filter((value): value is number => typeof value === "number");
  if (!values.length) return null;

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatAverageRating(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : value.toFixed(1);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function formatInteger(value: number) {
  return value.toLocaleString("pt-BR");
}

function getVisibleFitScore(player: Pick<Fc26Player, "fitScore" | "fitConfidence">) {
  if (player.fitConfidence === "none") return null;
  if (typeof player.fitScore !== "number" || !Number.isFinite(player.fitScore)) return null;

  return Math.round(Math.min(Math.max(player.fitScore, 0), 1) * 100);
}

function hasVisibleFitScore(player: Pick<Fc26Player, "fitScore" | "fitConfidence">) {
  return getVisibleFitScore(player) !== null;
}

function getFitScoreTone(confidence: Fc26Player["fitConfidence"]) {
  if (confidence === "low") return "border-warning/35 bg-warning/10 text-warning";
  if (confidence === "medium") return "border-accent/30 bg-accent/10 text-accent";
  return "border-primary/35 bg-primary/10 text-primary";
}

function getFitScoreTitle(player: Pick<Fc26Player, "fitScore" | "fitConfidence" | "fitProfileSize">) {
  const score = getVisibleFitScore(player);
  if (score === null) return undefined;

  const confidence = player.fitConfidence ? FIT_CONFIDENCE_LABELS[player.fitConfidence] : "confiança não informada";
  const profileSize =
    typeof player.fitProfileSize === "number" && Number.isFinite(player.fitProfileSize)
      ? `, perfil com ${player.fitProfileSize} registro${player.fitProfileSize === 1 ? "" : "s"}`
      : "";

  return `Fit score ${score}/100, ${confidence}${profileSize}`;
}

function getOvrClass(ovr: number) {
  if (ovr >= 88) return "text-gold";
  if (ovr >= 82) return "text-primary";
  if (ovr >= 76) return "text-accent";
  return "text-foreground";
}

function normalizeOption(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function getPriorityLeagueRank(league: string) {
  const normalizedLeague = normalizeOption(league);
  const priorityMap: Record<string, number> = {
    "premier league": 0,
    "la liga": 1,
    "laliga ea sports": 1,
    "bundesliga": 2,
    "serie a": 3,
    "ligue 1": 4,
  };

  return priorityMap[normalizedLeague] ?? 99;
}

function sortLeagueOptions(leagues: string[]) {
  return [...leagues].sort((a, b) => {
    const priorityDiff = getPriorityLeagueRank(a) - getPriorityLeagueRank(b);
    if (priorityDiff !== 0) return priorityDiff;
    return a.localeCompare(b, "pt-BR");
  });
}

function getSortValue(player: Fc26Player, sortBy: ScoutSortBy) {
  if (sortBy === "fitScore") return getVisibleFitScore(player);
  return sortBy === "potential" ? player.potential : player.ovr;
}

function sortPlayersForDisplay(players: Fc26Player[], filters: AppliedScoutFilters | null) {
  if (!filters?.sortBy) return players;

  const sortBy = filters.sortBy;
  const direction = filters.sortOrder === "asc" ? 1 : -1;
  const tieBreakers: ScoutSortBy[] = sortBy === "ovr"
    ? ["potential"]
    : sortBy === "potential"
      ? ["ovr"]
      : ["ovr", "potential"];

  return [...players].sort((a, b) => {
    const valueA = getSortValue(a, sortBy);
    const valueB = getSortValue(b, sortBy);

    if (valueA === null && valueB !== null) return 1;
    if (valueA !== null && valueB === null) return -1;
    if (valueA === null && valueB === null) return a.name.localeCompare(b.name, "pt-BR");

    const valueDiff = valueA - valueB;
    if (valueDiff !== 0) return valueDiff * direction;

    for (const tieBreaker of tieBreakers) {
      const tieValueA = getSortValue(a, tieBreaker);
      const tieValueB = getSortValue(b, tieBreaker);
      if (tieValueA === null || tieValueB === null) continue;

      const tieDiff = tieValueA - tieValueB;
      if (tieDiff !== 0) return tieDiff * direction;
    }

    return a.name.localeCompare(b.name, "pt-BR");
  });
}

function withScoutSaveContext(filters: AppliedScoutFilters, saveId?: string | null): Fc26PlayerListParams {
  const { objective, ...baseFilters } = filters;

  if (!saveId) return baseFilters;

  return {
    ...baseFilters,
    saveId,
    objective: objective ?? "balanced",
  };
}

function getCurrentClubFilteredTotal(total: number, rawPlayers: Fc26Player[], visiblePlayers: Fc26Player[]) {
  const hiddenCurrentClubPlayers = rawPlayers.length - visiblePlayers.length;

  return Math.max(visiblePlayers.length, total - hiddenCurrentClubPlayers);
}

function filterSavedQueryForCurrentClub(query: SavedScoutQuery, currentClub: string): SavedScoutQuery {
  const results = filterOutCurrentClubPlayers(query.results, currentClub);
  if (results.length === query.results.length) return query;

  return {
    ...query,
    results,
    total: getCurrentClubFilteredTotal(query.total, query.results, results),
  };
}

function removeCurrentClubFromAppliedFilters(filters: AppliedScoutFilters, currentClub: string): AppliedScoutFilters {
  if (!filters.clubs?.length) return filters;

  const clubs = filters.clubs.filter((club) => !isSameClubName(club, currentClub));
  if (clubs.length === filters.clubs.length) return filters;

  const nextFilters = { ...filters };
  if (clubs.length) {
    nextFilters.clubs = clubs;
  } else {
    delete nextFilters.clubs;
  }

  return nextFilters;
}

function loadSavedScoutQueries(): SavedScoutQuery[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_SCOUT_QUERIES_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item) => item?.id && item?.filters && Array.isArray(item.results))
      : [];
  } catch {
    return [];
  }
}

function loadShortlistPlayers(): Fc26Player[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(SCOUT_SHORTLIST_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is Fc26Player => typeof item?.sofifaId === "number" && Array.isArray(item.positions))
      : [];
  } catch {
    return [];
  }
}

function createQueryId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `query-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getFilterPositions(filters: AppliedScoutFilters) {
  if (hasSplitPositionFilters(filters)) {
    return getUniquePositions(filters.primaryPositions ?? [], filters.secondaryPositions ?? []);
  }

  return filters.positions ?? [];
}

function formatFilterRange(label: string, min?: number, max?: number) {
  if (typeof min === "number" && typeof max === "number") return `${label}: ${min}-${max}`;
  if (typeof min === "number") return `${label}: ${min}+`;
  if (typeof max === "number") return `${label}: até ${max}`;
  return null;
}

function formatMarketValueFilterRange(min?: number, max?: number) {
  if (typeof min === "number" && typeof max === "number") return `Valor: ${formatMarketValue(min)}-${formatMarketValue(max)}`;
  if (typeof min === "number") return `Valor: ${formatMarketValue(min)}+`;
  if (typeof max === "number") return `Valor: até ${formatMarketValue(max)}`;
  return null;
}

function getSavedQueryChips(filters: AppliedScoutFilters) {
  const chips: string[] = [];
  const positions = getFilterPositions(filters);
  const ageRange = formatFilterRange("Idade", filters.minAge, filters.maxAge);
  const ovrRange = formatFilterRange("OVR", filters.minOvr, filters.maxOvr);
  const potentialRange = formatFilterRange("Potencial", filters.minPotential, filters.maxPotential);
  const marketValueRange = formatMarketValueFilterRange(filters.minMarketValue, filters.maxMarketValue);

  if (filters.primaryPositions?.length) chips.push(`Principal: ${filters.primaryPositions.join(", ")}`);
  if (filters.secondaryPositions?.length) chips.push(`Secundária: ${filters.secondaryPositions.join(", ")}`);
  if (!hasSplitPositionFilters(filters) && positions.length) chips.push(`Posições: ${positions.join(", ")}`);
  if (filters.preferredFoot) chips.push(`Pé: ${formatPreferredFoot(filters.preferredFoot)}`);
  if (ageRange) chips.push(ageRange);
  if (ovrRange) chips.push(ovrRange);
  if (potentialRange) chips.push(potentialRange);
  if (marketValueRange) chips.push(marketValueRange);
  if (filters.objective && filters.objective !== "balanced") chips.push(`Objetivo: ${FIT_OBJECTIVE_LABELS[filters.objective]}`);
  if (filters.nations?.length) chips.push(`Nações: ${filters.nations.slice(0, 3).join(", ")}${filters.nations.length > 3 ? "..." : ""}`);
  if (filters.leagues?.length) chips.push(`Ligas: ${filters.leagues.slice(0, 2).join(", ")}${filters.leagues.length > 2 ? "..." : ""}`);
  if (filters.clubs?.length) chips.push(`Clubes: ${filters.clubs.slice(0, 2).join(", ")}${filters.clubs.length > 2 ? "..." : ""}`);
  if (filters.traits?.length) chips.push(`PlayStyles: ${filters.traits.slice(0, 2).join(", ")}${filters.traits.length > 2 ? "..." : ""}`);

  return chips;
}

function createSavedQueryTitle(filters: AppliedScoutFilters) {
  const titleParts: string[] = [];
  const positions = getFilterPositions(filters);

  if (positions.length) titleParts.push(positions.join("/"));
  if (filters.preferredFoot) titleParts.push(filters.preferredFoot === "Left" ? "canhotos" : "destros");
  if (typeof filters.maxAge === "number") titleParts.push(`sub-${filters.maxAge + 1}`);
  if (typeof filters.minPotential === "number") titleParts.push(`pot. ${filters.minPotential}+`);
  if (typeof filters.maxMarketValue === "number") titleParts.push(`até ${formatMarketValue(filters.maxMarketValue)}`);
  if (filters.objective && filters.objective !== "balanced") titleParts.push(FIT_OBJECTIVE_LABELS[filters.objective].toLocaleLowerCase("pt-BR"));

  return titleParts.length ? `Scout ${titleParts.join(" · ")}` : "Consulta de scout";
}

function formatSavedQueryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indefinida";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPositionSortIndex(position: PlayerPosition) {
  const index = PLAYER_POSITIONS.indexOf(position);
  return index === -1 ? PLAYER_POSITIONS.length : index;
}

function groupShortlistPlayers(players: Fc26Player[]): ShortlistPositionGroup[] {
  const groups = new Map<PlayerPosition, Fc26Player[]>();

  players.forEach((player) => {
    const position = getPrimaryPosition(player);
    if (!position) return;

    groups.set(position, [...(groups.get(position) ?? []), player]);
  });

  return [...groups.entries()]
    .sort(([positionA], [positionB]) => getPositionSortIndex(positionA) - getPositionSortIndex(positionB))
    .map(([position, positionPlayers]) => ({
      position,
      players: [...positionPlayers].sort((a, b) => {
        const ovrDiff = b.ovr - a.ovr;
        if (ovrDiff !== 0) return ovrDiff;

        const potentialDiff = b.potential - a.potential;
        if (potentialDiff !== 0) return potentialDiff;

        return a.name.localeCompare(b.name, "pt-BR");
      }),
    }));
}

function getAverageOvr(players: Fc26Player[]) {
  if (!players.length) return null;

  return Math.round(players.reduce((total, player) => total + player.ovr, 0) / players.length);
}

const SHORTLIST_OBJECTIVE_AGE_DEFAULTS: Record<string, { min: number; max: number }> = {
  balanced: { min: 21, max: 29 },
  title:    { min: 24, max: 31 },
  youth:    { min: 16, max: 23 },
  rebuild:  { min: 18, max: 25 },
};

function computeScoutScore(player: Fc26Player, playbook: ApiPlaybook | null | undefined): number | null {
  if (!playbook) return null;
  const weights = playbook.weights ?? {};
  const prefs = playbook.preferences ?? {};
  const objective = prefs.objective ?? "balanced";
  const ageDef = SHORTLIST_OBJECTIVE_AGE_DEFAULTS[objective] ?? SHORTLIST_OBJECTIVE_AGE_DEFAULTS.balanced;
  const ageMin = prefs.idealAgeMin ?? ageDef.min;
  const ageMax = prefs.idealAgeMax ?? ageDef.max;

  const components: { weight: number; score: number }[] = [];

  if ((weights.overall ?? 0) > 0) {
    components.push({ weight: weights.overall!, score: player.ovr });
  }
  if ((weights.potential ?? 0) > 0 && player.potential != null) {
    components.push({ weight: weights.potential!, score: player.potential });
  }
  if ((weights.age ?? 0) > 0) {
    let ageScore = 100;
    if (player.age < ageMin) ageScore = Math.max(0, 100 + (player.age - ageMin) * 8);
    else if (player.age > ageMax) ageScore = Math.max(0, 100 - (player.age - ageMax) * 8);
    components.push({ weight: weights.age!, score: ageScore });
  }
  if ((weights.historicalFit ?? 0) > 0 && player.fitScore != null) {
    const fitScore100 = Math.round(Math.min(Math.max(player.fitScore, 0), 1) * 100);
    components.push({ weight: weights.historicalFit!, score: fitScore100 });
  }
  if ((weights.marketValue ?? 0) > 0 && prefs.maxMarketValue && player.marketValue != null) {
    const maxMv = prefs.maxMarketValue * 1_000_000;
    const score = player.marketValue <= maxMv ? 100 : Math.max(0, 100 - ((player.marketValue - maxMv) / maxMv) * 100);
    components.push({ weight: weights.marketValue!, score });
  }
  if ((weights.wage ?? 0) > 0 && prefs.maxWage && player.wage != null) {
    const score = player.wage <= prefs.maxWage ? 100 : Math.max(0, 100 - ((player.wage - prefs.maxWage) / prefs.maxWage) * 100);
    components.push({ weight: weights.wage!, score });
  }

  if (components.length === 0) return null;
  const totalWeight = components.reduce((s, c) => s + c.weight, 0);
  const weightedSum = components.reduce((s, c) => s + c.weight * c.score, 0);
  return Math.round(weightedSum / totalWeight);
}

const ScoutScreen = ({ section, saveId, currentClub, currentSeason }: Props) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<DraftFilters>(() => createDefaultDraft());
  const [appliedFilters, setAppliedFilters] = useState<AppliedScoutFilters | null>(null);
  const [selectedSofifaId, setSelectedSofifaId] = useState<number | null>(null);
  const [comparisonPlayers, setComparisonPlayers] = useState<Fc26Player[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [showAdvancedAttributes, setShowAdvancedAttributes] = useState(false);
  const [savedQueries, setSavedQueries] = useState<SavedScoutQuery[]>(() => loadSavedScoutQueries());
  const [selectedSavedQueryId, setSelectedSavedQueryId] = useState<string | null>(() => loadSavedScoutQueries()[0]?.id ?? null);
  const [shortlistPlayers, setShortlistPlayers] = useState<Fc26Player[]>(() => loadShortlistPlayers());

  const { user } = useAuth();
  const {
    messages: chatMessages,
    lastResponseId: chatLastResponseId,
    history: chatHistory,
    isLoading: isChatLoading,
    isRateLimited,
    retryAfterSeconds,
    sendMessage,
    startNewConversation,
    loadConversation,
    deleteConversation,
  } = useJuniorChat(user?.id);
  const [chatInput, setChatInput] = useState("");
  const [showChatHistory, setShowChatHistory] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMessages, isChatLoading]);

  const { data: playbooksData } = usePlaybooks(saveId ?? null);
  const activePlaybook =
    playbooksData?.playbooks.find((p) => p.isDefault) ?? playbooksData?.defaultPlaybook ?? null;

  const { data, isError, isFetching, isLoading, error, refetch } = useFc26Players(appliedFilters, saveId);
  const {
    data: selectedPlayerDetails,
    isError: isSelectedPlayerError,
    isLoading: isLoadingSelectedPlayer,
    error: selectedPlayerError,
  } = useFc26Player(selectedSofifaId);
  const { data: filterMetadata, isLoading: isLoadingFilters } = useFc26PlayerFilters();

  const hasSearched = !!appliedFilters;
  const rawApiPlayers = useMemo(() => (hasSearched ? data?.players ?? [] : []), [data?.players, hasSearched]);
  const apiPlayers = useMemo(() => filterOutCurrentClubPlayers(rawApiPlayers, currentClub), [currentClub, rawApiPlayers]);
  const players = useMemo(() => sortPlayersForDisplay(apiPlayers, appliedFilters), [apiPlayers, appliedFilters]);
  const total = hasSearched ? getCurrentClubFilteredTotal(data?.total ?? 0, rawApiPlayers, apiPlayers) : 0;
  const limit = hasSearched ? data?.limit ?? appliedFilters?.limit ?? 20 : 20;
  const offset = hasSearched ? data?.offset ?? appliedFilters?.offset ?? 0 : 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const visibleStart = total === 0 || players.length === 0 ? 0 : Math.min(offset + 1, total);
  const visibleEnd = total === 0 || players.length === 0 ? 0 : Math.min(offset + players.length, total);

  const activeFilterCount = useMemo(() => {
    if (!appliedFilters) return 0;

    let count = 0;
    const splitPositionsApplied = hasSplitPositionFilters(appliedFilters);
    if (appliedFilters.primaryPositions?.length) count += 1;
    if (appliedFilters.secondaryPositions?.length) count += 1;
    if (!splitPositionsApplied && appliedFilters.positions?.length) count += 1;
    if (appliedFilters.nations?.length) count += 1;
    if (appliedFilters.leagues?.length) count += 1;
    if (appliedFilters.clubs?.length) count += 1;
    if (typeof appliedFilters.minOvr === "number") count += 1;
    if (typeof appliedFilters.maxOvr === "number") count += 1;
    if (typeof appliedFilters.minAge === "number") count += 1;
    if (typeof appliedFilters.maxAge === "number") count += 1;
    if (typeof appliedFilters.minPotential === "number") count += 1;
    if (typeof appliedFilters.maxPotential === "number") count += 1;
    if (typeof appliedFilters.minMarketValue === "number") count += 1;
    if (typeof appliedFilters.maxMarketValue === "number") count += 1;
    count += countAttributeFilters(appliedFilters);
    if (appliedFilters.preferredFoot) count += 1;
    if (appliedFilters.objective && appliedFilters.objective !== "balanced") count += 1;
    if (appliedFilters.traits?.some((trait) => !isPlayStylePlus(trait))) count += 1;
    if (appliedFilters.traits?.some(isPlayStylePlus)) count += 1;
    return count;
  }, [appliedFilters]);
  const draftAttributeFilterCount = useMemo(() => countAttributeFiltersInDraft(draft.attributeRanges), [draft.attributeRanges]);

  const featuredPlayers = players.slice(0, 3);
  const selectedPlayerPreview = useMemo(
    () => players.find((player) => player.sofifaId === selectedSofifaId) ?? null,
    [players, selectedSofifaId]
  );
  const selectedPlayer = useMemo(() => {
    if (!selectedPlayerDetails) return selectedPlayerPreview;
    if (!selectedPlayerPreview) return selectedPlayerDetails;

    return {
      ...selectedPlayerDetails,
      fitScore: selectedPlayerDetails.fitScore ?? selectedPlayerPreview.fitScore,
      fitConfidence: selectedPlayerDetails.fitConfidence ?? selectedPlayerPreview.fitConfidence,
      fitProfileSize: selectedPlayerDetails.fitProfileSize ?? selectedPlayerPreview.fitProfileSize,
    };
  }, [selectedPlayerDetails, selectedPlayerPreview]);
  const visibleComparisonPlayers = useMemo(() => filterOutCurrentClubPlayers(comparisonPlayers, currentClub), [comparisonPlayers, currentClub]);
  const comparedPlayers = useMemo(
    () =>
      visibleComparisonPlayers.map(
        (selectedPlayer) => players.find((player) => player.sofifaId === selectedPlayer.sofifaId) ?? selectedPlayer
      ),
    [players, visibleComparisonPlayers]
  );
  const comparedPlayerIds = useMemo(() => new Set(comparedPlayers.map((player) => player.sofifaId)), [comparedPlayers]);
  const shortlistedPlayerIds = useMemo(() => new Set(shortlistPlayers.map((player) => player.sofifaId)), [shortlistPlayers]);
  const visibleShortlistPlayers = useMemo(() => filterOutCurrentClubPlayers(shortlistPlayers, currentClub), [shortlistPlayers, currentClub]);
  const shortlistGroups = useMemo(() => groupShortlistPlayers(visibleShortlistPlayers), [visibleShortlistPlayers]);
  const shortlistAverageOvr = useMemo(() => getAverageOvr(visibleShortlistPlayers), [visibleShortlistPlayers]);
  const hasFitScores = useMemo(() => players.some(hasVisibleFitScore), [players]);
  const visibleSavedQueries = useMemo(
    () => savedQueries.map((query) => filterSavedQueryForCurrentClub(query, currentClub)),
    [currentClub, savedQueries]
  );
  const selectedSavedQuery = useMemo(
    () => visibleSavedQueries.find((query) => query.id === selectedSavedQueryId) ?? visibleSavedQueries[0] ?? null,
    [selectedSavedQueryId, visibleSavedQueries]
  );
  const positionOptions = useMemo(
    () => (filterMetadata?.positions?.length ? filterMetadata.positions : PLAYER_POSITIONS).filter((position) => position !== "SA"),
    [filterMetadata?.positions]
  );
  const nationOptions = useMemo(() => [...(filterMetadata?.nations ?? [])].sort((a, b) => a.localeCompare(b, "pt-BR")), [filterMetadata?.nations]);
  const leagueOptions = useMemo(() => sortLeagueOptions(filterMetadata?.leagues ?? []), [filterMetadata?.leagues]);
  const clubOptions = useMemo(() => {
    if (draft.leagues.length === 0) return [];

    const clubsByLeague = filterMetadata?.clubsByLeague ?? {};
    const options = new Set<string>();

    draft.leagues.forEach((league) => {
      clubsByLeague[league]?.forEach((club) => options.add(club));
    });

    return [...options]
      .filter((club) => !isSameClubName(club, currentClub))
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [currentClub, draft.leagues, filterMetadata?.clubsByLeague]);

  useEffect(() => {
    setDraft((current) => {
      const clubs = current.clubs.filter((club) => !isSameClubName(club, currentClub));

      return clubs.length === current.clubs.length ? current : { ...current, clubs };
    });
  }, [currentClub]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SAVED_SCOUT_QUERIES_STORAGE_KEY, JSON.stringify(savedQueries));
  }, [savedQueries]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SCOUT_SHORTLIST_STORAGE_KEY, JSON.stringify(shortlistPlayers));
  }, [shortlistPlayers]);

  useEffect(() => {
    if (selectedSavedQueryId && savedQueries.some((query) => query.id === selectedSavedQueryId)) return;
    setSelectedSavedQueryId(savedQueries[0]?.id ?? null);
  }, [savedQueries, selectedSavedQueryId]);

  const togglePrimaryPosition = (position: PlayerPosition) => {
    setDraft((current) => ({
      ...current,
      primaryPositions: current.primaryPositions.includes(position)
        ? current.primaryPositions.filter((item) => item !== position)
        : [...current.primaryPositions, position],
    }));
  };

  const toggleSecondaryPosition = (position: PlayerPosition) => {
    setDraft((current) => ({
      ...current,
      secondaryPositions: current.secondaryPositions.includes(position)
        ? current.secondaryPositions.filter((item) => item !== position)
        : [...current.secondaryPositions, position],
    }));
  };

  const applyFilters = () => {
    const draftFilters = buildFiltersFromDraft(draft);
    if (!draftFilters) return;

    const nextFilters = removeCurrentClubFromAppliedFilters(draftFilters, currentClub);

    if (!hasMeaningfulFilters(nextFilters)) {
      setAppliedFilters(null);
      toast.error("Escolha pelo menos um filtro para iniciar o scout.", { duration: 4000 });
      return;
    }

    setAppliedFilters(nextFilters);
  };

  const clearFilters = () => {
    setDraft(createDefaultDraft());
    setAppliedFilters(null);
    setComparisonPlayers([]);
    setIsComparisonOpen(false);
  };

  const saveCurrentQuery = () => {
    if (!appliedFilters || isLoading || isFetching || isError) {
      toast.error("Inicie uma busca válida antes de salvar a consulta.", { duration: 4000 });
      return;
    }

    const savedQuery: SavedScoutQuery = {
      id: createQueryId(),
      title: createSavedQueryTitle(appliedFilters),
      description: `${formatInteger(total)} jogador${total === 1 ? "" : "es"} encontrados no dataset FC 26.`,
      source: "manual",
      club: currentClub,
      season: currentSeason,
      createdAt: new Date().toISOString(),
      filters: { ...appliedFilters, offset: 0 },
      results: players,
      total,
    };

    setSavedQueries((current) => [savedQuery, ...current].slice(0, MAX_SAVED_SCOUT_QUERIES));
    setSelectedSavedQueryId(savedQuery.id);
    toast.success("Consulta salva nas pastas do Scout.", { duration: 3000 });
  };

  const editSavedQuery = (query: SavedScoutQuery) => {
    const filters = removeCurrentClubFromAppliedFilters(query.filters, currentClub);

    setDraft(draftFromFilters(filters));
    setAppliedFilters({ ...filters, offset: 0 });
    setComparisonPlayers([]);
    setIsComparisonOpen(false);
    navigate("/scout/filtros");
  };

  const removeSavedQuery = (queryId: string) => {
    setSavedQueries((current) => current.filter((query) => query.id !== queryId));
    toast.success("Consulta removida das pastas.", { duration: 3000 });
  };

  const toggleShortlistPlayer = (player: Fc26Player) => {
    const isAlreadyShortlisted = shortlistPlayers.some((shortlistedPlayer) => shortlistedPlayer.sofifaId === player.sofifaId);

    if (isAlreadyShortlisted) {
      setShortlistPlayers((current) => current.filter((shortlistedPlayer) => shortlistedPlayer.sofifaId !== player.sofifaId));
      setComparisonPlayers((current) => current.filter((comparedPlayer) => comparedPlayer.sofifaId !== player.sofifaId));
      toast.success("Jogador removido da Lista Final.", { duration: 2500 });
      return;
    }

    setShortlistPlayers((current) => [player, ...current].slice(0, MAX_SHORTLIST_PLAYERS));
    toast.success("Jogador enviado para a Lista Final.", { duration: 2500 });
  };

  const removeShortlistPlayer = (sofifaId: number) => {
    setShortlistPlayers((current) => current.filter((player) => player.sofifaId !== sofifaId));
    setComparisonPlayers((current) => {
      const nextPlayers = current.filter((player) => player.sofifaId !== sofifaId);
      if (nextPlayers.length < 2) setIsComparisonOpen(false);
      return nextPlayers;
    });
    toast.success("Jogador removido da Lista Final.", { duration: 2500 });
  };

  const goToOffset = (nextOffset: number) => {
    setAppliedFilters((current) => ({
      ...DEFAULT_APPLIED_FILTERS,
      ...current,
      offset: Math.max(nextOffset, 0),
    }));
  };

  const toggleSort = (sortBy: ScoutSortBy) => {
    setAppliedFilters((current) => {
      if (!current) return current;

      const sortOrder: ScoutSortOrder =
        current.sortBy === sortBy && current.sortOrder === "desc" ? "asc" : "desc";

      return {
        ...DEFAULT_APPLIED_FILTERS,
        ...current,
        sortBy,
        sortOrder,
        offset: 0,
      };
    });
  };

  const toggleComparePlayer = (player: Fc26Player) => {
    setComparisonPlayers((current) =>
      current.some((selectedPlayer) => selectedPlayer.sofifaId === player.sofifaId)
        ? current.filter((selectedPlayer) => selectedPlayer.sofifaId !== player.sofifaId)
        : [...current, player]
    );
  };

  const removeComparedPlayer = (sofifaId: number) => {
    setComparisonPlayers((current) => {
      const nextPlayers = current.filter((player) => player.sofifaId !== sofifaId);
      if (nextPlayers.length < 2) setIsComparisonOpen(false);
      return nextPlayers;
    });
  };

  const compareShortlistGroup = (players: Fc26Player[]) => {
    if (players.length < 2) return;

    setComparisonPlayers(players);
    setIsComparisonOpen(true);
  };

  const hasSaveContext = Boolean(saveId);
  const isAiSection = section === "ai";
  const isArchiveSection = section === "archive";
  const isShortlistSection = section === "shortlist";
  const pageTitle = isAiSection
    ? "AIssistent Coach"
    : isArchiveSection
      ? "Consultas salvas"
      : isShortlistSection
        ? "Shortlist"
        : "Buscar jogadores";

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {currentClub} · {currentSeason} · PRO
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-3xl font-bold leading-none tracking-tight text-foreground">{pageTitle}</h2>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {isAiSection ? <Bot size={13} /> : isArchiveSection ? <Archive size={13} /> : isShortlistSection ? <ListChecks size={13} /> : <Search size={13} />}
              {isAiSection ? "PRO" : isArchiveSection ? "Arquivo de pastas" : isShortlistSection ? "Lista Final" : "Dataset FC 26"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          {isAiSection ? (
            <>
              <SummaryPill label="Modo" value="Coach" icon={Bot} />
              <SummaryPill label="Status" value="Prévia" icon={LockKeyhole} />
            </>
          ) : isArchiveSection ? (
            <>
              <SummaryPill label="Pastas" value={savedQueries.length} icon={Folder} />
              <SummaryPill label="Selecionada" value={selectedSavedQuery ? selectedSavedQuery.results.length : 0} icon={UsersRound} />
            </>
          ) : isShortlistSection ? (
            <>
              <SummaryPill label="Na lista" value={visibleShortlistPlayers.length} icon={ListChecks} />
              <SummaryPill label="Posições" value={shortlistGroups.length} icon={Target} />
              <SummaryPill label="Média OVR" value={shortlistAverageOvr ?? "—"} icon={Activity} />
              <SummaryPill label="Comparando" value={comparedPlayers.length} icon={GitCompareArrows} />
            </>
          ) : (
            <>
              <SummaryPill label="Encontrados" value={formatInteger(total)} icon={UsersRound} />
              <SummaryPill label="Filtros ativos" value={activeFilterCount} icon={SlidersHorizontal} />
              <SummaryPill label="Comparando" value={comparedPlayers.length} icon={Activity} />
              <SummaryPill label="Página" value={`${currentPage}/${totalPages}`} icon={Target} />
            </>
          )}
        </div>
      </div>

      <section
        className={
          isAiSection
            ? "space-y-4"
            : isArchiveSection
              ? "grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start"
              : "space-y-4"
        }
      >
        {isAiSection && (
          <aside
            className="card-gamer flex flex-col overflow-hidden"
            style={{ height: "clamp(500px, calc(100vh - 220px), 860px)" }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold leading-none">Junior</h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Assistente técnico do Career Mode</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowChatHistory((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    showChatHistory
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-background/45 text-muted-foreground hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  <MessageSquareText size={13} />
                  Histórico
                  {chatHistory.length > 0 && (
                    <span className="ml-0.5 rounded-full bg-primary/20 px-1.5 py-0 text-[10px] font-bold text-primary">
                      {chatHistory.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { startNewConversation(chatMessages, chatLastResponseId); setShowChatHistory(false); }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/45 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
                >
                  <RotateCcw size={13} />
                  Nova
                </button>
              </div>
            </div>

            {/* History panel */}
            {showChatHistory ? (
              <ScrollArea className="min-h-0 flex-1">
                <div className="flex flex-col gap-2 p-4">
                  {chatHistory.length === 0 ? (
                    <div className="py-10 text-center">
                      <MessageSquareText size={28} className="mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-muted-foreground">Nenhuma conversa arquivada</p>
                      <p className="mt-1 text-xs text-muted-foreground/60">Inicie uma nova conversa e ela aparecerá aqui.</p>
                    </div>
                  ) : (
                    chatHistory.map((entry: ConversationEntry) => (
                      <div key={entry.id} className="rounded-md border border-border bg-background/30 p-3">
                        <p className="truncate text-sm font-semibold text-foreground">{entry.title}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          {" · "}{entry.messages.length} mensagen{entry.messages.length !== 1 ? "s" : ""}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => { loadConversation(entry, chatMessages, chatLastResponseId); setShowChatHistory(false); }}
                            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                          >
                            <RotateCcw size={11} />
                            Continuar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteConversation(entry.id)}
                            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background/45 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/25 hover:bg-destructive/5 hover:text-destructive"
                          >
                            <Trash2 size={11} />
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            ) : (
              <>
                {/* Messages */}
                <div
                  ref={chatScrollRef}
                  className="min-h-0 flex-1 overflow-y-auto"
                >
                  <div
                    role="log"
                    aria-live="polite"
                    aria-label="Conversa com Junior"
                    className="flex flex-col gap-3 p-5"
                  >
                    {chatMessages.length === 0 && (
                      <ChatBubble speaker="Junior" tone="assistant" markdown={false}>
                        Olá! Sou o Junior, seu assistente do Career Mode. Posso ajudar com análise de elenco, recomendações de mercado, táticas e muito mais. O que você precisa?
                      </ChatBubble>
                    )}
                    {chatMessages.map((msg) => (
                      <ChatBubble
                        key={msg.id}
                        speaker={msg.role === "user" ? "Você" : "Junior"}
                        tone={msg.role === "user" ? "user" : "assistant"}
                        markdown={msg.role === "assistant"}
                      >
                        {msg.content}
                      </ChatBubble>
                    ))}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="max-w-[92%] rounded-md border border-border bg-background/45 px-3 py-2">
                          <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Junior</p>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Loader2 size={13} className="animate-spin" />
                            <span className="text-sm">Pensando...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input */}
                <div className="shrink-0 border-t border-border p-4">
                  {isRateLimited && retryAfterSeconds !== null && retryAfterSeconds > 0 && (
                    <div className="mb-3 flex items-center gap-2 rounded-md border border-warning/25 bg-warning/10 px-3 py-2 text-xs text-warning">
                      <LockKeyhole size={13} />
                      <span>Muitas mensagens. Aguarde {retryAfterSeconds}s para continuar.</span>
                    </div>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!chatInput.trim()) return;
                      void sendMessage(chatInput);
                      setChatInput("");
                    }}
                    className="flex items-end gap-2"
                  >
                    <label htmlFor="junior-chat-input" className="sr-only">
                      Mensagem para o Junior
                    </label>
                    <textarea
                      id="junior-chat-input"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (!chatInput.trim()) return;
                          void sendMessage(chatInput);
                          setChatInput("");
                        }
                      }}
                      placeholder="Pergunte ao Junior… (Enter envia, Shift+Enter quebra linha)"
                      disabled={isChatLoading || isRateLimited}
                      rows={2}
                      className="min-w-0 flex-1 resize-none rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading || isRateLimited || !chatInput.trim()}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                      aria-label="Enviar mensagem"
                    >
                      {isChatLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    </button>
                  </form>
                </div>
              </>
            )}
          </aside>
        )}

        {isArchiveSection && (
          <>
            <section className="card-gamer overflow-hidden">
              <div className="border-b border-border p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                    <Folder size={19} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold leading-none">Arquivo de pastas</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Consultas salvas do Scout</p>
                  </div>
                </div>
              </div>

              {savedQueries.length === 0 ? (
                <div className="p-5 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                    <Folder size={20} />
                  </div>
                  <p className="font-display text-base font-semibold text-foreground">Nenhuma pasta salva</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Aplique uma busca em Buscar jogadores e salve a consulta para ela aparecer aqui.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {visibleSavedQueries.map((query) => {
                    const isSelected = selectedSavedQuery?.id === query.id;
                    const Icon = isSelected ? FolderOpen : Folder;

                    return (
                      <button
                        key={query.id}
                        type="button"
                        onClick={() => setSelectedSavedQueryId(query.id)}
                        className={`flex w-full items-start gap-3 p-4 text-left transition-colors ${
                          isSelected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/25"
                        }`}
                      >
                        <Icon size={18} className="mt-0.5 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{query.title}</span>
                          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{query.description}</span>
                          <span className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="rounded border border-border bg-background/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                              {query.source === "assistant" ? "AI" : "Busca"}
                            </span>
                            <span className="rounded border border-border bg-background/45 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {formatSavedQueryDate(query.createdAt)}
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="card-gamer min-w-0 overflow-hidden">
              {selectedSavedQuery ? (
                <>
                  <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {selectedSavedQuery.club} · {selectedSavedQuery.season}
                      </p>
                      <h3 className="truncate font-display text-xl font-bold leading-tight text-foreground">{selectedSavedQuery.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedSavedQuery.description}</p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editSavedQuery(selectedSavedQuery)}
                        className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        <Pencil size={15} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSavedQuery(selectedSavedQuery.id)}
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/15"
                      >
                        <Trash2 size={15} />
                        Remover
                      </button>
                    </div>
                  </div>

                  <div className="border-b border-border p-5">
                    <div className="flex flex-wrap gap-1.5">
                      {getSavedQueryChips(selectedSavedQuery.filters).map((chip) => (
                        <InfoChip key={chip}>{chip}</InfoChip>
                      ))}
                    </div>
                  </div>

                  <SavedQueryResults
                    query={selectedSavedQuery}
                    shortlistedPlayerIds={shortlistedPlayerIds}
                    onToggleShortlist={toggleShortlistPlayer}
                    onOpenDetails={setSelectedSofifaId}
                  />
                </>
              ) : (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                    <Archive size={20} />
                  </div>
                  <p className="font-display text-lg font-semibold text-foreground">Escolha uma pasta</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    As consultas salvas aparecem como pastas com filtros e snapshot de resultados.
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        {isShortlistSection && (
          <ShortlistContent
            players={visibleShortlistPlayers}
            groups={shortlistGroups}
            comparedPlayers={comparedPlayers}
            comparedPlayerIds={comparedPlayerIds}
            activePlaybook={activePlaybook}
            onToggleCompare={toggleComparePlayer}
            onClearComparison={() => {
              setComparisonPlayers([]);
              setIsComparisonOpen(false);
            }}
            onOpenComparison={() => setIsComparisonOpen(true)}
            onOpenDetails={(sofifaId) => setSelectedSofifaId(sofifaId)}
            onRemovePlayer={removeShortlistPlayer}
            onCompareGroup={compareShortlistGroup}
            onGoToScout={() => navigate("/scout/filtros")}
          />
        )}

        {!isAiSection && !isArchiveSection && !isShortlistSection && (
        <div className="min-w-0 space-y-4">
          <section className="card-gamer p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-accent/20 bg-accent/10 text-accent">
                  <Search size={19} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold leading-none">Buscar jogadores</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {hasSearched
                      ? `${visibleStart}-${visibleEnd} de ${formatInteger(total)} jogadores`
                      : "Defina filtros para iniciar a busca"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex h-9 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw size={15} />
                  Limpar
                </button>
                <button
                  type="button"
                  disabled={!hasSearched || isLoading || isFetching || isError}
                  onClick={saveCurrentQuery}
                  className="flex h-9 items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Save size={15} />
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Search size={15} />
                  Buscar
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <PositionFilterGrid
                title="Posição principal"
                description="Usa a primeira posição exibida no jogador."
                positions={positionOptions}
                selected={draft.primaryPositions}
                onToggle={togglePrimaryPosition}
                onClear={() => setDraft((current) => ({ ...current, primaryPositions: [] }))}
              />

              <PositionFilterGrid
                title="Posições secundárias"
                description="Usa as posições extras exibidas depois da principal."
                positions={positionOptions}
                selected={draft.secondaryPositions}
                onToggle={toggleSecondaryPosition}
                onClear={() => setDraft((current) => ({ ...current, secondaryPositions: [] }))}
              />

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <FilterNumberInput label="OVR mínimo" value={draft.minOvr} min={1} max={99} onChange={(minOvr) => setDraft((current) => ({ ...current, minOvr }))} />
                <FilterNumberInput label="OVR máximo" value={draft.maxOvr} min={1} max={99} onChange={(maxOvr) => setDraft((current) => ({ ...current, maxOvr }))} />
                <FilterNumberInput label="Idade mínima" value={draft.minAge} min={15} max={45} onChange={(minAge) => setDraft((current) => ({ ...current, minAge }))} />
                <FilterNumberInput label="Idade máxima" value={draft.maxAge} min={15} max={45} onChange={(maxAge) => setDraft((current) => ({ ...current, maxAge }))} />
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_160px]">
                <FilterNumberInput label="Potencial mínimo" value={draft.minPotential} min={1} max={99} onChange={(minPotential) => setDraft((current) => ({ ...current, minPotential }))} />
                <FilterNumberInput label="Potencial máximo" value={draft.maxPotential} min={1} max={99} onChange={(maxPotential) => setDraft((current) => ({ ...current, maxPotential }))} />
                <FilterNumberInput
                  label="Valor mínimo (€M)"
                  value={draft.minMarketValue}
                  min={0}
                  placeholder="Min €M"
                  allowDecimal
                  onChange={(minMarketValue) => setDraft((current) => ({ ...current, minMarketValue }))}
                />
                <FilterNumberInput
                  label="Valor máximo (€M)"
                  value={draft.maxMarketValue}
                  min={0}
                  placeholder="Max €M"
                  allowDecimal
                  onChange={(maxMarketValue) => setDraft((current) => ({ ...current, maxMarketValue }))}
                />
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Resultados</label>
                  <select
                    value={draft.limit}
                    onChange={(event) => setDraft((current) => ({ ...current, limit: event.target.value }))}
                    className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {LIMIT_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option} por página</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={`grid gap-3 ${hasSaveContext ? "lg:grid-cols-[180px_190px_minmax(0,1fr)_minmax(0,1fr)]" : "lg:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]"}`}>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Pé dominante</label>
                  <select
                    value={draft.preferredFoot}
                    onChange={(event) => setDraft((current) => ({ ...current, preferredFoot: event.target.value as DraftFilters["preferredFoot"] }))}
                    className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Qualquer pé</option>
                    <option value="Left">Canhoto</option>
                    <option value="Right">Destro</option>
                  </select>
                </div>
                {hasSaveContext && (
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Objetivo</label>
                    <select
                      value={draft.objective}
                      onChange={(event) => setDraft((current) => ({ ...current, objective: event.target.value as Fc26FitObjective }))}
                      className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      {FIT_OBJECTIVE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <MultiSelectCombobox
                  label="PlayStyles"
                  placeholder="Selecionar PlayStyles..."
                  emptyLabel="Nenhum PlayStyle encontrado"
                  options={PLAYSTYLE_OPTIONS}
                  selected={draft.playStyles}
                  onChange={(playStyles) => setDraft((current) => ({ ...current, playStyles }))}
                />
                <MultiSelectCombobox
                  label="PlayStyles+"
                  placeholder="Selecionar PlayStyles+..."
                  emptyLabel="Nenhum PlayStyle+ encontrado"
                  options={PLAYSTYLE_PLUS_OPTIONS}
                  selected={draft.playStylesPlus}
                  onChange={(playStylesPlus) => setDraft((current) => ({ ...current, playStylesPlus }))}
                />
              </div>

              <AdvancedAttributeFilters
                open={showAdvancedAttributes}
                activeCount={draftAttributeFilterCount}
                ranges={draft.attributeRanges}
                onToggle={() => setShowAdvancedAttributes((current) => !current)}
                onClear={() => setDraft((current) => ({ ...current, attributeRanges: createDefaultAttributeRanges() }))}
                onChange={(field, side, value) =>
                  setDraft((current) => ({
                    ...current,
                    attributeRanges: {
                      ...current.attributeRanges,
                      [field]: {
                        ...(current.attributeRanges[field] ?? { min: "", max: "" }),
                        [side]: value,
                      },
                    },
                  }))
                }
              />

              <div className="grid gap-3 lg:grid-cols-3">
                <MultiSelectCombobox
                  label="Nacionalidades"
                  placeholder="Buscar nacionalidade..."
                  emptyLabel={isLoadingFilters ? "Carregando nacionalidades..." : "Nenhuma nacionalidade encontrada"}
                  options={nationOptions}
                  selected={draft.nations}
                  onChange={(nations) => setDraft((current) => ({ ...current, nations }))}
                />
                <MultiSelectCombobox
                  label="Ligas"
                  placeholder="Buscar liga..."
                  emptyLabel={isLoadingFilters ? "Carregando ligas..." : "Nenhuma liga encontrada"}
                  options={leagueOptions}
                  selected={draft.leagues}
                  onChange={(leagues) => {
                    const nextClubOptions = new Set<string>();
                    const clubsByLeague = filterMetadata?.clubsByLeague ?? {};

                    leagues.forEach((league) => {
                      clubsByLeague[league]?.forEach((club) => nextClubOptions.add(club));
                    });

                    setDraft((current) => ({
                      ...current,
                      leagues,
                      clubs: current.clubs.filter((club) => nextClubOptions.has(club) && !isSameClubName(club, currentClub)),
                    }));
                  }}
                />
                <MultiSelectCombobox
                  label="Clubes"
                  placeholder={draft.leagues.length ? "Buscar clube da liga..." : "Selecione uma liga primeiro"}
                  emptyLabel={isLoadingFilters ? "Carregando clubes..." : "Nenhum clube encontrado"}
                  options={clubOptions}
                  selected={draft.clubs}
                  onChange={(clubs) => setDraft((current) => ({ ...current, clubs }))}
                  disabled={draft.leagues.length === 0}
                />
              </div>
            </div>
          </section>

          {hasSearched && featuredPlayers.length > 0 && !isError && (
            <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {featuredPlayers.map((player, index) => (
                <FeaturedPlayer key={player.sofifaId} player={player} rank={index + 1} onSelect={() => setSelectedSofifaId(player.sofifaId)} />
              ))}
            </section>
          )}

          {hasSearched && !isError && (players.length > 0 || comparedPlayers.length > 0) && (
            <PlayerComparisonLauncher
              players={comparedPlayers}
              activePlaybook={activePlaybook}
              onClear={() => {
                setComparisonPlayers([]);
                setIsComparisonOpen(false);
              }}
              onOpenComparison={() => setIsComparisonOpen(true)}
              onOpenDetails={(sofifaId) => setSelectedSofifaId(sofifaId)}
              onRemove={removeComparedPlayer}
            />
          )}

          <section className="card-gamer overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-lg font-bold leading-none">Jogadores encontrados</h3>
                {hasSearched && (
                  <p className="mt-1 text-sm text-muted-foreground">Compare os perfis encontrados e abra o detalhe para ver o relatório completo.</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={offset <= 0 || isFetching}
                  onClick={() => goToOffset(offset - limit)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="min-w-[92px] text-center font-display text-sm font-bold text-foreground">
                  {currentPage}/{totalPages}
                </span>
                <button
                  type="button"
                  disabled={offset + limit >= total || isFetching}
                  onClick={() => goToOffset(offset + limit)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Próxima página"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {!hasSearched ? (
              <div className="p-6 text-center">
                <p className="font-display text-lg font-semibold text-foreground">Nenhum scout iniciado</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  A lista fica vazia até você aplicar filtros de posição, OVR, idade, potencial, ritmo, altura, PlayStyles, PlayStyles+, nacionalidade, liga ou clube.
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 size={20} className="animate-spin" />
                Carregando jogadores...
              </div>
            ) : isError ? (
              <div className="p-6 text-center">
                <p className="font-display text-lg font-semibold text-foreground">Não foi possível carregar o scout</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{extractErrorMessage(error)}</p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-5 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <RotateCcw size={15} />
                  Tentar novamente
                </button>
              </div>
            ) : players.length === 0 ? (
              <div className="p-6 text-center">
                <p className="font-display text-lg font-semibold text-foreground">Nenhum jogador bate com esses filtros</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Abra a faixa de OVR, idade ou potencial para ampliar a busca.
                </p>
              </div>
            ) : (
              <>
                <ScrollArea scrollbars="horizontal" className="hidden w-full lg:block" viewportClassName="pb-3">
                  <table className={`w-full text-left ${hasFitScores ? "min-w-[1420px]" : "min-w-[1320px]"}`}>
                    <thead className="bg-muted/35">
                      <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        <th className="px-4 py-3 font-semibold">Jogador</th>
                        <th className="px-4 py-3 font-semibold">Posições</th>
                        {hasFitScores && (
                          <th
                            className="px-4 py-3 text-center font-semibold"
                            aria-sort={appliedFilters?.sortBy === "fitScore" ? (appliedFilters.sortOrder === "asc" ? "ascending" : "descending") : "none"}
                          >
                            <SortHeaderButton
                              label="Fit"
                              sortBy="fitScore"
                              activeSortBy={appliedFilters?.sortBy}
                              sortOrder={appliedFilters?.sortOrder}
                              onSort={toggleSort}
                            />
                          </th>
                        )}
                        <th
                          className="px-4 py-3 text-center font-semibold"
                          aria-sort={appliedFilters?.sortBy === "ovr" ? (appliedFilters.sortOrder === "asc" ? "ascending" : "descending") : "none"}
                        >
                          <SortHeaderButton
                            label="OVR"
                            sortBy="ovr"
                            activeSortBy={appliedFilters?.sortBy}
                            sortOrder={appliedFilters?.sortOrder}
                            onSort={toggleSort}
                          />
                        </th>
                        <th
                          className="px-4 py-3 text-center font-semibold"
                          aria-sort={appliedFilters?.sortBy === "potential" ? (appliedFilters.sortOrder === "asc" ? "ascending" : "descending") : "none"}
                        >
                          <SortHeaderButton
                            label="Pot."
                            sortBy="potential"
                            activeSortBy={appliedFilters?.sortBy}
                            sortOrder={appliedFilters?.sortOrder}
                            onSort={toggleSort}
                          />
                        </th>
                        <th className="px-4 py-3 font-semibold">Perfil</th>
                        <th className="px-4 py-3 font-semibold">Atributos</th>
                        <th className="px-4 py-3 font-semibold">Clube</th>
                        <th className="px-4 py-3 text-right font-semibold">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((player) => (
                        <PlayerTableRow
                          key={player.sofifaId}
                          player={player}
                          showFitScore={hasFitScores}
                          isCompareSelected={comparedPlayerIds.has(player.sofifaId)}
                          isShortlisted={shortlistedPlayerIds.has(player.sofifaId)}
                          onSelect={() => setSelectedSofifaId(player.sofifaId)}
                          onToggleCompare={() => toggleComparePlayer(player)}
                          onToggleShortlist={() => toggleShortlistPlayer(player)}
                        />
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>

                <div className="divide-y divide-border lg:hidden">
                  {players.map((player) => (
                    <PlayerMobileRow
                      key={player.sofifaId}
                      player={player}
                      showFitScore={hasFitScores}
                      isCompareSelected={comparedPlayerIds.has(player.sofifaId)}
                      isShortlisted={shortlistedPlayerIds.has(player.sofifaId)}
                      onSelect={() => setSelectedSofifaId(player.sofifaId)}
                      onToggleCompare={() => toggleComparePlayer(player)}
                      onToggleShortlist={() => toggleShortlistPlayer(player)}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
        )}
      </section>

      {selectedSofifaId && (
        <PlayerDetailDrawer
          player={selectedPlayer}
          isLoading={isLoadingSelectedPlayer}
          isError={isSelectedPlayerError}
          error={selectedPlayerError}
          onClose={() => setSelectedSofifaId(null)}
        />
      )}

      {isComparisonOpen && (
        <PlayerComparisonModal
          players={comparedPlayers}
          onClose={() => setIsComparisonOpen(false)}
          onOpenDetails={(sofifaId) => {
            setIsComparisonOpen(false);
            setSelectedSofifaId(sofifaId);
          }}
          onRemove={removeComparedPlayer}
        />
      )}
    </div>
  );
};

interface SummaryPillProps {
  label: string;
  value: string | number;
  icon: ElementType;
}

function SummaryPill({ label, value, icon: Icon }: SummaryPillProps) {
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

interface ShortlistContentProps {
  players: Fc26Player[];
  groups: ShortlistPositionGroup[];
  comparedPlayers: Fc26Player[];
  comparedPlayerIds: Set<number>;
  activePlaybook: ApiPlaybook | null;
  onToggleCompare: (player: Fc26Player) => void;
  onClearComparison: () => void;
  onOpenComparison: () => void;
  onOpenDetails: (sofifaId: number) => void;
  onRemovePlayer: (sofifaId: number) => void;
  onCompareGroup: (players: Fc26Player[]) => void;
  onGoToScout: () => void;
}

function ShortlistContent({
  players,
  groups,
  comparedPlayers,
  comparedPlayerIds,
  activePlaybook,
  onToggleCompare,
  onClearComparison,
  onOpenComparison,
  onOpenDetails,
  onRemovePlayer,
  onCompareGroup,
  onGoToScout,
}: ShortlistContentProps) {
  const hasComparisonReady = comparedPlayers.length >= 2;
  const bestGrowthPlayer = getBestMetricPlayer(players, (player) => player.potential - player.ovr);

  if (players.length === 0) {
    return (
      <section className="card-gamer p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-primary/30 bg-primary/10 text-primary">
          <ListChecks size={23} />
        </div>
        <p className="font-display text-xl font-bold text-foreground">Lista Final vazia</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Envie jogadores dos relatórios do Scout para montar uma lista curta antes da decisão de mercado.
        </p>
        <button
          type="button"
          onClick={onGoToScout}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Search size={15} />
          Buscar jogadores
        </button>
      </section>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <section className="card-gamer overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
              <ListChecks size={21} />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-xl font-bold leading-none text-foreground">Lista Final</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {players.length} jogador{players.length === 1 ? "" : "es"} separados por posição para decisão de compra.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onGoToScout}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <Search size={15} />
              Buscar mais
            </button>
            <button
              type="button"
              disabled={!hasComparisonReady}
              onClick={onOpenComparison}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <GitCompareArrows size={15} />
              Comparar seleção
            </button>
          </div>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-3">
          <ShortlistInsight label="Posições cobertas" value={groups.length} detail="Grupos por posição principal" icon={Target} />
          <ShortlistInsight label="Maior margem" value={bestGrowthPlayer ? formatPotentialGrowth(bestGrowthPlayer) : "—"} detail={bestGrowthPlayer?.name ?? "Sem dados"} icon={Star} />
          <ShortlistInsight label="Comparação" value={comparedPlayers.length} detail={hasComparisonReady ? "Pronta para abrir" : "Selecione 2 jogadores"} icon={GitCompareArrows} />
        </div>
      </section>

      {comparedPlayers.length > 0 && (
        <PlayerComparisonLauncher
          players={comparedPlayers}
          activePlaybook={activePlaybook}
          onClear={onClearComparison}
          onOpenComparison={onOpenComparison}
          onOpenDetails={onOpenDetails}
          onRemove={(sofifaId) => {
            const player = comparedPlayers.find((comparedPlayer) => comparedPlayer.sofifaId === sofifaId);
            if (player) onToggleCompare(player);
          }}
        />
      )}

      <div className="space-y-3">
        {groups.map((group) => (
          <ShortlistPositionGroupCard
            key={group.position}
            group={group}
            comparedPlayerIds={comparedPlayerIds}
            activePlaybook={activePlaybook}
            onToggleCompare={onToggleCompare}
            onOpenDetails={onOpenDetails}
            onRemovePlayer={onRemovePlayer}
            onCompareGroup={onCompareGroup}
          />
        ))}
      </div>
    </div>
  );
}

function ShortlistInsight({ label, value, detail, icon: Icon }: { label: string; value: ReactNode; detail: string; icon: ElementType }) {
  return (
    <div className="rounded-md border border-border bg-background/35 p-3">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        <Icon size={15} className="text-primary" />
        <p className="truncate text-[10px] uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className="font-display text-2xl font-bold leading-none text-foreground">{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function ShortlistPositionGroupCard({
  group,
  comparedPlayerIds,
  activePlaybook,
  onToggleCompare,
  onOpenDetails,
  onRemovePlayer,
  onCompareGroup,
}: {
  group: ShortlistPositionGroup;
  comparedPlayerIds: Set<number>;
  activePlaybook: ApiPlaybook | null;
  onToggleCompare: (player: Fc26Player) => void;
  onOpenDetails: (sofifaId: number) => void;
  onRemovePlayer: (sofifaId: number) => void;
  onCompareGroup: (players: Fc26Player[]) => void;
}) {
  const averageOvr = getAverageOvr(group.players);
  const canCompareGroup = group.players.length >= 2;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const playersListId = `shortlist-position-${group.position}`;

  return (
    <section className="card-gamer overflow-hidden">
      <div
        className={`flex flex-col gap-3 bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between ${
          isCollapsed ? "" : "border-b border-border"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsCollapsed((current) => !current)}
          aria-expanded={!isCollapsed}
          aria-controls={playersListId}
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          title={isCollapsed ? "Abrir posição" : "Minimizar posição"}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-accent/20 bg-accent/10 text-accent">
            <span className="font-display text-sm font-bold">{group.position}</span>
          </div>
          <div className="min-w-0">
            <h4 className="truncate font-display text-lg font-bold text-foreground">{POSITION_LABELS[group.position]}</h4>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {group.players.length} jogador{group.players.length === 1 ? "" : "es"} · média OVR {averageOvr ?? "—"}
            </p>
          </div>
          <ChevronDown
            size={18}
            className={`ml-auto shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground ${
              isCollapsed ? "-rotate-90" : ""
            }`}
          />
        </button>
        <button
          type="button"
          disabled={!canCompareGroup}
          onClick={() => onCompareGroup(group.players)}
          className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <GitCompareArrows size={15} />
          Comparar posição
        </button>
      </div>

      <div id={playersListId} hidden={isCollapsed} className="divide-y divide-border">
        {group.players.map((player) => (
          <ShortlistPlayerRow
            key={player.sofifaId}
            player={player}
            activePlaybook={activePlaybook}
            isCompareSelected={comparedPlayerIds.has(player.sofifaId)}
            onToggleCompare={() => onToggleCompare(player)}
            onOpenDetails={() => onOpenDetails(player.sofifaId)}
            onRemove={() => onRemovePlayer(player.sofifaId)}
          />
        ))}
      </div>
    </section>
  );
}

function ShortlistPlayerRow({
  player,
  activePlaybook,
  isCompareSelected,
  onToggleCompare,
  onOpenDetails,
  onRemove,
}: {
  player: Fc26Player;
  activePlaybook: ApiPlaybook | null;
  isCompareSelected: boolean;
  onToggleCompare: () => void;
  onOpenDetails: () => void;
  onRemove: () => void;
}) {
  const scoutScore = computeScoutScore(player, activePlaybook);

  return (
    <article className="grid gap-3 p-4 lg:grid-cols-[minmax(240px,1.4fr)_160px_180px_96px] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <PlayerAvatar player={player} size="md" />
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-foreground">{player.name}</p>
            <span className={`font-display text-lg font-bold leading-none ${getOvrClass(player.ovr)}`}>{player.ovr}</span>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{player.club ?? "Sem clube"}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <FitScoreBadge player={player} />
            {player.positions.map((position) => (
              <PositionBadge key={position} position={position} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <RatingPill label="OVR" value={player.ovr} />
        <RatingPill label="POT" value={player.potential} />
        <ScorePill value={scoutScore} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <MetricLine label="Idade" value={`${player.age} anos`} />
        <MetricLine label="Valor" value={formatMarketValue(player.marketValue)} icon={BadgeEuro} />
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleCompare}
          aria-pressed={isCompareSelected}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors ${
            isCompareSelected
              ? "border-primary/35 bg-primary/10 text-primary"
              : "border-border bg-muted/40 text-muted-foreground hover:border-primary/35 hover:text-primary"
          }`}
          title={isCompareSelected ? "Remover da comparação" : "Adicionar à comparação"}
        >
          {isCompareSelected ? <Check size={14} /> : <UsersRound size={14} />}
        </button>
        <button
          type="button"
          onClick={onOpenDetails}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
          title="Ver detalhes"
        >
          <Eye size={14} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-destructive/25 bg-destructive/10 text-destructive transition-colors hover:bg-destructive/15"
          title="Remover da Lista Final"
        >
          <X size={14} />
        </button>
      </div>
    </article>
  );
}

function SavedQueryResults({
  query,
  shortlistedPlayerIds,
  onToggleShortlist,
  onOpenDetails,
}: {
  query: SavedScoutQuery;
  shortlistedPlayerIds: Set<number>;
  onToggleShortlist: (player: Fc26Player) => void;
  onOpenDetails: (sofifaId: number) => void;
}) {
  if (query.results.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="font-display text-lg font-semibold text-foreground">Consulta salva sem resultados</p>
        <p className="mt-2 text-sm text-muted-foreground">Edite a consulta para abrir mais a faixa de filtros.</p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="font-display text-base font-bold text-foreground">Resultados da consulta</h4>
          <p className="text-sm text-muted-foreground">
            Snapshot com {query.results.length} de {formatInteger(query.total)} jogador{query.total === 1 ? "" : "es"} encontrados.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded border border-border bg-background/45 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          <Archive size={13} />
          Pasta salva
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {query.results.map((player) => {
          const isShortlisted = shortlistedPlayerIds.has(player.sofifaId);

          return (
            <article key={`${query.id}-${player.sofifaId}`} className="rounded-md border border-border bg-background/35 p-3">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <PlayerAvatar player={player} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{player.name}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{player.club ?? "Sem clube"}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`font-display text-xl font-bold leading-none ${getOvrClass(player.ovr)}`}>{player.ovr}</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">OVR</p>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                <FitScoreBadge player={player} />
                {player.positions.map((position) => (
                  <PositionBadge key={position} position={position} />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <MetricLine label="Pot." value={player.potential} />
                <MetricLine label="Idade" value={`${player.age}`} />
                <MetricLine label="Valor" value={formatMarketValue(player.marketValue)} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onToggleShortlist(player)}
                  aria-pressed={isShortlisted}
                  className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors ${
                    isShortlisted
                      ? "border-primary/35 bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-primary/35 hover:text-primary"
                  }`}
                >
                  {isShortlisted ? <BookmarkCheck size={15} /> : <BookmarkPlus size={15} />}
                  {isShortlisted ? "Na lista" : "Lista Final"}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDetails(player.sofifaId)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-muted/40 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
                >
                  <Eye size={15} />
                  Detalhes
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

interface SortHeaderButtonProps {
  label: string;
  sortBy: ScoutSortBy;
  activeSortBy?: ScoutSortBy;
  sortOrder?: ScoutSortOrder;
  onSort: (sortBy: ScoutSortBy) => void;
}

function SortHeaderButton({ label, sortBy, activeSortBy, sortOrder, onSort }: SortHeaderButtonProps) {
  const isActive = activeSortBy === sortBy;
  const Icon = sortOrder === "asc" ? ArrowUp : ArrowDown;
  const directionLabel = isActive && sortOrder === "asc" ? "menor primeiro" : "maior primeiro";

  return (
    <button
      type="button"
      onClick={() => onSort(sortBy)}
      className={`mx-auto inline-flex h-8 min-w-[58px] items-center justify-center gap-1.5 rounded-md border px-2 font-semibold transition-colors ${
        isActive
          ? "border-primary/35 bg-primary/10 text-primary"
          : "border-transparent text-muted-foreground hover:border-primary/25 hover:bg-primary/5 hover:text-foreground"
      }`}
      title={`Ordenar por ${label} (${directionLabel})`}
    >
      <span>{label}</span>
      <Icon size={12} className={isActive ? "opacity-100" : "opacity-45"} />
    </button>
  );
}

function ChatBubble({ speaker, tone, children, markdown = false }: { speaker: string; tone: "assistant" | "user"; children: ReactNode; markdown?: boolean }) {
  const isUser = tone === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-md border px-3 py-2 ${
          isUser
            ? "border-primary/25 bg-primary/10 text-primary"
            : "border-border bg-background/45 text-foreground"
        }`}
      >
        <p className={`mb-1 text-[10px] uppercase tracking-[0.16em] ${isUser ? "text-primary/70" : "text-muted-foreground"}`}>
          {speaker}
        </p>
        {markdown && typeof children === "string" ? (
          <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_table]:w-full [&_table]:text-xs [&_th]:border-b [&_th]:border-border [&_th]:pb-1 [&_th]:pr-3 [&_th]:text-left [&_th]:font-semibold [&_td]:border-b [&_td]:border-border/50 [&_td]:py-1 [&_td]:pr-3">
            <ReactMarkdown>{children}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{children}</p>
        )}
      </div>
    </div>
  );
}

function PositionFilterGrid({
  title,
  description,
  positions,
  selected,
  onToggle,
  onClear,
}: {
  title: string;
  description: string;
  positions: PlayerPosition[];
  selected: PlayerPosition[];
  onToggle: (position: PlayerPosition) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-md border border-border bg-background/25 p-3">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{title}</label>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={12} />
            Remover
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
        {positions.map((position) => {
          const isSelected = selected.includes(position);

          return (
            <button
              key={position}
              type="button"
              onClick={() => onToggle(position)}
              title={POSITION_LABELS[position]}
              className={`h-10 rounded-md border px-2 text-center font-display text-sm font-bold transition-colors ${
                isSelected
                  ? "border-primary/35 bg-primary/12 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.12)]"
                  : "border-border bg-background/35 text-muted-foreground hover:border-primary/25 hover:text-foreground"
              }`}
            >
              {position}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface FilterNumberInputProps {
  label: string;
  value: string;
  min?: number;
  max?: number;
  placeholder?: string;
  allowDecimal?: boolean;
  onChange: (value: string) => void;
}

function FilterNumberInput({ label, value, min, max, placeholder, allowDecimal = false, onChange }: FilterNumberInputProps) {
  const fallbackPlaceholder = label.toLocaleLowerCase("pt-BR").includes("máximo")
    ? (typeof max === "number" ? `Max ${max}` : "Max")
    : (typeof min === "number" ? `Min ${min}` : "Min");

  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</label>
      <NumericFilterInput
        value={value}
        min={min}
        max={max}
        placeholder={placeholder ?? fallbackPlaceholder}
        allowDecimal={allowDecimal}
        onChange={onChange}
      />
    </div>
  );
}

function NumericFilterInput({
  value,
  min,
  max,
  placeholder,
  allowDecimal = false,
  compact = false,
  ariaLabel,
  onChange,
}: {
  value: string;
  min?: number;
  max?: number;
  placeholder: string;
  allowDecimal?: boolean;
  compact?: boolean;
  ariaLabel?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      pattern={allowDecimal ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
      value={value}
      min={min}
      max={max}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(event) => onChange(sanitizeNumberInput(event.target.value, allowDecimal))}
      className={
        compact
          ? "h-8 w-full border-border bg-muted px-2 py-1 text-[11px] font-semibold text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
          : "h-10 w-full border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
      }
    />
  );
}

interface AdvancedAttributeFiltersProps {
  open: boolean;
  activeCount: number;
  ranges: AttributeRangeDraft;
  onToggle: () => void;
  onClear: () => void;
  onChange: (field: string, side: "min" | "max", value: string) => void;
}

function AdvancedAttributeFilters({ open, activeCount, ranges, onToggle, onClear, onChange }: AdvancedAttributeFiltersProps) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-background/30">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-[58px] w-full items-center justify-between gap-3 px-4 text-left transition-colors hover:bg-muted/25"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
            <SlidersHorizontal size={16} />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-sm font-bold text-foreground">Filtros avançados</span>
            <span className="block truncate text-xs text-muted-foreground">
              {activeCount > 0 ? `${activeCount} atributo${activeCount === 1 ? "" : "s"} filtrado${activeCount === 1 ? "" : "s"}` : "Ritmo, finalização, passe, defesa, físico, mentalidade e goleiro"}
            </span>
          </span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-border p-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Defina valores mínimos e máximos só nos atributos que importam para o perfil.</p>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw size={13} />
                Limpar atributos
              </button>
            )}
          </div>

          <ScrollArea className="h-[min(58vh,520px)]" viewportClassName="pr-4" scrollbars="vertical">
            <div className="grid gap-3 xl:grid-cols-2">
              {ATTRIBUTE_FILTER_GROUPS.map((group) => {
                const Icon = group.icon;

                return (
                  <div key={group.title} className="rounded-md border border-border bg-card/45 p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <Icon size={15} className="text-primary" />
                      <p className="font-display text-sm font-bold text-foreground">{group.title}</p>
                    </div>
                    <div className="grid gap-2">
                      {group.filters.map((filter) => (
                        <AttributeRangeFilter
                          key={filter.field}
                          label={filter.label}
                          min={filter.min}
                          max={filter.max}
                          value={ranges[filter.field] ?? { min: "", max: "" }}
                          onChange={(side, value) => onChange(filter.field, side, value)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

function AttributeRangeFilter({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: { min: string; max: string };
  onChange: (side: "min" | "max", value: string) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_78px_78px] items-center gap-2 rounded-md border border-border bg-background/35 px-3 py-2">
      <label className="truncate text-[11px] font-semibold text-foreground">{label}</label>
      <NumericFilterInput
        compact
        value={value.min}
        min={min}
        max={max}
        placeholder={`Min ${min}`}
        ariaLabel={`${label} mínimo`}
        onChange={(value) => onChange("min", value)}
      />
      <NumericFilterInput
        compact
        value={value.max}
        min={min}
        max={max}
        placeholder={`Max ${max}`}
        ariaLabel={`${label} máximo`}
        onChange={(value) => onChange("max", value)}
      />
    </div>
  );
}

interface MultiSelectComboboxProps {
  label: string;
  placeholder: string;
  emptyLabel: string;
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

function MultiSelectCombobox({ label, placeholder, emptyLabel, options, selected, onChange, disabled = false }: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = useMemo(() => {
    const term = normalizeOption(searchTerm);
    const selectedKeys = new Set(selected.map(normalizeOption));

    return options
      .filter((option) => !term || normalizeOption(option).includes(term))
      .slice(0, 80)
      .map((option) => ({ option, selected: selectedKeys.has(normalizeOption(option)) }));
  }, [options, searchTerm, selected]);

  const toggleOption = (option: string) => {
    const optionKey = normalizeOption(option);
    const isSelected = selected.some((item) => normalizeOption(item) === optionKey);

    if (isSelected) {
      onChange(selected.filter((item) => normalizeOption(item) !== optionKey));
      return;
    }

    if (disabled) return;

    onChange([...selected, option]);
  };

  return (
    <div className={`relative ${disabled ? "opacity-70" : ""}`}>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</label>
        {selected.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Limpar
          </button>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => !disabled && setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setOpen(true);
          }}
          className="h-10 w-full rounded-md border border-border bg-muted px-3 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
        />
        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <button
              key={item}
              type="button"
              disabled={disabled}
              onClick={() => toggleOption(item)}
              className="inline-flex min-h-7 max-w-full items-center gap-1 rounded border border-primary/25 bg-primary/10 px-2 text-xs font-semibold text-primary disabled:cursor-not-allowed"
            >
              <span className="truncate">{item}</span>
              <X size={12} className="shrink-0" />
            </button>
          ))}
        </div>
      )}

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-md border border-border bg-popover shadow-xl">
          <ScrollArea className="h-56" viewportClassName="py-1 pr-3" scrollbars="vertical">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">{emptyLabel}</p>
            ) : filteredOptions.map(({ option, selected }) => (
              <button
                key={option}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggleOption(option)}
                className={`flex min-h-9 w-full items-center justify-between gap-3 px-3 text-left text-sm transition-colors ${
                  selected
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <span className="truncate">{option}</span>
                {selected && <Check size={14} className="shrink-0" />}
              </button>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

interface PlayerComparisonLauncherProps {
  players: Fc26Player[];
  activePlaybook: ApiPlaybook | null;
  onClear: () => void;
  onOpenComparison: () => void;
  onOpenDetails: (sofifaId: number) => void;
  onRemove: (sofifaId: number) => void;
}

function PlayerComparisonLauncher({ players, activePlaybook, onClear, onOpenComparison, onOpenDetails, onRemove }: PlayerComparisonLauncherProps) {
  const hasEnoughPlayers = players.length >= 2;

  return (
    <section className="card-gamer overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
            <UsersRound size={19} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold leading-none">Comparar jogadores</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasEnoughPlayers
                ? `${players.length} jogadores prontos para abrir no relatório comparativo.`
                : "Selecione 2 ou mais jogadores nos resultados para comparar atributos."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {players.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw size={15} />
              Limpar
            </button>
          )}
          <button
            type="button"
            disabled={!hasEnoughPlayers}
            onClick={onOpenComparison}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Eye size={15} />
            Abrir comparação
          </button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {players.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {players.map((player) => (
              <ComparedPlayerCard
                key={player.sofifaId}
                player={player}
                activePlaybook={activePlaybook}
                onOpenDetails={() => onOpenDetails(player.sofifaId)}
                onRemove={() => onRemove(player.sofifaId)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-background/25 p-6 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
              <UsersRound size={19} />
            </div>
            <p className="font-display text-base font-bold text-foreground">Nenhum jogador selecionado</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Use o botão Comparar nos resultados para montar uma análise lado a lado.
            </p>
          </div>
        )}

        {players.length === 1 && (
          <div className="rounded-md border border-warning/25 bg-warning/10 p-4 text-sm text-warning">
            Selecione mais um jogador para liberar a tabela completa de atributos.
          </div>
        )}
      </div>
    </section>
  );
}

function PlayerComparisonModal({
  players,
  onClose,
  onOpenDetails,
  onRemove,
}: {
  players: Fc26Player[];
  onClose: () => void;
  onOpenDetails: (sofifaId: number) => void;
  onRemove: (sofifaId: number) => void;
}) {
  const leaderByAverage = useMemo(() => getBestMetricPlayer(players, getGeneralRatingAverage), [players]);
  const leaderByOvr = useMemo(() => getBestMetricPlayer(players, (player) => player.ovr), [players]);
  const leaderByGrowth = useMemo(() => getBestMetricPlayer(players, (player) => player.potential - player.ovr), [players]);
  const radarData = useMemo(
    () =>
      [
        { label: "Ritmo", field: "pace" },
        { label: "Final.", field: "shooting" },
        { label: "Passe", field: "passing" },
        { label: "Drible", field: "dribbling" },
        { label: "Defesa", field: "defending" },
        { label: "Físico", field: "physic" },
      ].map((item) => ({
        label: item.label,
        ...Object.fromEntries(players.map((player, index) => [`player_${index}`, player[item.field as keyof Fc26Player] ?? 0])),
      })),
    [players]
  );
  const comparisonTableWidth = Math.max(820, players.length * 190 + 220);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 p-3 backdrop-blur-sm sm:p-5" role="presentation" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Comparação de jogadores"
        onMouseDown={(event) => event.stopPropagation()}
        className="mx-auto flex h-full max-h-[940px] w-full max-w-6xl flex-col overflow-hidden rounded-md border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border bg-card/95 p-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Relatório comparativo de scout</p>
            <h3 className="mt-1 truncate font-display text-xl font-bold text-foreground">{players.length} jogadores selecionados</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Fechar comparação"
          >
            <X size={16} />
          </button>
        </div>

        <ScrollArea className="min-h-0 flex-1" viewportClassName="p-4 sm:p-5" scrollbars="vertical">
          {players.length < 2 ? (
            <div className="rounded-md border border-warning/25 bg-warning/10 p-5 text-sm text-warning">
              Selecione 2 ou mais jogadores para comparar atributos.
            </div>
          ) : (
            <div className="space-y-4">
              <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {players.map((player) => (
                  <ComparisonProfileCard
                    key={player.sofifaId}
                    player={player}
                    onOpenDetails={() => onOpenDetails(player.sofifaId)}
                    onRemove={() => onRemove(player.sofifaId)}
                  />
                ))}
              </section>

              <section className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
                <div className="card-gamer p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-primary" />
                    <p className="font-display text-sm font-bold text-foreground">Ratings gerais</p>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 99]} tick={false} axisLine={false} />
                        {players.map((player, index) => (
                          <Radar
                            key={player.sofifaId}
                            dataKey={`player_${index}`}
                            name={player.name}
                            stroke={COMPARISON_RADAR_COLORS[index % COMPARISON_RADAR_COLORS.length]}
                            fill={COMPARISON_RADAR_COLORS[index % COMPARISON_RADAR_COLORS.length]}
                            fillOpacity={0.12}
                          />
                        ))}
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {players.map((player, index) => (
                      <span key={player.sofifaId} className="inline-flex min-h-6 items-center gap-1.5 rounded border border-border bg-background/35 px-2 text-xs text-muted-foreground">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: COMPARISON_RADAR_COLORS[index % COMPARISON_RADAR_COLORS.length] }}
                        />
                        <span className="max-w-[130px] truncate">{player.name}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card-gamer p-4">
                  <p className="mb-3 font-display text-sm font-bold text-foreground">Leitura rápida</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <ComparisonHighlight
                      label="Melhor média"
                      player={leaderByAverage}
                      value={formatAverageRating(leaderByAverage ? getGeneralRatingAverage(leaderByAverage) : null)}
                    />
                    <ComparisonHighlight label="Maior OVR" player={leaderByOvr} value={leaderByOvr?.ovr ?? "—"} />
                    <ComparisonHighlight label="Mais margem" player={leaderByGrowth} value={leaderByGrowth ? formatPotentialGrowth(leaderByGrowth) : "—"} />
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {players.map((player) => (
                      <MetricLine
                        key={player.sofifaId}
                        label={player.name}
                        value={`${formatMarketValue(player.marketValue)} · ${formatWage(player.wage)}`}
                        icon={BadgeEuro}
                      />
                    ))}
                  </div>
                </div>
              </section>

              <ScrollArea scrollbars="horizontal" className="rounded-md border border-border bg-background/20" viewportClassName="pb-3">
                <div className="space-y-4 p-3" style={{ minWidth: comparisonTableWidth }}>
                  {COMPARISON_GROUPS.map((group) => (
                    <ComparisonGroupTable key={group.title} group={group} players={players} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </ScrollArea>
      </section>
    </div>
  );
}

function ComparisonProfileCard({
  player,
  onOpenDetails,
  onRemove,
}: {
  player: Fc26Player;
  onOpenDetails: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="card-gamer p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <PlayerAvatar player={player} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="truncate font-display text-xl font-bold text-foreground">{player.name}</h4>
              <p className="mt-1 truncate text-sm text-muted-foreground">{player.club ?? player.nation ?? "Sem clube"}</p>
            </div>
            <div className="text-right">
              <p className={`font-display text-4xl font-bold leading-none ${getOvrClass(player.ovr)}`}>{player.ovr}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">OVR</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {player.positions.map((position) => (
              <PositionBadge key={position} position={position} />
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <MetricLine label="Potencial" value={`${player.potential} (${formatPotentialGrowth(player)})`} icon={Star} />
            <MetricLine label="Idade" value={`${player.age} anos`} icon={Calendar} />
            <MetricLine label="Altura" value={formatHeight(player.height)} icon={Ruler} />
            <MetricLine label="Pé" value={formatPreferredFoot(player.preferredFoot)} icon={Footprints} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenDetails}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-muted/40 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
            >
              <Eye size={15} />
              Individual
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-muted/40 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <X size={15} />
              Remover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparedPlayerCard({
  player,
  activePlaybook,
  onOpenDetails,
  onRemove,
}: {
  player: Fc26Player;
  activePlaybook: ApiPlaybook | null;
  onOpenDetails: () => void;
  onRemove: () => void;
}) {
  const scoutScore = computeScoutScore(player, activePlaybook);

  return (
    <article className="rounded-md border border-border bg-background/35 p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PlayerAvatar player={player} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{player.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{player.club ?? player.nation ?? "Sem clube"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={`Remover ${player.name} da comparação`}
          title="Remover da comparação"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {player.positions.map((position) => (
          <PositionBadge key={position} position={position} />
        ))}
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <RatingPill label="OVR" value={player.ovr} />
        <RatingPill label="POT" value={player.potential} />
        <ScorePill value={scoutScore} />
      </div>

      <button
        type="button"
        onClick={onOpenDetails}
        className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-md border border-border bg-muted/40 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
      >
        <Eye size={14} />
        Relatório
      </button>
    </article>
  );
}

function ComparisonHighlight({ label, player, value }: { label: string; player: Fc26Player | null; value: ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background/35 p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 truncate font-display text-lg font-bold text-primary">{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{player?.name ?? "—"}</p>
    </div>
  );
}

function ComparisonGroupTable({ group, players }: { group: PlayerComparisonGroupConfig; players: Fc26Player[] }) {
  const Icon = group.icon;

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card/55">
      <div className="flex items-center gap-2 border-b border-border bg-muted/25 px-3 py-2">
        <Icon size={15} className="text-primary" />
        <p className="font-display text-sm font-bold text-foreground">{group.title}</p>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <th className="w-[220px] px-3 py-2 font-semibold">Atributo</th>
            {players.map((player) => (
              <th key={player.sofifaId} className="min-w-[180px] px-3 py-2 font-semibold">
                <span className="block truncate">{player.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {group.metrics.map((metric) => (
            <ComparisonMetricRow key={metric.label} metric={metric} players={players} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ComparisonMetricRow({ metric, players }: { metric: ComparisonMetricConfig; players: Fc26Player[] }) {
  const bestScore = getComparisonBestScore(players, metric);

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="w-[220px] px-3 py-2 text-xs font-semibold text-muted-foreground">{metric.label}</td>
      {players.map((player) => {
        const playerScore = metric.score?.(player);
        const isBest = bestScore !== null && typeof playerScore === "number" && playerScore === bestScore;

        return (
          <td
            key={player.sofifaId}
            className={`min-w-[180px] px-3 py-2 text-sm ${
              isBest
                ? "bg-primary/10 font-semibold text-primary"
                : "text-foreground"
            }`}
          >
            <span className="block truncate">{metric.render(player)}</span>
          </td>
        );
      })}
    </tr>
  );
}

function getComparisonBestScore(players: Fc26Player[], metric: ComparisonMetricConfig) {
  if (!metric.score) return null;

  const scores = players
    .map((player) => metric.score?.(player))
    .filter((score): score is number => typeof score === "number" && Number.isFinite(score));
  const uniqueScores = new Set(scores);

  if (uniqueScores.size <= 1) return null;

  return metric.better === "lower" ? Math.min(...scores) : Math.max(...scores);
}

function getBestMetricPlayer(players: Fc26Player[], score: (player: Fc26Player) => number | null | undefined) {
  return players.reduce<{ player: Fc26Player | null; score: number }>(
    (best, player) => {
      const value = score(player);

      if (typeof value !== "number" || !Number.isFinite(value)) return best;
      if (!best.player || value > best.score) return { player, score: value };

      return best;
    },
    { player: null, score: Number.NEGATIVE_INFINITY }
  ).player;
}

function FeaturedPlayer({ player, rank, onSelect }: { player: Fc26Player; rank: number; onSelect: () => void }) {
  const growth = player.potential - player.ovr;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="card-gamer block w-full p-4 text-left transition-colors hover:border-primary/35 hover:bg-primary/5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 font-display text-sm font-bold text-primary">
            {rank}
          </span>
          <PlayerAvatar player={player} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{player.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{player.club ?? player.nation ?? "Sem clube"}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`font-display text-2xl font-bold leading-none ${getOvrClass(player.ovr)}`}>{player.ovr}</span>
          <FitScoreBadge player={player} compact />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {player.positions.map((position) => (
          <PositionBadge key={position} position={position} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <MetricLine label="Potencial" value={`${player.potential}${growth > 0 ? ` (+${growth})` : ""}`} />
        <MetricLine label="Ritmo" value={formatRating(player.pace)} icon={Zap} />
        <MetricLine label="Altura" value={formatHeight(player.height)} icon={Ruler} />
        <MetricLine label="Valor" value={formatMarketValue(player.marketValue)} icon={BadgeEuro} />
      </div>
    </button>
  );
}

function PlayerTableRow({
  player,
  showFitScore,
  isCompareSelected,
  isShortlisted,
  onSelect,
  onToggleCompare,
  onToggleShortlist,
}: {
  player: Fc26Player;
  showFitScore: boolean;
  isCompareSelected: boolean;
  isShortlisted: boolean;
  onSelect: () => void;
  onToggleCompare: () => void;
  onToggleShortlist: () => void;
}) {
  const traits = player.playerTraits ?? [];

  return (
    <tr className="border-t border-border transition-colors hover:bg-muted/25">
      <td className="min-w-[460px] px-4 py-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <PlayerAvatar player={player} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{player.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{player.longName ?? player.nation ?? "Perfil FC26"}</p>
              {traits.length > 0 && (
                <div className="mt-2 flex max-w-[210px] gap-1 overflow-hidden">
                  {traits.slice(0, 2).map((trait) => (
                    <InfoChip key={trait}>{trait}</InfoChip>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onToggleShortlist}
              aria-pressed={isShortlisted}
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-xs font-semibold transition-colors ${
                isShortlisted
                  ? "border-primary/35 bg-primary/10 text-primary"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-primary/35 hover:text-primary"
              }`}
              aria-label={`${isShortlisted ? "Remover" : "Adicionar"} ${player.name} ${isShortlisted ? "da" : "à"} Lista Final`}
              title={isShortlisted ? "Remover da Lista Final" : "Adicionar à Lista Final"}
            >
              {isShortlisted ? <BookmarkCheck size={15} /> : <BookmarkPlus size={15} />}
              <span>{isShortlisted ? "Na lista" : "Lista"}</span>
            </button>
            <button
              type="button"
              onClick={onToggleCompare}
              aria-pressed={isCompareSelected}
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-xs font-semibold transition-colors ${
                isCompareSelected
                  ? "border-primary/35 bg-primary/10 text-primary"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-primary/35 hover:text-primary"
              }`}
              aria-label={`${isCompareSelected ? "Remover" : "Adicionar"} ${player.name} ${isCompareSelected ? "da" : "à"} comparação`}
              title={isCompareSelected ? "Remover da comparação" : "Adicionar à comparação"}
            >
              {isCompareSelected ? <Check size={15} /> : <UsersRound size={15} />}
              <span>{isCompareSelected ? "Selecionado" : "Comparar"}</span>
            </button>
            <button
              type="button"
              onClick={onSelect}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
              aria-label={`Ver detalhes de ${player.name}`}
              title="Ver detalhes"
            >
              <Eye size={15} />
            </button>
          </div>
        </div>
      </td>
      <td className="min-w-[150px] px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {player.positions.map((position) => (
            <PositionBadge key={position} position={position} />
          ))}
        </div>
      </td>
      {showFitScore && (
        <td className="px-4 py-3 text-center">
          <div className="flex justify-center">
            <FitScoreBadge player={player} />
          </div>
        </td>
      )}
      <td className={`px-4 py-3 text-center font-display text-xl font-bold ${getOvrClass(player.ovr)}`}>{player.ovr}</td>
      <td className="px-4 py-3 text-center font-display text-xl font-bold text-foreground">{player.potential}</td>
      <td className="min-w-[180px] px-4 py-3">
        <p className="text-sm text-foreground">{player.age} anos</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {formatHeight(player.height)} · {formatWeight(player.weight)}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{formatPreferredFoot(player.preferredFoot)}</p>
      </td>
      <td className="min-w-[170px] px-4 py-3">
        <div className="grid grid-cols-3 gap-1.5">
          <RatingPill label="PAC" value={player.pace} />
          <RatingPill label="DRI" value={player.dribbling} />
          <RatingPill label="PHY" value={player.physic} />
        </div>
      </td>
      <td className="min-w-[190px] px-4 py-3">
        <p className="truncate text-sm text-foreground">{player.club ?? "Sem clube"}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{player.league ?? player.nation ?? "Liga não informada"}</p>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <p className="font-display text-sm font-bold text-primary">{formatMarketValue(player.marketValue)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatWage(player.wage)}</p>
      </td>
    </tr>
  );
}

function PlayerMobileRow({
  player,
  showFitScore,
  isCompareSelected,
  isShortlisted,
  onSelect,
  onToggleCompare,
  onToggleShortlist,
}: {
  player: Fc26Player;
  showFitScore: boolean;
  isCompareSelected: boolean;
  isShortlisted: boolean;
  onSelect: () => void;
  onToggleCompare: () => void;
  onToggleShortlist: () => void;
}) {
  const traits = player.playerTraits ?? [];

  return (
    <article className="p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PlayerAvatar player={player} size="md" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{player.name}</p>
            <p className="mt-1 truncate text-sm text-muted-foreground">{player.club ?? "Sem clube"}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{player.league ?? player.nation ?? "Liga não informada"}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-display text-3xl font-bold leading-none ${getOvrClass(player.ovr)}`}>{player.ovr}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">OVR</p>
          {showFitScore && (
            <div className="mt-2 flex justify-end">
              <FitScoreBadge player={player} compact />
            </div>
          )}
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {player.positions.map((position) => (
          <PositionBadge key={position} position={position} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <MetricLine label="Potencial" value={player.potential} />
        <MetricLine label="Idade" value={`${player.age} anos`} />
        <MetricLine label="Ritmo" value={formatRating(player.pace)} icon={Zap} />
        <MetricLine label="Altura" value={formatHeight(player.height)} icon={Ruler} />
        <MetricLine label="Pé" value={formatPreferredFoot(player.preferredFoot)} icon={Footprints} />
        <MetricLine label="Valor" value={formatMarketValue(player.marketValue)} icon={BadgeEuro} />
      </div>
      {traits.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {traits.slice(0, 3).map((trait) => (
            <InfoChip key={trait}>{trait}</InfoChip>
          ))}
        </div>
      )}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onToggleShortlist}
          aria-pressed={isShortlisted}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border px-2 text-sm font-semibold transition-colors ${
            isShortlisted
              ? "border-primary/35 bg-primary/10 text-primary"
              : "border-border bg-muted/40 text-muted-foreground hover:border-primary/35 hover:text-primary"
          }`}
        >
          {isShortlisted ? <BookmarkCheck size={15} /> : <BookmarkPlus size={15} />}
          <span className="truncate">{isShortlisted ? "Lista" : "Final"}</span>
        </button>
        <button
          type="button"
          onClick={onToggleCompare}
          aria-pressed={isCompareSelected}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors ${
            isCompareSelected
              ? "border-primary/35 bg-primary/10 text-primary"
              : "border-border bg-muted/40 text-muted-foreground hover:border-primary/35 hover:text-primary"
          }`}
        >
          {isCompareSelected ? <Check size={15} /> : <UsersRound size={15} />}
          <span className="truncate">{isCompareSelected ? "Sel." : "Comp."}</span>
        </button>
        <button
          type="button"
          onClick={onSelect}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
        >
          <Eye size={15} />
          Detalhes
        </button>
      </div>
    </article>
  );
}

function PlayerAvatar({ player, size }: { player: Fc26Player; size: "sm" | "md" | "lg" }) {
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

function FitScoreBadge({ player, compact = false }: { player: Fc26Player; compact?: boolean }) {
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

function RatingPill({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded border border-border bg-background/45 px-2 py-1 text-center">
      <p className="text-[9px] font-semibold text-muted-foreground">{label}</p>
      <p className="font-display text-sm font-bold text-foreground">{formatRating(value)}</p>
    </div>
  );
}

function ScorePill({ value }: { value: number | null }) {
  const color =
    value === null
      ? "text-muted-foreground"
      : value >= 75
        ? "text-primary"
        : value >= 55
          ? "text-yellow-400"
          : "text-muted-foreground";
  return (
    <div
      className="rounded border border-primary/20 bg-primary/8 px-2 py-1 text-center"
      title={value !== null ? `Scout Score: ${value}/100` : "Score indisponível"}
    >
      <p className="text-[9px] font-semibold text-primary/70">SCORE</p>
      <p className={`font-display text-sm font-bold ${color}`}>{value ?? "—"}</p>
    </div>
  );
}

function PositionBadge({ position }: { position: PlayerPosition }) {
  return (
    <span
      title={POSITION_LABELS[position]}
      className="inline-flex h-6 items-center rounded border border-accent/20 bg-accent/10 px-2 font-display text-xs font-bold text-accent"
    >
      {position}
    </span>
  );
}

function InfoChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-6 max-w-full items-center rounded border border-primary/20 bg-primary/10 px-2 text-xs font-semibold text-primary">
      <span className="truncate">{children}</span>
    </span>
  );
}

function MetricLine({ label, value, icon: Icon }: { label: string; value: ReactNode; icon?: ElementType }) {
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

interface PlayerDetailDrawerProps {
  player: Fc26Player | null | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onClose: () => void;
}

function PlayerDetailDrawer({ player, isLoading, isError, error, onClose }: PlayerDetailDrawerProps) {
  const generalRatings = player
    ? [
        { label: "Ritmo", value: player.pace },
        { label: "Final.", value: player.shooting },
        { label: "Passe", value: player.passing },
        { label: "Drible", value: player.dribbling },
        { label: "Defesa", value: player.defending },
        { label: "Físico", value: player.physic },
      ]
    : [];
  const hasGeneralRatings = generalRatings.some((item) => item.value !== null && item.value !== undefined);
  const radarData = generalRatings.map((item) => ({ ...item, value: item.value ?? 0 }));
  const attributeGroups = player
    ? [
        {
          title: "Ataque",
          icon: Target,
          attributes: [
            { label: "Cruzamento", value: player.attackingCrossing },
            { label: "Finalização", value: player.attackingFinishing },
            { label: "Cabeceio", value: player.attackingHeadingAccuracy },
            { label: "Passe curto", value: player.attackingShortPassing },
            { label: "Voleios", value: player.attackingVolleys },
          ],
        },
        {
          title: "Habilidade",
          icon: Sparkles,
          attributes: [
            { label: "Drible", value: player.skillDribbling },
            { label: "Curva", value: player.skillCurve },
            { label: "Falta", value: player.skillFkAccuracy },
            { label: "Passe longo", value: player.skillLongPassing },
            { label: "Controle", value: player.skillBallControl },
          ],
        },
        {
          title: "Movimentação",
          icon: Footprints,
          attributes: [
            { label: "Aceleração", value: player.movementAcceleration },
            { label: "Sprint", value: player.movementSprintSpeed },
            { label: "Agilidade", value: player.movementAgility },
            { label: "Reações", value: player.movementReactions },
            { label: "Equilíbrio", value: player.movementBalance },
          ],
        },
        {
          title: "Força",
          icon: Dumbbell,
          attributes: [
            { label: "Força do chute", value: player.powerShotPower },
            { label: "Impulsão", value: player.powerJumping },
            { label: "Fôlego", value: player.powerStamina },
            { label: "Força", value: player.powerStrength },
            { label: "Chute longo", value: player.powerLongShots },
          ],
        },
        {
          title: "Mentalidade",
          icon: Brain,
          attributes: [
            { label: "Agressividade", value: player.mentalityAggression },
            { label: "Interceptações", value: player.mentalityInterceptions },
            { label: "Posicionamento", value: player.mentalityPositioning },
            { label: "Visão", value: player.mentalityVision },
            { label: "Pênaltis", value: player.mentalityPenalties },
            { label: "Compostura", value: player.mentalityComposure },
          ],
        },
        {
          title: "Defesa",
          icon: ShieldCheck,
          attributes: [
            { label: "Consciência", value: player.defendingMarkingAwareness },
            { label: "Carrinho em pé", value: player.defendingStandingTackle },
            { label: "Carrinho", value: player.defendingSlidingTackle },
          ],
        },
        {
          title: "Goleiro",
          icon: UserRound,
          attributes: [
            { label: "Mergulho", value: player.goalkeepingDiving },
            { label: "Manuseio", value: player.goalkeepingHandling },
            { label: "Chute", value: player.goalkeepingKicking },
            { label: "Posição", value: player.goalkeepingPositioning },
            { label: "Reflexos", value: player.goalkeepingReflexes },
            { label: "Velocidade", value: player.goalkeepingSpeed },
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
        aria-label={player ? `Detalhes de ${player.name}` : "Detalhes do jogador"}
        onMouseDown={(event) => event.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-4xl flex-col overflow-hidden border-l border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border bg-card/95 p-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Relatório de scout</p>
            <h3 className="mt-1 font-display text-xl font-bold text-foreground">{player?.name ?? "Carregando jogador"}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Fechar detalhes"
          >
            <X size={16} />
          </button>
        </div>

        <ScrollArea className="min-h-0 flex-1" viewportClassName="p-4 sm:p-5" scrollbars="vertical">
          {isLoading && !player ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 size={20} className="animate-spin" />
              Carregando detalhes...
            </div>
          ) : isError && !player ? (
            <div className="rounded-md border border-destructive/25 bg-destructive/10 p-5 text-sm text-destructive">
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
                          <p className="mt-1 truncate text-sm text-muted-foreground">{player.longName ?? "Nome completo não informado"}</p>
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
                        <MetricLine label="Potencial" value={player.potential} icon={Star} />
                        <MetricLine label="Idade" value={`${player.age} anos`} icon={Calendar} />
                        <MetricLine label="Altura" value={formatHeight(player.height)} icon={Ruler} />
                        <MetricLine label="Pé" value={formatPreferredFoot(player.preferredFoot)} icon={Footprints} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-gamer p-4">
                  <p className="mb-3 font-display text-sm font-bold text-foreground">Mercado</p>
                  <div className="grid gap-2">
                    <MetricLine label="Valor" value={formatMarketValue(player.marketValue)} icon={BadgeEuro} />
                    <MetricLine label="Salário" value={formatWage(player.wage)} />
                    <MetricLine label="Contrato" value={player.contractUntil ?? "—"} />
                    <MetricLine label="Cláusula" value={formatMarketValue(player.releaseClause)} icon={BadgeEuro} />
                  </div>
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
                <div className="card-gamer p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-primary" />
                    <p className="font-display text-sm font-bold text-foreground">Ratings gerais</p>
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
                      Ratings gerais não informados para este perfil.
                    </p>
                  )}
                </div>

                <div className="card-gamer p-4">
                  <p className="mb-3 font-display text-sm font-bold text-foreground">Resumo técnico</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {generalRatings.map((rating) => (
                      <AttributeMeter key={rating.label} label={rating.label} value={rating.value} />
                    ))}
                    <MetricLine label="Perna ruim" value={formatStars(player.weakFoot)} icon={Footprints} />
                    <MetricLine label="Skill moves" value={formatStars(player.skillMoves)} icon={Sparkles} />
                    <MetricLine label="Reputação" value={formatStars(player.internationalReputation)} icon={Star} />
                    <MetricLine label="Work rate" value={player.workRate ?? "—"} />
                    <MetricLine label="Tipo físico" value={player.bodyType ?? "—"} icon={Weight} />
                    <MetricLine label="Nascimento" value={formatDate(player.dob)} icon={Calendar} />
                  </div>
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-3">
                <ChipPanel title="Tags de estilo" items={player.playerTags ?? []} emptyLabel="Sem tags registradas" />
                <ChipPanel title="PlayStyles" items={basePlayStyles} emptyLabel="Sem PlayStyles registrados" />
                <ChipPanel title="PlayStyles+" items={plusPlayStyles} emptyLabel="Sem PlayStyles+ registrados" />
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

function ChipPanel({ title, items, emptyLabel }: { title: string; items: string[]; emptyLabel: string }) {
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

function AttributeGroup({ title, icon: Icon, attributes }: { title: string; icon: ElementType; attributes: Array<{ label: string; value: number | null }> }) {
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

function AttributeMeter({ label, value }: { label: string; value: number | null }) {
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

export default ScoutScreen;
