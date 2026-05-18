# AGENTS.md

## Core Commands

- **Development**: `pnpm dev` (pushes DB schema if `DATABASE_URL` is set, then starts Next.js dev server with Turbopack)
- **Build**: `pnpm build` (production build)
- **Start**: `pnpm start` (runs built app)
- **Typecheck**: `pnpm type-check` (TypeScript check)
- **Lint**: `pnpm lint` (ESLint check)
- **Format**: `pnpm format` (Prettier write)
- **Validate**: `pnpm validate` (type-check + lint + format check)
- **DB Push**: `pnpm db:push` (pushes Drizzle schema to Postgres if `DATABASE_URL` is set)

## Required Command Order

1. `pnpm db:push` (if using Postgres)
2. `pnpm type-check`
3. `pnpm lint`
4. `pnpm validate`
5. `pnpm build`

## Environment Setup

- Copy `.env.example` to `.env.local` and fill in required keys:
  - `NEYNAR_API_KEY` (required)
  - `DATABASE_URL` (optional for local prototyping; required for persistence)

## Key Architecture Notes

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Storage**: Drizzle ORM + Postgres (`postgres` driver). Falls back to in-memory map if `DATABASE_URL` is unset.
- **State Management**: Jotai + TanStack Query for client state/data.
- **Validation**: Zod for API payload validation.
- **Styling**: Tailwind CSS v4 + custom dark theme.

## API Routes

- `GET/POST /api/craft`
- `GET /api/leaderboard`
- `GET/POST /api/tasks`
- `GET/POST /api/mint`
- `GET/POST /api/gm`

All routes use:
- `src/server/game-state.ts` for shared game state logic and scoring.
- `src/server/kv-store.ts` for storage abstraction.
- `src/db/schema.ts` + `src/db/client.ts` for database access.

## Testing Quirks

- **Unit Tests**: Not yet implemented. Recommended to use Jest with `next/jest`.
- **Integration Tests**: API routes require `DATABASE_URL` for persistent storage or will fall back to in-memory map.
- **Frontend Tests**: Game logic is in `src/features/app/mini-app.tsx` (~2k LOC). Split into feature modules (`crafting`, `tasks`, `leaderboard`, `admin`, `minting`, `state`) for easier testing.

## Key Files and Directories

- **App Shell**: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- **Main Game**: `src/features/app/mini-app.tsx`
- **Providers/Init**: `src/features/app/providers-and-initialization.tsx`
- **API Routes**: `src/app/api/*/route.ts`
- **Server State/Storage**: `src/server/game-state.ts`, `src/server/kv-store.ts`
- **Database**: `src/db/schema.ts`, `src/db/client.ts`, `drizzle.config.ts`
- **Config**: `src/config/public-config.ts`, `src/config/private-config.ts`, `src/config/types.ts`

## Important Constraints

- **No Auth/Authorization**: API routes currently accept any caller.
- **No Anti-Cheat Controls**: Server trust model accepts client-reported actions.
- **No Chain Transaction Verification**: `/api/gm` and `/api/mint` do not verify transactions.
- **No Dedicated Tables**: All data is stored in a KV blob (`kv` table).