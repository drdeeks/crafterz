# Changelog

All notable changes to this project are documented in this file.

## Unreleased

### Added

1. Added a client runtime API module at `src/features/app/runtime-api.ts` to centralize typed calls for leaderboard, tasks, craft, mint, and GM endpoints.
2. Added richer daily task support on the server in `src/server/game-state.ts` including task icons, rewards, mystery-target metadata, and deterministic daily generation aligned with the game UI.
3. Added server-side craft event metadata support for emoji payloads so recent discovery feeds can display crafted item visuals.
4. Added reusable UI primitives in `src/features/app/ui-primitives.tsx` for stat cards, admin actions, and task progress bars.
5. Added a dedicated discovery feed transformer module in `src/features/app/discovery-feed.ts` to convert backend activity events into display-ready discovery rows.
6. Added `src/features/app/crafting-engine.ts` to isolate deterministic craft simulation logic, including preset combinations, semantic tag matching, and fallback generation.
7. Added `src/features/app/mini-app-tabs.tsx` to host focused tab body components for inventory, MegaMinds, tasks, leaderboard, and admin screens.
8. Added `src/features/app/app-types.ts` to centralize shared gameplay and UI contract types used across mini-app modules.

### Changed

1. Updated `src/features/app/mini-app.tsx` to hydrate leaderboard/task state from API, keep leaderboard snapshots refreshed, and sync craft/mint/gm actions to backend routes.
2. Updated `src/features/app/mini-app.tsx` leaderboard rendering to use server-backed players when available while preserving local fallback behavior.
3. Updated `src/features/app/mini-app.tsx` recent discovery feed to derive live MegaMind entries from server activity instead of static-only mock rows.
4. Updated `src/app/api/craft/route.ts` to accept optional craft emoji arrays for richer event metadata.
5. Updated `src/features/app/mini-app.tsx` header with live sync health status (`Live`, `Syncing`, `Offline`) to make backend connectivity visible during development.
6. Updated `src/features/app/mini-app.tsx` to consume extracted tab components and delegate tab-body rendering through prop-driven modules.
7. Updated `src/features/app/runtime-api.ts` request handling with a client-side timeout guard so stalled network requests fail fast and recover to existing offline fallbacks.
8. Updated `src/features/app/discovery-feed.ts` minted item matching to normalize usernames/item names before key comparison for more robust cross-event reconciliation.

### Refactor

1. Refactored task progression and claim flows in `src/features/app/mini-app.tsx` to perform optimistic UI updates and then reconcile with server task snapshots.
2. Refactored score synchronization in `src/features/app/mini-app.tsx` so server player snapshots can reconcile local points/crafts/megaminds state.
3. Refactored `src/features/app/mini-app.tsx` by extracting presentation-only UI components and discovery feed mapping logic into dedicated modules for cleaner component boundaries.
4. Refactored craft engine internals out of `src/features/app/mini-app.tsx` into `src/features/app/crafting-engine.ts` while preserving existing crafting outcomes and MegaMind detection.
5. Refactored large tab sections out of `src/features/app/mini-app.tsx` into `src/features/app/mini-app-tabs.tsx` so gameplay state and tab presentation are separated.
6. Refactored shared frontend type definitions out of `src/features/app/mini-app.tsx` and `src/features/app/mini-app-tabs.tsx` into `src/features/app/app-types.ts` to reduce drift and remove unsafe local type duplication.
7. Refactored task hydration paths in `src/features/app/mini-app.tsx` to map server task responses without `as` casts, improving type safety while preserving optimistic reconciliation flow.
