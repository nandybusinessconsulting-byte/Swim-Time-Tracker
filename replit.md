# SwimTrack

A mobile app for swim parents to track their child's times against 2026 LCM qualifying standards — specifically 2026 LCM Silver/Gold cuts and EZ Zone LCM qualifying times.

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
  - `app/(tabs)/index.tsx` — Tracker tab: swimmer selector, event list showing Gold + Zone deltas per event
  - `app/(tabs)/log.tsx` — Log tab: enter time → see Gold delta + Zone delta live → save
  - `app/(tabs)/standards.tsx` — Standards browser: Silver | Gold | Zone table by gender + age group
  - `constants/standards.ts` — 2026 LCM Silver/Gold + EZ Zone data; `get2026Times(ageGroup, gender, eventId)` → `{silver, gold, zone}`
  - `constants/events.ts` — All 17 LCM events (50/100/200/400/800/1500 Free, 50/100/200 Back/Breast/Fly, 200/400 IM)
  - `constants/colors.ts` — Pool-blue themed color palette
  - `context/SwimContext.tsx` — Global state (AsyncStorage): swimmers, meets, time entries; settings key `@swim_settings_v3`
  - `utils/timeUtils.ts` — Time parsing/formatting, `birthYearToAgeGroup` (→ AgeGroup)
  - `components/DeltaBadge.tsx` — Delta status badge (qualified/close/near/far)
  - `components/SwimmerSetupModal.tsx` — Add/edit swimmer (name, gender, birth year → auto age group)
  - `components/AddMeetSheet.tsx` — Create new meet (name + optional location, no course type)
- `artifacts/api-server/` — Express API (scaffolded for future auth/backend)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (health check only, MVP is local)

## Architecture decisions

- MVP is 100% frontend-only with AsyncStorage — no backend required to run
- Times stored as integer hundredths of seconds for reliable arithmetic
- Delta calculation: swimmer's time − standard time (negative = qualified)
- **Two standards only:** 2026 LCM Silver/Gold cuts and 2026 EZ Zone LCM qualifying times
- Age group always computed from `birthYear` at runtime — never stored (avoids stale data)
- Meets no longer store course type (app is LCM-only)
- Designed to add Clerk/Replit auth + backend persistence in a future iteration

## Standard Data

- **Source 1:** 2026 NJ LSC LCM Silver/Gold cuts (image)
- **Source 2:** EZ LCM AG Zone Summer Champs Qualifying Times 2026 (PDF)
- **Age groups:** `10&U`, `11-12`, `13-14`, `15-18`
- **Zone coverage:** 10&U, 11-12, 13-14 only — 15-18 LCM Zone not in provided PDF (shows as `—`)
- **X events** (not offered at certain age groups): 800/1500 Free not at 10&U; 50 Back/Breast/Fly not at 13-14 or 15-18; 200 Back/Breast/Fly and 400 IM not at 10&U
- Users should verify values against official documents

## Product

- **Tracker tab**: Select swimmer, see all logged events. Each card shows best time + two delta badges (Gold / Zone).
- **Log tab**: Pick meet + event → enter time (M:SS.HH) → see live Gold and Zone comparison → Save. Recent times listed below with PB badge and per-entry Gold/Zone status.
- **Standards tab**: Gender + age group filters → table showing Silver | Gold | Zone for all applicable events.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- 15-18 Zone times are all null (not in the provided PDF) — shows "—" in Standards table
- 13-14 and 15-18 don't have 50 Back, 50 Breast, or 50 Fly standards (marked X in source)
- 10&U doesn't have 800/1500 Free, 200 Back, 200 Breast, 200 Fly, or 400 IM
- Long-press a swimmer chip on the Tracker tab to edit swimmer details
- Age group is computed dynamically: `currentYear − birthYear` → `10&U / 11-12 / 13-14 / 15-18`
- AsyncStorage key `@swim_settings_v3` holds selected swimmer ID

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
