# SwimTrack

A mobile app for swim parents to track their child's times at meets and see the delta towards USA Swimming qualifying standards (B, BB, A, AA, AAA, AAAA).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (not yet used, MVP is frontend-only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native) with Expo Router
- API: Express 5 (scaffolded, not yet used in MVP)
- DB: PostgreSQL + Drizzle ORM (scaffolded, not yet used in MVP)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mobile/` — Expo mobile app
  - `app/(tabs)/index.tsx` — Tracker tab (swimmer selector, standard picker, delta view)
  - `app/(tabs)/log.tsx` — Log tab (enter times, meet management)
  - `app/(tabs)/standards.tsx` — Standards browser (full USA Swimming SCY table)
  - `constants/standards.ts` — USA Swimming 2024-2025 SCY time standards data (9-10 through 17-18)
  - `constants/events.ts` — Swim event definitions
  - `constants/colors.ts` — Pool-blue themed color palette
  - `context/SwimContext.tsx` — Global state (AsyncStorage: swimmers, meets, time entries)
  - `utils/timeUtils.ts` — Time parsing/formatting (hundredths of seconds)
  - `components/DeltaBadge.tsx` — Delta status badge (qualified/close/near/far)
  - `components/SwimmerSetupModal.tsx` — Add/edit swimmer modal
  - `components/AddMeetSheet.tsx` — Create new meet sheet
- `artifacts/api-server/` — Express API (scaffolded for future auth/backend)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (health check only, MVP is local)

## Architecture decisions

- MVP is 100% frontend-only with AsyncStorage — no backend required to run
- Times stored as integer hundredths of seconds for reliable arithmetic
- Delta calculation: swimmer's best time for event − qualifying standard time (negative = qualified)
- USA Swimming SCY 2024-2025 standards embedded as static data for offline use
- Age group auto-calculated from birth year; can also be set manually
- Designed to add Clerk/Replit auth + backend persistence in a future iteration

## Product

- **Tracker tab**: Select swimmer, choose qualifying standard level (B–AAAA), see all logged events with delta badges
- **Log tab**: Record times at meets with instant delta preview, manage meets, view/delete recent entries
- **Standards tab**: Browse complete USA Swimming SCY time standards filtered by gender and age group

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Standards data covers 9-10, 11-12, 13-14, 15-16, 17-18 age groups for both genders in SCY only
- 8U age group is defined but has no standards data in the current dataset
- Long-press a swimmer chip on the Tracker tab to edit swimmer details

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
