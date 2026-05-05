const CLUB_NAME_STOP_WORDS = new Set(["a", "afc", "cf", "club", "da", "de", "del", "do", "fc", "sc", "sd", "the"]);

function getClubNameKey(value?: string | null) {
  if (!value) return "";

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token && !CLUB_NAME_STOP_WORDS.has(token))
    .join(" ");
}

export function isSameClubName(clubName?: string | null, currentClub?: string | null) {
  const clubKey = getClubNameKey(clubName);
  const currentClubKey = getClubNameKey(currentClub);

  return Boolean(clubKey && currentClubKey && clubKey === currentClubKey);
}

export function filterOutCurrentClubPlayers<T extends { club?: string | null }>(players: T[], currentClub?: string | null) {
  if (!currentClub || currentClub === "—") return players;

  return players.filter((player) => !isSameClubName(player.club, currentClub));
}
