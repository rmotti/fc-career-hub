const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;

/**
 * Client-side `staleTime` values mirrored from the API's per-service Redis TTLs
 * (`API/career-hub-api/src/features/<feature>/<feature>.service.ts`). React Query
 * sits on top of the API's Redis cache, so a `staleTime` of 0 (the default) makes
 * the client refetch on every mount/focus only to receive the same value the API
 * is still serving from its own cache. Aligning the two layers removes those
 * pointless round-trips.
 *
 * Correctness is unaffected: mutations bust the relevant keys via
 * `invalidateQueries`, and the API mirrors this by busting the matching Redis keys
 * on writes, so an explicit invalidation always wins over `staleTime`.
 *
 * Resources the API does NOT cache in Redis — snapshots, the audit log, playbooks,
 * and the deleted-saves list — are intentionally absent here; their hooks keep the
 * default `staleTime` of 0 so they always revalidate.
 */
export const CACHE_TTL = {
  savesList: 15 * MINUTE, // saves.service.ts → TTL.savesList
  save: 30 * MINUTE, // saves.service.ts → TTL.save
  playersList: 1 * HOUR, // players.service.ts → TTL.playersList
  playersActive: 30 * MINUTE, // players.service.ts → TTL.playersActive (active/loaned)
  player: 1 * HOUR, // players.service.ts → TTL.player
  transfers: 30 * MINUTE, // transfers.service.ts → TTL_TRANSFERS
  teamStats: 1 * HOUR, // team-stats.service.ts → TTL_TEAM_STATS
  trophies: 1 * HOUR, // trophies.service.ts → TTL_TROPHIES
  clubStints: 1 * HOUR, // club-stints.service.ts → TTL_CLUB_STINTS
  competitions: 24 * HOUR, // competitions.service.ts → TTL (static data)
  fc26Players: 24 * HOUR, // fc26-players.service.ts → TTL.list/detail/filters
  // Clubs are served from an in-memory constant on the API (no Redis TTL); treat
  // them as static, like competitions.
  staticData: 24 * HOUR,
} as const;
