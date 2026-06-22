import { toast } from "sonner";
import type { Fc26Player, Fc26PlayerFilters, Fc26PlayerListParams, PlayerPosition, ShortlistFc26Player } from "@/shared/api/client";
import type { AppliedScoutFilters, DraftFilters, SavedScoutQuery } from "@/features/scout/ui/types";
import { ATTRIBUTE_FILTER_FIELDS } from "@/features/scout/config/attributeFilters";
import { FIT_OBJECTIVE_LABELS } from "@/features/scout/config/options";
import { filterOutCurrentClubPlayers, isSameClubName } from "@/features/scout/model/currentClubFilter";
import {
  formatFilterRange,
  formatMarketValue,
  formatMarketValueFilterRange,
  formatPreferredFoot,
  formatSavedQueryDate,
} from "./format";
import { m } from "@/shared/lib/money";

export function readNumber(value: string) {
  if (!value.trim()) return undefined;
  const numericValue = Number(value.trim().replace(",", "."));
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

export function sanitizeNumberInput(value: string, allowDecimal: boolean) {
  if (!allowDecimal) return value.replace(/\D/g, "");

  const normalizedValue = value.replace(",", ".").replace(/[^\d.]/g, "");
  const [integerPart, ...fractionParts] = normalizedValue.split(".");

  return fractionParts.length ? `${integerPart}.${fractionParts.join("")}` : integerPart;
}

export function validateRange(label: string, min?: number, max?: number) {
  if (typeof min === "number" && typeof max === "number" && min > max) {
    toast.error(`${label}: minimum cannot be greater than maximum.`, { duration: 4000 });
    return false;
  }

  return true;
}

export function isPlayStylePlus(playStyle: string) {
  return playStyle.trim().endsWith("+");
}

export function toFilterParamKey(prefix: "min" | "max", field: string) {
  return `${prefix}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
}

export function buildAttributeFilters(ranges: Record<string, { min: string; max: string }>): Partial<Fc26PlayerFilters> | null {
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

export function getAttributeRangeFromFilters(filters: Fc26PlayerFilters, field: string) {
  const min = filters[toFilterParamKey("min", field) as keyof Fc26PlayerFilters];
  const max = filters[toFilterParamKey("max", field) as keyof Fc26PlayerFilters];

  return {
    min: typeof min === "number" ? String(min) : "",
    max: typeof max === "number" ? String(max) : "",
  };
}

export function countAttributeFiltersInDraft(ranges: Record<string, { min: string; max: string }>) {
  return ATTRIBUTE_FILTER_FIELDS.reduce((count, attribute) => {
    const range = ranges[attribute.field];
    return range?.min || range?.max ? count + 1 : count;
  }, 0);
}

export function countAttributeFilters(filters: Fc26PlayerFilters) {
  return ATTRIBUTE_FILTER_FIELDS.reduce((count, attribute) => {
    const min = filters[toFilterParamKey("min", attribute.field) as keyof Fc26PlayerFilters];
    const max = filters[toFilterParamKey("max", attribute.field) as keyof Fc26PlayerFilters];
    return typeof min === "number" || typeof max === "number" ? count + 1 : count;
  }, 0);
}

export function getUniquePositions(...groups: PlayerPosition[][]) {
  return Array.from(new Set(groups.flat()));
}

export function getPrimaryPosition(player: Fc26Player) {
  return player.positions[0] ?? null;
}

export function getSecondaryPositions(player: Fc26Player) {
  return player.positions.slice(1);
}

export function hasSplitPositionFilters(filters: AppliedScoutFilters | null) {
  return Boolean(filters?.primaryPositions?.length || filters?.secondaryPositions?.length);
}

export function buildFiltersFromDraft(draft: DraftFilters): AppliedScoutFilters | null {
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
  if (!validateRange("Age", minAge, maxAge)) return null;
  if (!validateRange("Potential", minPotential, maxPotential)) return null;
  if (!validateRange("Value de mercado", minMarketValue, maxMarketValue)) return null;
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

export function hasMeaningfulFilters(filters: AppliedScoutFilters) {
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

export function draftFromFilters(filters: AppliedScoutFilters): DraftFilters {
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

export function normalizeOption(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function getPriorityLeagueRank(league: string) {
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

export function sortLeagueOptions(leagues: string[]) {
  return [...leagues].sort((a, b) => {
    const priorityDiff = getPriorityLeagueRank(a) - getPriorityLeagueRank(b);
    if (priorityDiff !== 0) return priorityDiff;
    return a.localeCompare(b, "pt-BR");
  });
}

type ScoutSortBy = NonNullable<Fc26PlayerFilters["sortBy"]>;

export function getSortValue(player: Fc26Player, sortBy: ScoutSortBy) {
  if (sortBy === "fitScore") {
    if (player.fitConfidence === "none") return null;
    if (typeof player.fitScore !== "number" || !Number.isFinite(player.fitScore)) return null;
    return Math.round(Math.min(Math.max(player.fitScore, 0), 1) * 100);
  }
  return sortBy === "potential" ? player.potential : player.ovr;
}

export function sortPlayersForDisplay(players: Fc26Player[], filters: AppliedScoutFilters | null) {
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

export function getFilterPositions(filters: AppliedScoutFilters) {
  if (hasSplitPositionFilters(filters)) {
    return getUniquePositions(filters.primaryPositions ?? [], filters.secondaryPositions ?? []);
  }

  return filters.positions ?? [];
}

export function getSavedQueryChips(filters: AppliedScoutFilters) {
  const chips: string[] = [];
  const positions = getFilterPositions(filters);
  const ageRange = formatFilterRange("Age", filters.minAge, filters.maxAge);
  const ovrRange = formatFilterRange("OVR", filters.minOvr, filters.maxOvr);
  const potentialRange = formatFilterRange("Potential", filters.minPotential, filters.maxPotential);
  const marketValueRange = formatMarketValueFilterRange(filters.minMarketValue, filters.maxMarketValue);

  if (filters.primaryPositions?.length) chips.push(`Principal: ${filters.primaryPositions.join(", ")}`);
  if (filters.secondaryPositions?.length) chips.push(`Secondary: ${filters.secondaryPositions.join(", ")}`);
  if (!hasSplitPositionFilters(filters) && positions.length) chips.push(`Positions: ${positions.join(", ")}`);
  if (filters.preferredFoot) chips.push(`Foot: ${formatPreferredFoot(filters.preferredFoot)}`);
  if (ageRange) chips.push(ageRange);
  if (ovrRange) chips.push(ovrRange);
  if (potentialRange) chips.push(potentialRange);
  if (marketValueRange) chips.push(marketValueRange);
  if (filters.objective && filters.objective !== "balanced") chips.push(`Objective: ${FIT_OBJECTIVE_LABELS[filters.objective]}`);
  if (filters.nations?.length) chips.push(`Nations: ${filters.nations.slice(0, 3).join(", ")}${filters.nations.length > 3 ? "..." : ""}`);
  if (filters.leagues?.length) chips.push(`Leagues: ${filters.leagues.slice(0, 2).join(", ")}${filters.leagues.length > 2 ? "..." : ""}`);
  if (filters.clubs?.length) chips.push(`Clubs: ${filters.clubs.slice(0, 2).join(", ")}${filters.clubs.length > 2 ? "..." : ""}`);
  if (filters.traits?.length) chips.push(`PlayStyles: ${filters.traits.slice(0, 2).join(", ")}${filters.traits.length > 2 ? "..." : ""}`);

  return chips;
}

export function createSavedQueryTitle(filters: AppliedScoutFilters) {
  const titleParts: string[] = [];
  const positions = getFilterPositions(filters);

  if (positions.length) titleParts.push(positions.join("/"));
  if (filters.preferredFoot) titleParts.push(filters.preferredFoot === "Left" ? "left-footed" : "right-footed");
  if (typeof filters.maxAge === "number") titleParts.push(`u${filters.maxAge + 1}`);
  if (typeof filters.minPotential === "number") titleParts.push(`pot. ${filters.minPotential}+`);
  if (typeof filters.maxMarketValue === "number") titleParts.push(`up to ${formatMarketValue(m(filters.maxMarketValue))}`);
  if (filters.objective && filters.objective !== "balanced") titleParts.push(FIT_OBJECTIVE_LABELS[filters.objective].toLocaleLowerCase());

  return titleParts.length ? `Scout ${titleParts.join(" · ")}` : "Scout query";
}

export function withScoutSaveContext(filters: AppliedScoutFilters, saveId?: string | null): Fc26PlayerListParams {
  const { objective, ...baseFilters } = filters;

  if (!saveId) return baseFilters;

  return {
    ...baseFilters,
    saveId,
    objective: objective ?? "balanced",
  };
}

export function getCurrentClubFilteredTotal(total: number, rawPlayers: Fc26Player[], visiblePlayers: Fc26Player[]) {
  const hiddenCurrentClubPlayers = rawPlayers.length - visiblePlayers.length;

  return Math.max(visiblePlayers.length, total - hiddenCurrentClubPlayers);
}

export function filterSavedQueryForCurrentClub(query: SavedScoutQuery, currentClub: string): SavedScoutQuery {
  const results = filterOutCurrentClubPlayers(query.results, currentClub);
  if (results.length === query.results.length) return query;

  return {
    ...query,
    results,
    total: getCurrentClubFilteredTotal(query.total, query.results, results),
  };
}

export function removeCurrentClubFromAppliedFilters(filters: AppliedScoutFilters, currentClub: string): AppliedScoutFilters {
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

export function shortlistEmbedToPlayer(embed: ShortlistFc26Player): Fc26Player {
  return { ...embed, playerTags: [], playerTraits: [] } as Fc26Player;
}

export function apiSavedSearchToQuery(
  item: { id: string; name: string; filters: unknown; createdAt: string },
  club: string,
  season: string
): SavedScoutQuery {
  const filters = item.filters as AppliedScoutFilters;
  const chips = getSavedQueryChips(filters);
  return {
    id: item.id,
    title: item.name,
    description: chips.length ? chips.join(" · ") : "Saved scout filters.",
    source: "manual",
    club,
    season,
    createdAt: item.createdAt,
    filters,
    results: [],
    total: 0,
  };
}
