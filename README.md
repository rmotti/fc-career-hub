# FC Career Hub

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)

FC Career Hub is a web app for managing and tracking FC Career Mode saves. It lets users create multiple careers, manage squads, build lineups, register transfers, track season statistics, and preserve the long-term history of a manager save.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | React 18 + TypeScript 5 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 + `tailwindcss-animate` |
| UI components | shadcn/ui with Radix UI primitives |
| Routing | React Router DOM v6 |
| Server state | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | Sonner |
| Product tour | React Joyride |
| Tests | Vitest + Testing Library + Playwright |
| HTTP client | Native Fetch API |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Type-check only
npm run type-check
```

The development server uses `http://localhost:8080` by default. Vite may pick the next available port if `8080` is already in use.

---

## Environment Variables

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Backend API base URL |

Create a `.env.local` file at the repository root:

```env
VITE_API_URL=https://your-api.com
```

---

## Main Features

### Authentication

- Register and sign in with JWT-based sessions.
- Persist the authenticated user in local storage through `AuthContext`.
- Protect app routes with `ProtectedRoute`.
- Keep login/register unavailable to already-authenticated users with `PublicOnlyRoute`.

### Save Selection And Creation

- View existing career saves with club and season context.
- Create a new career by choosing save name, league, starting club, initial budget, and optional European competition.
- Switch between saves without signing out.
- Delete old saves from the save selection screen.

### Optional Product Tour

- A `?` help button is available on the save selection screen and inside the hub header.
- After the first save is created, users see a modal asking whether they want to start the tour or skip it.
- Skipping the first prompt does not remove the help button.
- The hub tour is route-aware: Dashboard, Squad, Field, Transfers, Stats, History, and Change Club each have their own steps.
- Tour logic, styling, route step configuration, and visible-target resolution live in `src/components/tutorial`.
- Screens only expose stable `data-tour` anchors for Joyride to target.

### Dashboard

- Season overview with campaign record, protagonists, financial health, squad evolution, market activity, and trophies.
- Budget and balance indicators with low-balance highlighting.
- Current-season market summary.
- Top performers by goals, assists, OVR, growth, and value.

### Squad

- Full player table with sortable columns.
- View modes for management, stats, market, and development.
- Filters for attack, midfield, defense, prospects, and incomplete stats.
- Player profile badges such as elite, top scorer, playmaker, rising, prospect, veteran, and more.
- Add, edit, view, and release players through modals.
- Track OVR, potential, market value, salary, role, shirt number, nationality, alternative positions, and season stats.

### Field

- Interactive lineup builder with starters, bench, and available reserves.
- Drag-and-drop support for placing players.
- Formation selector with multiple tactical shapes.
- Position compatibility warnings.
- Local persistence for lineup state per save.

### Transfers

- Current window and full history views.
- Register purchases, sales, incoming loans, and outgoing loans.
- Automatically reflect transfer activity in the financial snapshot.
- Add purchased players to the squad and complete their profile.
- Filter historical transfers by type, season, and value order.

### Season Statistics

- Team campaign summary by season.
- Competition-by-competition records.
- Editable team stats for league and cup competitions.
- Individual rankings for goals, assists, goal contributions, clean sheets, and appearances.
- Season selector in the hub header when viewing stats.

### End Of Season

- Start a new season from the hub sidebar.
- Set the next-season budget and optional European competition.
- Reactivate eligible loaned players when the season advances.
- Preserve previous-season data for historical/statistical views.

### History

- Career legacy overview.
- Trophy showcase with competition and club context.
- Club stint timeline.
- Save-wide records such as biggest purchase, biggest sale, top scorer, and top assistant.
- Long-term career statistics.

### Change Club

- Browse clubs grouped by league.
- Search and filter possible destinations.
- Open a contract confirmation flow before changing clubs.
- Preserve career history while resetting the new club context.

---

## Routes

| Route | Component | Description |
| --- | --- | --- |
| `/` | `Landing` | Public landing page |
| `/pricing` | `Pricing` | Pricing page |
| `/login` | `Login` | User sign-in |
| `/register` | `Register` | User registration |
| `/unauthorized` | `Unauthorized` | Access denied screen |
| `/app` | `Index` | Save selection and creation |
| `/dashboard` | `Dashboard` | Career overview |
| `/squad` | `Squad` | Squad management |
| `/field` | `Field` | Lineup builder |
| `/transfers` | `Transfers` | Market activity and transfer history |
| `/stats` | `Stats` | Season statistics |
| `/history` | `History` | Career legacy and trophies |
| `/change-club` | `ChangeClub` | Club switching flow |
| `*` | `NotFound` | 404 fallback |

All routes from `/app` onward are protected and require an authenticated user.

---

## Project Structure

```text
src/
├── App.tsx
├── main.tsx
├── index.css
├── components/
│   ├── AuthGuards.tsx
│   ├── AuthHubShowcase.tsx
│   ├── AuthPageLayout.tsx
│   ├── AuthStatusScreen.tsx
│   ├── Logo.tsx
│   ├── NavLink.tsx
│   ├── SaveSelect.tsx
│   ├── hub/
│   │   ├── ChangeClubScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── FieldScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── HubHeader.tsx
│   │   ├── HubSidebar.tsx
│   │   ├── SquadScreen.tsx
│   │   ├── StatCard.tsx
│   │   ├── StatsScreen.tsx
│   │   └── TransfersScreen.tsx
│   ├── modals/
│   │   ├── NewSeasonModal.tsx
│   │   ├── PlayerModal.tsx
│   │   ├── PlayerViewModal.tsx
│   │   ├── StatsModal.tsx
│   │   └── TransferModal.tsx
│   ├── tutorial/
│   │   ├── HubTutorial.tsx
│   │   ├── SaveSelectTutorial.tsx
│   │   ├── TutorialHelpButton.tsx
│   │   ├── TutorialTooltip.tsx
│   │   ├── hubTutorialSteps.ts
│   │   ├── saveSelectTutorialSteps.ts
│   │   ├── tutorialStyles.ts
│   │   └── tutorialUtils.ts
│   └── ui/
├── contexts/
│   ├── AuthContext.tsx
│   ├── auth-context-core.ts
│   └── useAuth.ts
├── hooks/
│   ├── useClubStints.ts
│   ├── useClubs.ts
│   ├── useCompetitions.ts
│   ├── useFinancialSnapshot.ts
│   ├── usePlayers.ts
│   ├── useSaves.ts
│   ├── useTeamStats.ts
│   ├── useTransfers.ts
│   └── useTrophies.ts
├── lib/
│   ├── auth-storage.ts
│   ├── playerBadge.ts
│   └── utils.ts
├── pages/
│   ├── HubLayout.tsx
│   ├── Index.tsx
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   └── hub/
├── services/
│   └── api.ts
└── utils/
    ├── competitions.ts
    ├── countries.ts
    ├── currency.ts
    ├── finance.ts
    ├── leagues.ts
    ├── playerPositions.ts
    ├── playerTransferStatus.ts
    └── rounding.ts
```

---

## Product Tour Architecture

The tour is implemented with `react-joyride`.

### Files

| File | Responsibility |
| --- | --- |
| `HubTutorial.tsx` | Controls the route-aware hub tour and first-save prompt |
| `SaveSelectTutorial.tsx` | Controls the save selection screen tour |
| `TutorialHelpButton.tsx` | Shared `?` button |
| `TutorialTooltip.tsx` | Custom Joyride tooltip UI |
| `hubTutorialSteps.ts` | Route-specific hub tour steps |
| `saveSelectTutorialSteps.ts` | Save selection tour steps |
| `tutorialStyles.ts` | Shared Joyride styles, locale, and options |
| `tutorialUtils.ts` | Visible-element resolution before starting a tour |

### Adding A New Hub Step

1. Add a stable `data-tour` attribute to the screen element:

```tsx
<section data-tour="my-feature-panel">...</section>
```

2. Add the step to the route in `src/components/tutorial/hubTutorialSteps.ts`:

```ts
{
  target: "[data-tour='my-feature-panel']",
  title: "Feature panel",
  content: "Explain what the user can do here.",
  placement: "bottom",
}
```

3. Keep tour behavior inside `src/components/tutorial`. Screen components should only expose anchors.

The tour filters targets at runtime and only starts with elements that are visible in the viewport, avoiding hidden mobile/desktop duplicates.

---

## Data Model Overview

### `ApiSave`

Career save with name, current season/year, budget, available seasons, and the current club stint.

### `ApiClubStint`

A manager stint at a club, including start/end season and whether it is the active club.

### `ApiPlayer`

Squad player with identity, nationality, shirt number, position, alternative positions, OVR, potential, status, salary, market value, and stats.

### `ApiPlayerSeasonStats`

Player season statistics such as matches, goals, assists, clean sheets, cards, and goal contributions.

### `ApiTeamStats`

Team statistics by competition and season, including wins, draws, losses, goals for/against, league position, and cup result.

### `ApiTransfer`

Transfer record with player, type, origin/destination clubs, fee, season, and optional linked player ID.

### `ApiTrophy`

Trophy record with competition, year, season, and club context.

### `ApiCompetition`

Competition metadata such as name and type.

---

## Design System

- Dark UI by default.
- Sport/gaming-inspired interface with restrained glow, sharp cards, dense information, and clear hierarchy.
- Semantic palette:
  - `primary`: positive actions and key emphasis
  - `accent`: secondary highlights
  - `destructive`: losses, removals, dangerous states
  - `warning`: caution and draws
  - `gold`: trophies and legacy moments
- Reusable shadcn/ui components live in `src/components/ui`.
- Prefer Lucide icons for icon buttons and compact controls.

---

## Notes For Contributors

- Prefer existing app patterns before introducing new abstractions.
- Keep feature logic close to its domain folder.
- Keep tour behavior centralized in `src/components/tutorial`.
- Avoid changing unrelated files while implementing a feature.
- Run `npm run type-check` and `npm run build` before shipping UI changes.
