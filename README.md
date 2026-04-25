# CrafterZ Mini App

CrafterZ is a Farcaster mini app game where players combine elements to craft new items, discover MegaMinds, earn points, complete daily tasks, and mint NFTs on-chain.

This repository now includes a complete **development runtime baseline**: Next.js app, API routes, env templates, Tailwind/PostCSS config, Drizzle DB wiring, and build/lint/type-check support.

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- React 19
- Tailwind CSS v4 + custom dark theme styles
- Drizzle ORM + Postgres (`postgres` driver)
- Zod for payload validation
- Jotai + TanStack Query for client state/data setup
- Farcaster mini app SDK integration (local wrapper)

## Current Architecture

### Frontend

- `src/features/app/mini-app.tsx` is the primary gameplay UI and logic module (**~2089 lines**).
- The game currently runs mainly from local in-memory React state (crafting table, points, inventory, admin controls, daily tasks).
- Jotai + React Query are initialized in `src/features/app/providers-and-initialization.tsx`, but network-backed data hooks are not yet wired into gameplay screens.

### Backend API

The following API routes are implemented in App Router:

- `GET/POST /api/craft`
- `GET /api/leaderboard`
- `GET/POST /api/tasks`
- `GET/POST /api/mint`
- `GET/POST /api/gm`

These routes use:

- `src/server/game-state.ts` for shared game state logic and scoring updates.
- `src/server/kv-store.ts` for storage abstraction.
- `src/db/schema.ts` + `src/db/client.ts` for database access.

### Storage Behavior

- If `DATABASE_URL` is set and reachable, state is persisted to Postgres via the built-in `kv` table.
- If DB is unavailable, routes gracefully fall back to an in-memory map (non-persistent, process-local).

## Environment Setup

1. Install dependencies: `pnpm install`
2. Copy env template: `cp .env.example .env.local`
3. Fill required keys in `.env.local`:
   - `NEYNAR_API_KEY`
   - `DATABASE_URL` (optional for quick local prototyping; required for persistence)
4. Push DB schema (if using Postgres): `pnpm run db:push`
5. Start dev server: `pnpm run dev`

## Available Scripts

- `pnpm run dev`: push schema if DB is configured, then run Next dev server
- `pnpm run build`: production build
- `pnpm run start`: run built app
- `pnpm run type-check`: TypeScript check
- `pnpm run lint`: ESLint check
- `pnpm run validate`: type-check + lint + prettier check

## API Contracts (Baseline)

### `POST /api/craft`

Body:

```json
{
  "fid": 123,
  "username": "alice",
  "itemName": "Steam",
  "tier": "COMMON",
  "ingredients": ["water", "fire"],
  "isMegaMind": false
}
```

Returns awarded points and updated player stats.

### `GET /api/leaderboard?limit=50`

Returns ranked players plus recent mixed activity feed.

### `GET /api/tasks?fid=123&date=YYYY-MM-DD`

Returns generated/persisted daily tasks for the player.

### `POST /api/tasks`

Body:

```json
{
  "fid": 123,
  "taskId": "task-crafts",
  "action": "progress",
  "amount": 1
}
```

Updates a task and returns full updated task list.

### `POST /api/mint`

Body:

```json
{
  "fid": 123,
  "username": "alice",
  "itemName": "Nebula",
  "tokenId": 101,
  "txHash": "0xabc"
}
```

Awards mint points and updates player stats.

### `POST /api/gm`

Body:

```json
{
  "fid": 123,
  "username": "alice",
  "chain": "base",
  "txHash": "0xabc"
}
```

Awards GM points and updates player stats.

## Comprehensive Analysis

### What Is In Good Shape

- App now builds and runs as a complete Next.js project with typed routes and metadata.
- Runtime scaffolding is present: `next-env.d.ts`, Tailwind config, PostCSS config, ESLint flat config, env templates.
- API payloads are validated with Zod.
- Storage layer supports both persistent (DB) and non-blocking fallback (in-memory) dev behavior.

### Current Risks / Gaps

- `mini-app.tsx` is a large monolith (~2k LOC), making testing and regression control difficult.
- Frontend gameplay is not yet connected to the new API routes, so state is mostly client-local.
- No auth/authorization on API routes yet (any caller can mutate game state).
- No anti-cheat controls (server trust model currently accepts client-reported actions).
- No chain transaction verification yet for `/api/gm` and `/api/mint`.
- No dedicated normalized tables yet for players, crafts, tasks, mints; everything is stored in a KV blob.

### Recommended Next Refactor Steps

1. Wire the frontend gameplay actions to `/api/craft`, `/api/tasks`, `/api/leaderboard`, `/api/mint`, and `/api/gm`.
2. Split `mini-app.tsx` into feature modules (`crafting`, `tasks`, `leaderboard`, `admin`, `minting`, `state`).
3. Introduce typed domain tables in Drizzle (`players`, `craft_events`, `task_progress`, `mint_events`).
4. Add Farcaster identity checks and signed action verification for protected endpoints.
5. Add transaction verification for mint/GM flows using chain RPC + tx receipt checks.
6. Add tests (unit for scoring/task logic, integration for API routes).

## Verification Status

Validated locally after core setup:

- `pnpm run type-check` ✅
- `pnpm run lint` ✅
- `pnpm run build` ✅

## Important Files

- App shell: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Main game: `src/features/app/mini-app.tsx`
- Providers/init: `src/features/app/providers-and-initialization.tsx`
- API routes: `src/app/api/*/route.ts`
- Server state/storage: `src/server/game-state.ts`, `src/server/kv-store.ts`
- Database: `src/db/schema.ts`, `src/db/client.ts`, `drizzle.config.ts`
- Config: `src/config/public-config.ts`, `src/config/private-config.ts`, `src/config/types.ts`
