export interface Player {
  id: number;
  name: string;
  position: "GOL" | "ZAG" | "MEI" | "ATA";
  age: number;
  status: "Crucial" | "Important" | "Role" | "Sporadic" | "Promising";
  ovr: number;
  goals: number;
  assists: number;
  marketValue: string;
  salary: string;
  yellowCards: number;
  redCards: number;
}

export interface Transfer {
  id: number;
  playerName: string;
  type: "compra" | "venda";
  from: string;
  to: string;
  fee: string;
  year: number;
}

export interface Trophy {
  id: number;
  name: string;
  year: number;
  club: string;
}

export interface ClubHistory {
  club: string;
  years: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface SaveData {
  id: string;
  name: string;
  currentClub: string;
  year: number;
  season: string;
  clubHistory: ClubHistory[];
  players: Player[];
  transfers: Transfer[];
  trophies: Trophy[];
  budget: string;
  leaguePosition: number;
  nextOpponent: string;
  nextMatchDate: string;
  teamStats: {
    goalsPro: number;
    goalsAgainst: number;
    possession: number;
    wins: number;
    draws: number;
    losses: number;
  };
  balance: string;
}

export const availableClubs = [
  "Nottingham Forest", "Leeds United", "Sunderland", "Olympique Lyon",
  "AS Monaco", "Borussia Dortmund", "AC Milan", "AS Roma",
  "Atletico Madrid", "Porto", "Benfica", "Ajax",
  "PSV Eindhoven", "Celtic", "Rangers", "Marseille",
];

const forestPlayers: Player[] = [
  { id: 1, name: "Matt Turner", position: "GOL", age: 30, status: "Important", ovr: 78, goals: 0, assists: 0, salary: "€45K", marketValue: "€8M", yellowCards: 1, redCards: 0 },
  { id: 2, name: "Murillo", position: "ZAG", age: 25, status: "Crucial", ovr: 82, goals: 3, assists: 1, salary: "€75K", marketValue: "€35M", yellowCards: 4, redCards: 0 },
  { id: 3, name: "Nikola Milenković", position: "ZAG", age: 30, status: "Important", ovr: 80, goals: 2, assists: 0, salary: "€65K", marketValue: "€18M", yellowCards: 6, redCards: 1 },
  { id: 4, name: "Neco Williams", position: "ZAG", age: 27, status: "Role", ovr: 79, goals: 1, assists: 5, salary: "€55K", marketValue: "€15M", yellowCards: 3, redCards: 0 },
  { id: 5, name: "Ola Aina", position: "ZAG", age: 31, status: "Sporadic", ovr: 78, goals: 0, assists: 3, salary: "€50K", marketValue: "€10M", yellowCards: 5, redCards: 0 },
  { id: 6, name: "Morgan Gibbs-White", position: "MEI", age: 28, status: "Crucial", ovr: 83, goals: 8, assists: 10, salary: "€90K", marketValue: "€42M", yellowCards: 3, redCards: 0 },
  { id: 7, name: "Ibrahim Sangaré", position: "MEI", age: 30, status: "Important", ovr: 81, goals: 2, assists: 4, salary: "€70K", marketValue: "€22M", yellowCards: 7, redCards: 0 },
  { id: 8, name: "Danilo", position: "MEI", age: 27, status: "Role", ovr: 80, goals: 4, assists: 6, salary: "€60K", marketValue: "€25M", yellowCards: 2, redCards: 0 },
  { id: 9, name: "Anthony Elanga", position: "ATA", age: 26, status: "Promising", ovr: 81, goals: 12, assists: 7, salary: "€80K", marketValue: "€38M", yellowCards: 1, redCards: 0 },
  { id: 10, name: "Callum Hudson-Odoi", position: "ATA", age: 27, status: "Important", ovr: 82, goals: 9, assists: 8, salary: "€85K", marketValue: "€40M", yellowCards: 2, redCards: 0 },
  { id: 11, name: "Chris Wood", position: "ATA", age: 36, status: "Role", ovr: 79, goals: 15, assists: 3, salary: "€55K", marketValue: "€5M", yellowCards: 4, redCards: 0 },
  { id: 12, name: "Taiwo Awoniyi", position: "ATA", age: 30, status: "Sporadic", ovr: 78, goals: 6, assists: 2, salary: "€50K", marketValue: "€12M", yellowCards: 1, redCards: 0 },
  { id: 13, name: "Ryan Yates", position: "MEI", age: 30, status: "Role", ovr: 77, goals: 3, assists: 2, salary: "€45K", marketValue: "€8M", yellowCards: 8, redCards: 1 },
  { id: 14, name: "Matz Sels", position: "GOL", age: 31, status: "Sporadic", ovr: 80, goals: 0, assists: 0, salary: "€55K", marketValue: "€12M", yellowCards: 0, redCards: 0 },
  { id: 15, name: "Gonzalo Montiel", position: "ZAG", age: 31, status: "Role", ovr: 78, goals: 0, assists: 2, salary: "€45K", marketValue: "€7M", yellowCards: 3, redCards: 0 },
];

const forestTransfers: Transfer[] = [
  { id: 1, playerName: "Marcus Rashford", type: "compra", from: "Manchester United", to: "Nottingham Forest", fee: "€45M", year: 2028 },
  { id: 2, playerName: "Luka Jović", type: "compra", from: "AC Milan", to: "Nottingham Forest", fee: "€12M", year: 2027 },
  { id: 3, playerName: "Brennan Johnson", type: "venda", from: "Nottingham Forest", to: "Tottenham", fee: "€55M", year: 2026 },
  { id: 4, playerName: "Orel Mangala", type: "venda", from: "Nottingham Forest", to: "Lyon", fee: "€18M", year: 2027 },
  { id: 5, playerName: "Murillo", type: "compra", from: "Corinthians", to: "Nottingham Forest", fee: "€8M", year: 2026 },
  { id: 6, playerName: "Elliot Anderson", type: "venda", from: "Nottingham Forest", to: "Newcastle", fee: "€22M", year: 2028 },
  { id: 7, playerName: "Remo Freuler", type: "compra", from: "Bologna", to: "Nottingham Forest", fee: "€5M", year: 2026 },
  { id: 8, playerName: "Chris Wood", type: "compra", from: "Newcastle", to: "Nottingham Forest", fee: "€3M", year: 2026 },
];

const forestTrophies: Trophy[] = [
  { id: 1, name: "EFL Cup", year: 2027, club: "Nottingham Forest" },
  { id: 2, name: "FA Cup", year: 2028, club: "Nottingham Forest" },
  { id: 3, name: "Premier League", year: 2029, club: "Nottingham Forest" },
];

export const mockSaves: SaveData[] = [
  {
    id: "save-1",
    name: "Rumo à Glória",
    currentClub: "Nottingham Forest",
    year: 2029,
    season: "2029/30",
    clubHistory: [
      { club: "Nottingham Forest", years: "2026-2029", matches: 190, wins: 112, draws: 38, losses: 40 },
    ],
    players: forestPlayers,
    transfers: forestTransfers,
    trophies: forestTrophies,
    budget: "€85M",
    leaguePosition: 3,
    nextOpponent: "Arsenal",
    nextMatchDate: "Sábado, 15 Nov",
    teamStats: { goalsPro: 52, goalsAgainst: 24, possession: 58, wins: 18, draws: 5, losses: 3 },
    balance: "€127M",
  },
  {
    id: "save-2",
    name: "O Legado Italiano",
    currentClub: "AC Milan",
    year: 2031,
    season: "2031/32",
    clubHistory: [
      { club: "Lecce", years: "2026-2028", matches: 95, wins: 42, draws: 28, losses: 25 },
      { club: "AC Milan", years: "2028-2031", matches: 155, wins: 98, draws: 30, losses: 27 },
    ],
    players: [
      { id: 1, name: "Mike Maignan", position: "GOL", age: 35, status: "Crucial", ovr: 85, goals: 0, assists: 0, salary: "€110K", marketValue: "€15M", yellowCards: 1, redCards: 0 },
      { id: 2, name: "Fikayo Tomori", position: "ZAG", age: 33, status: "Important", ovr: 83, goals: 2, assists: 1, salary: "€95K", marketValue: "€20M", yellowCards: 5, redCards: 0 },
      { id: 3, name: "Tijjani Reijnders", position: "MEI", age: 29, status: "Crucial", ovr: 86, goals: 10, assists: 12, salary: "€120K", marketValue: "€65M", yellowCards: 2, redCards: 0 },
      { id: 4, name: "Rafael Leão", position: "ATA", age: 31, status: "Crucial", ovr: 88, goals: 18, assists: 9, salary: "€150K", marketValue: "€80M", yellowCards: 3, redCards: 0 },
      { id: 5, name: "Christian Pulisic", position: "ATA", age: 32, status: "Important", ovr: 84, goals: 14, assists: 8, salary: "€100K", marketValue: "€30M", yellowCards: 1, redCards: 0 },
    ],
    transfers: [
      { id: 1, playerName: "Lamine Yamal", type: "compra", from: "Barcelona", to: "AC Milan", fee: "€120M", year: 2030 },
      { id: 2, playerName: "Sandro Tonali", type: "compra", from: "Newcastle", to: "AC Milan", fee: "€50M", year: 2029 },
    ],
    trophies: [
      { id: 1, name: "Serie A", year: 2030, club: "AC Milan" },
      { id: 2, name: "Coppa Italia", year: 2031, club: "AC Milan" },
      { id: 3, name: "Champions League", year: 2031, club: "AC Milan" },
    ],
    budget: "€120M",
    leaguePosition: 1,
    nextOpponent: "Juventus",
    nextMatchDate: "Domingo, 20 Nov",
    teamStats: { goalsPro: 68, goalsAgainst: 18, possession: 62, wins: 22, draws: 3, losses: 1 },
    balance: "€205M",
  },
];
