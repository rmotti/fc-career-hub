# AI_RULES.md — FC Career Hub

Operating rules for AI agents working in this repository. Read before making any change.

## What this project is

**FC Career Hub** is a web app for tracking FC 26 Career Mode saves. Users create careers ("saves"), pick a club, manage the squad, register transfers, track season stats, lift trophies, and use an AI assistant to scout signings. It is single-player by design — no shared state, no multi-tenant business operations.

The frontend lives in this repo. The API ([`docs/career-hub-api/`](career-hub-api/)) is a separate Fastify + Prisma service deployed independently to Railway.

---

## Tech Stack

### Frontend (this repo)
- **Vite 5 + React 18 + TypeScript** (strict).
- **React Router v6** — routes defined in [`src/app/router/index.tsx`](../src/app/router/index.tsx).
- **TanStack React Query v5** — server state. `QueryClient` created in [`src/app/providers/index.tsx`](../src/app/providers/index.tsx).
- **Tailwind CSS 3** + `tailwindcss-animate` — tokens via CSS variables in [`src/index.css`](../src/index.css) and [`tailwind.config.ts`](../tailwind.config.ts).
- **shadcn/ui + Radix UI** — primitives in [`src/shared/ui/`](../src/shared/ui/).
- **Lucide React** — icons (single source).
- **Recharts** — all charts.
- **Sonner + custom Toaster** — notifications, both mounted in `Providers`.
- **React Hook Form + Zod + `@hookform/resolvers/zod`** — forms and validation.
- **React Joyride** — onboarding tour.
- **Vitest + Testing Library + Playwright** — tests.
- **Fetch API** — no axios. HTTP client is [`src/shared/api/client.ts`](../src/shared/api/client.ts).

### Backend (separate repo, mirrored at `docs/career-hub-api/`)
- **Fastify 4** + **@fastify/cors**, **compress**, **swagger**, **swagger-ui**.
- **Prisma + PostgreSQL** (Neon in prod).
- **Better Auth** with bearer token (`Authorization: Bearer <token>`).
- **Redis (ioredis)** — session cache (5 min) and per-service TTL caches.
- **OpenAI Responses API + MCP** — Mister assistant (`/api/chat/messages`).
- Runs on **Railway**; Swagger UI at `/docs`.

---

## Architecture (Feature-Sliced Design)

```
src/
├── app/         # providers, router, styles — composition root
├── pages/       # one component per route
├── widgets/     # cross-feature compositions (hub-layout, auth-layout)
├── features/    # domain capabilities (auth, squad, transfers, scout, ...)
├── entities/    # domain entities (player) — model-only, framework-agnostic
└── shared/      # ui (shadcn), api/client, lib, hooks, config — reusable, no domain
```

### Import direction (enforce)
`app → pages → widgets → features → entities → shared`. Lower layers must **not** import from higher ones.

- `shared/` knows nothing about features.
- `entities/` knows nothing about features/widgets.
- `features/X` should not import from `features/Y` directly. If shared logic emerges, lift it to `entities/` or `shared/lib/`.

### Internal structure of a feature
```
features/<name>/
├── api/        # (optional) feature-specific fetchers
├── model/      # hooks (useX), context, pure logic
├── lib/        # helpers
├── ui/         # components
└── index.ts    # public barrel — only export what other layers may import
```

---

## Critical Rules

### 1. Routing
- Define and modify routes **only** in [`src/app/router/index.tsx`](../src/app/router/index.tsx).
- Use `<ProtectedRoute />` for authenticated pages, `<PublicOnlyRoute />` for login/register, `<PlanRoute allowedPlans={PRO_FEATURE_PLANS} />` for paid features.
- Hub pages render inside `<HubLayout />` (sidebar + header).

### 2. Server state
- All HTTP goes through the typed API objects in [`src/shared/api/client.ts`](../src/shared/api/client.ts) (`savesApi`, `playersApi`, `transfersApi`, ...). **Do not** call `fetch` from components or features.
- Wrap reads in React Query hooks under `features/<name>/model/useX.ts`. Standard pattern:
  ```ts
  useQuery({ queryKey: ["players", saveId], queryFn: () => playersApi.list(saveId), enabled: !!saveId })
  ```
- Mutations must invalidate the matching query keys in `onSuccess`. Cross-domain invalidation when a save mutates: invalidate `["saves"]`, `["saves", saveId]`, `["teamStats", saveId]`, `["players", saveId]`, `["trophies", saveId]`.

### 3. Auth and session
- Token is read from `localStorage["session_token"]` by `request()` in `shared/api/client.ts` and sent as `Authorization: Bearer <token>`.
- `AuthProvider` in [`src/features/auth/model/AuthContext.tsx`](../src/features/auth/model/AuthContext.tsx) owns session state; use [`useAuth`](../src/features/auth/model/useAuth.ts) to read it.
- On HTTP 401 (except sign-in/up), the global `unauthorizedHandler` clears the session and forces re-login. **Do not** add per-component 401 handling.

### 4. Plans
- Plans are `FREE | PRO | PREMIUM` (see [`src/shared/config/plans.ts`](../src/shared/config/plans.ts)).
- Scout module is paid-only. Gate with `<PlanRoute allowedPlans={PRO_FEATURE_PLANS} />` and `canAccessProFeature(plan)` in conditionals.

### 5. Currency and units
Match the API contract exactly (see API's `CLAUDE.md`):
- `salary` is in **thousands of €** (75 = €75K).
- `marketValue`, `budget`, `balance`, transfer `fee` are in **millions of €** (100 = €100M).
- Use helpers in [`src/shared/lib/currency.ts`](../src/shared/lib/currency.ts) and [`src/shared/lib/finance.ts`](../src/shared/lib/finance.ts). Do not format inline.

### 6. Styling
- Tokens are HSL CSS variables in [`src/index.css`](../src/index.css). Use semantic classes (`bg-primary`, `text-muted-foreground`, `border-border`) — they resolve via `tailwind.config.ts`.
- Theme is **dark-only, gamer aesthetic**: dark navy background (`220 20% 7%`), neon green primary (`142 70% 49%`), cyan accent (`195 90% 50%`), gold for highlights.
- Fonts: **Rajdhani** for headings (`font-display`), **Inter** for body (`font-body`).
- Custom utilities: `.glow-primary`, `.text-glow-primary`, `.card-gamer`, `.stat-highlight`.
- Use the `cn()` helper from [`src/shared/lib/utils.ts`](../src/shared/lib/utils.ts) for class composition.

### 7. UI components
- Prefer existing shadcn primitives in [`src/shared/ui/`](../src/shared/ui/). Use Radix only via these wrappers unless no wrapper exists.
- Do **not** add other UI libraries (MUI, Chakra, Ant, DaisyUI).
- Both `<Toaster />` (Radix) and Sonner are mounted. Sonner (`toast.success`, `toast.error`) is the default for transient feedback.

### 8. Icons and charts
- Icons: **`lucide-react` only**.
- Charts: **`recharts` only**.

### 9. Forms
- `react-hook-form` + `zod` schemas. Wire with `@hookform/resolvers/zod`.
- Co-locate schema with form when single-use; lift to `features/<name>/model/` when reused.

### 10. Tests
- Unit/component: Vitest + Testing Library. Files: `*.test.ts(x)` next to source or in `src/test/`.
- E2E: Playwright. Config in [`playwright.config.ts`](../playwright.config.ts). Fixture in [`playwright-fixture.ts`](../playwright-fixture.ts).

### 11. Language
- **Code**: identifiers, types, file names — English.
- **User-facing UI strings**: Portuguese (PT-BR). Existing screens are in PT-BR; keep new copy in PT-BR for consistency.
- **Docs in `docs/`**: English.
- **API**: error messages from the backend are PT-BR; the frontend surfaces them as-is.

---

## Quick-Decision Table

| Need | Use |
|---|---|
| New page | Add component in `src/pages/...`, wire route in `src/app/router/index.tsx` |
| Cross-feature layout | `src/widgets/` |
| New domain capability | `src/features/<name>/` with `api/model/ui` subfolders |
| Server read | `useQuery` in `features/<name>/model/useX.ts` calling `xxxApi` from `shared/api/client.ts` |
| Server write | `useMutation` + invalidate the relevant query keys |
| Modal / Dialog | shadcn `<Dialog>` from `shared/ui/dialog` |
| Toast | `toast()` from `sonner` (already mounted) |
| Form | `react-hook-form` + Zod resolver |
| Chart | `recharts` |
| Icon | `lucide-react` |
| Conditional gating by plan | `canAccessProFeature(plan)` or `<PlanRoute />` |
| Money in millions | helpers in `shared/lib/currency.ts`/`finance.ts` |
| Position list | `shared/lib/playerPositions.ts` |
| Country / League lists | `shared/lib/countries.ts`, `shared/lib/leagues.ts` |

---

## Anti-patterns (do not introduce)

- Direct `fetch()` calls outside `src/shared/api/client.ts`.
- Importing from a feature's internal file (`features/X/ui/Foo.tsx`) — go through `features/X/index.ts`.
- Adding `axios`, alternative state libraries (Redux/Zustand/MobX), alternative UI kits, or alternative icon packs.
- Per-component 401 handling — the global `unauthorizedHandler` owns this.
- Storing auth tokens anywhere other than `localStorage["session_token"]` (see `features/auth/lib/auth-storage`).
- Hardcoding currency formatting — use helpers, the API returns both raw and `*Formatted` fields.
- Calling Prisma / Postgres directly from the frontend.

---

## Checklist before considering a change done

- [ ] No new `fetch` outside `shared/api/client.ts`.
- [ ] React Query keys invalidated on mutation success.
- [ ] FSD layer direction respected.
- [ ] Plan gating applied if the feature is paid-only.
- [ ] Currency units correct (K for salary, M for the rest).
- [ ] PT-BR copy for UI; English for identifiers and docs.
- [ ] TypeScript passes (`npm run type-check`).
- [ ] Lint passes (`npm run lint`).
- [ ] Tests added for non-trivial logic.

---

## Auto-audit

- Stack list cross-checked against [`package.json`](../package.json).
- FSD layout confirmed by `src/` tree inspection.
- API surface, auth, and units confirmed against [`docs/career-hub-api/CLAUDE.md`](career-hub-api/CLAUDE.md) and `src/shared/api/client.ts`.
- Plan tiers confirmed in `src/shared/config/plans.ts` and Prisma `UserPlan` enum.

_Last verified against commit `e29dd53`._
