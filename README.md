# FC Career Hub

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)

FC Career Hub is a web app for managing and tracking FC Career Mode saves. It lets users create multiple careers, manage squads, build lineups, register transfers, track season statistics, scout new players, and preserve the long-term history of a manager save.

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
| Internationalisation | i18next + react-i18next |
| Drag-and-drop | @dnd-kit/core |
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

### Save Selection and Creation

- View existing career saves with club and season context.
- Create a new career by choosing save name, league, starting club, initial budget, and optional European competition.
- Switch between saves without signing out.
- Delete old saves from the save selection screen.

### Optional Product Tour

- A `?` help button is available on the save selection screen and inside the hub header.
- After the first save is created, users see a modal asking whether they want to start the tour or skip it.
- Skipping the first prompt does not remove the help button.
- The hub tour is route-aware: Dashboard, Squad, Field, Transfers, Stats, History, and Change Club each have their own steps.
- Tour logic, styling, route step configuration, and visible-target resolution live in `src/features/tutorial/`.
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

### Scout (PRO / PREMIUM)

- AI-powered player search via a chat interface backed by an MCP server.
- Advanced filter search across the full player database.
- Shortlist to bookmark and compare candidates.
- Query archive for previous searches.
- Playbooks: configurable weight profiles that shape how `fitScore` is computed per candidate.

### Season Statistics

- Team campaign summary by season.
- Competition-by-competition records.
- Editable team stats for league and cup competitions.
- Individual rankings for goals, assists, goal contributions, clean sheets, and appearances.
- Season selector in the hub header when viewing stats.

### End of Season

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
| `/scout/ia` | `Scout` (AI) | AI-powered player search |
| `/scout/filtros` | `Scout` (Filters) | Advanced filter search |
| `/scout/shortlist` | `Scout` (Shortlist) | Saved candidates |
| `/scout/consultas` | `Scout` (Archive) | Previous queries |
| `/scout/playbooks` | `Playbooks` | Scoring weight profiles |
| `*` | `NotFound` | 404 fallback |

Routes from `/app` onward require an authenticated user. Scout routes (`/scout/*`) additionally require a PRO or PREMIUM plan.

---

## Project Structure

The frontend follows **Feature-Sliced Design (FSD)**. Import direction is strict: `app → pages → widgets → features → entities → shared`. Lower layers must not import from higher ones.

```text
src/
├── app/
│   ├── providers/        # QueryClient, AuthProvider, TooltipProvider, toasters
│   ├── router/           # All routes and guards
│   └── styles/           # (global CSS lives in src/index.css)
├── pages/
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Pricing.tsx
│   ├── Index.tsx          # Save selection
│   ├── Unauthorized.tsx
│   ├── NotFound.tsx
│   └── hub/               # One file per protected hub route
│       ├── Dashboard.tsx
│       ├── Squad.tsx
│       ├── Field.tsx
│       ├── Transfers.tsx
│       ├── Stats.tsx
│       ├── History.tsx
│       ├── ChangeClub.tsx
│       ├── Scout.tsx
│       └── Playbooks.tsx
├── widgets/
│   ├── hub-layout/        # Sidebar + header + outlet
│   └── auth-layout/
├── features/
│   ├── auth/
│   ├── change-club/
│   ├── dashboard/
│   ├── field/
│   ├── history/
│   ├── new-season/
│   ├── playbooks/
│   ├── saves/
│   ├── scout/
│   ├── squad/
│   ├── stats/
│   ├── transfers/
│   └── tutorial/
├── entities/
│   └── player/            # Typed projections, pure derivations, badges
├── shared/
│   ├── api/client.ts      # Single HTTP client + typed API surface
│   ├── ui/                # shadcn/ui primitives (49 components)
│   ├── lib/               # Pure helpers (currency, finance, positions, …)
│   ├── config/            # Runtime constants (plans.ts)
│   ├── hooks/             # use-mobile, use-toast
│   └── types/
└── i18n/
    ├── config.ts           # i18next initialisation
    └── locales/
        ├── en.json          # Active locale (English)
        └── pt-BR.json       # Stub (incomplete)
```

Each feature follows the internal convention:

```text
features/<name>/
├── api/        # (optional) endpoint wrappers beyond shared/api/client.ts
├── model/      # hooks (useX), context, pure logic
├── lib/        # feature-local helpers
├── ui/         # components
└── index.ts    # single public barrel — only this is imported externally
```

---

## Internationalisation

All user-facing strings go through **i18next**. The active locale is English (`en`). A PT-BR stub exists but is not yet surfaced in the UI.

```tsx
import { useTranslation } from "react-i18next";

const { t } = useTranslation();
// t("squad.releasePlayer")
```

Key naming convention: `<module>.<camelCaseKey>`. Add new keys to `src/i18n/locales/en.json`.

---

## Product Tour Architecture

The tour is implemented with `react-joyride`. All logic lives in `src/features/tutorial/`.

| File | Responsibility |
| --- | --- |
| `ui/HubTutorial.tsx` | Route-aware hub tour and first-save prompt |
| `ui/SaveSelectTutorial.tsx` | Save selection screen tour |
| `ui/TutorialHelpButton.tsx` | Shared `?` button |
| `ui/TutorialTooltip.tsx` | Custom Joyride tooltip UI |
| `model/hubTutorialSteps.ts` | Route-specific hub tour steps |
| `model/saveSelectTutorialSteps.ts` | Save selection tour steps |
| `model/tutorialStyles.ts` | Shared Joyride styles, locale, and options |
| `model/tutorialUtils.ts` | Visible-element resolution before starting a tour |

### Adding a New Hub Step

1. Add a stable `data-tour` attribute to the screen element:

```tsx
<section data-tour="my-feature-panel">...</section>
```

2. Add the step to the relevant route in `src/features/tutorial/model/hubTutorialSteps.ts`:

```ts
{
  target: "[data-tour='my-feature-panel']",
  title: "Feature panel",
  content: "Explain what the user can do here.",
  placement: "bottom",
}
```

The tour filters targets at runtime and only starts with elements visible in the viewport, avoiding hidden mobile/desktop duplicates.

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
- Reusable shadcn/ui components live in `src/shared/ui/`.
- Prefer Lucide icons for icon buttons and compact controls.

---

## Notes for Contributors

- This project uses Feature-Sliced Design. Keep new code inside the appropriate layer and feature folder.
- Import features only via their `index.ts` barrel — never reach into `features/X/ui/Foo` directly from outside.
- All user-facing strings must go through `t()` from `react-i18next`. Add keys to `src/i18n/locales/en.json`.
- Run `npm run type-check` and `npm run build` before shipping UI changes.
- For detailed architecture, API contracts, and module-level docs see [`docs/`](docs/).
