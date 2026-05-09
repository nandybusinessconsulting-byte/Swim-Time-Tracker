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
  - `app/(tabs)/index.tsx` — Tracker tab (swimmer selector, standard set + level picker, delta view)
  - `app/(tabs)/log.tsx` — Log tab (enter times per meet, meet management, instant delta preview)
  - `app/(tabs)/standards.tsx` — Standards browser (full table by set, gender, age group)
  - `constants/standards.ts` — All standards data: USA Swim 2024-25 + 2025-26 (SCY + LCM), NJ State Silver/Gold, Eastern Zone EZ
  - `constants/events.ts` — Swim event definitions with `applicableTo: 'SCY'|'LCM'|'both'`
  - `constants/colors.ts` — Pool-blue themed color palette
  - `context/SwimContext.tsx` — Global state (AsyncStorage): swimmers, meets, time entries, selected standard set + level
  - `utils/timeUtils.ts` — Time parsing/formatting (hundredths of seconds)
  - `components/DeltaBadge.tsx` — Delta status badge (qualified/close/near/far)
  - `components/SwimmerSetupModal.tsx` — Add/edit swimmer modal
  - `components/AddMeetSheet.tsx` — Create new meet sheet (with SCY/SCM/LCM picker)
- `artifacts/api-server/` — Express API (scaffolded for future auth/backend)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (health check only, MVP is local)

## Architecture decisions

- MVP is 100% frontend-only with AsyncStorage — no backend required to run
- Times stored as integer hundredths of seconds for reliable arithmetic
- Delta calculation: swimmer's best time for event − qualifying standard time (negative = qualified)
- Standards organized into "standard sets" — each set has an id, org, season, courseType, and levels list
- Standard set selection also determines which events show up (SCY events vs LCM events)
- Meets store their own courseType (SCY/SCM/LCM); Log tab event list adapts to the meet's course type
- Age group auto-calculated from birth year; can also be set manually
- Designed to add Clerk/Replit auth + backend persistence in a future iteration
- 2025-26 standards based on 2024-25 (standards are confirmed per cycle; labeled "approx." in the UI)

## Standard Sets

| ID | Name | Course | Levels |
|---|---|---|---|
| `usswim-2526-scy` | USA Swimming 2025-26 | SCY | B BB A AA AAA AAAA |
| `usswim-2526-lcm` | USA Swimming 2025-26 | LCM | B BB A AA AAA AAAA |
| `usswim-2425-scy` | USA Swimming 2024-25 | SCY | B BB A AA AAA AAAA |
| `usswim-2425-lcm` | USA Swimming 2024-25 | LCM | B BB A AA AAA AAAA |
| `nj-state-scy` | NJ State SCY | SCY | Silver Gold |
| `eastern-zone-scy` | Eastern Zone SCY | SCY | EZ |

## Product

- **Tracker tab**: Select swimmer, choose standard set (including LCM options) + level, see all logged events with delta badges. Set picker auto-hides the level picker for single-level sets (e.g. Eastern Zone EZ).
- **Log tab**: Select meet (each meet has a course type). Event list auto-filters to SCY or LCM events based on the meet. Record time with live delta preview vs. selected standard.
- **Standards tab**: Browse any standard set with filters for gender and age group. LCM sets show LCM-specific events (400/800/1500 Free). Org/season/course noted below filters.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Standards data covers 9-10, 11-12, 13-14, 15-16, 17-18 age groups. 8U has no standards data.
- Eastern Zone standards start at 11-12 (no 9-10 age group in that set)
- LCM sets include 400/800/1500m Free instead of 500/1000/1650y Free
- Long-press a swimmer chip on the Tracker tab to edit swimmer details
- When changing standard sets, the level auto-resets to the first valid level for the new set
- AsyncStorage key `@swim_settings_v2` holds the selected set + level (bumped to avoid stale data on relaunch)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
