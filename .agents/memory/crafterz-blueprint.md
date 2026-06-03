---
name: CrafterZ Blueprint Implementation
description: All 18 blueprint screens implemented, tab structure, and extension patterns.
---

# CrafterZ Blueprint Implementation

All screens from the Enterprise System Blueprint v1.1 are implemented.

## Tab Structure (8 tabs in AppTab type)
`forge | megaminds | tasks | gazette | market | observatory | archive | dashboard`

## Sub-tab counts per tab
- forge: inventory (search + tier filter) + crafting canvas
- megaminds: 2 sub-tabs (badge list + contest)
- tasks: daily tasks + weekly challenges + tip section
- gazette: 3 sub-tabs (gazette, feed, leaderboard) + caption submission form
- market (Agents): 6 sub-tabs (hire, listings, active, history, registry, expo)
- observatory: 5 sub-tabs (activity, relationships, status, weather, conference + A2A contracts)
- archive: 4 sub-tabs (history, legends, encyclopedia, records)
- dashboard: 4 sub-tabs (overview, admin, minting, craftz economy guide)

## Key API endpoints added
- `POST /api/captions` — submit caption with optional customText; AI or template fallback
- `GET /api/hint?a=X&b=Y` — recipe hint for two ingredient names
- `GET /api/weather/history` — last N weather events
- `GET /api/weather/cosmic-age` — current cosmic age label

## Extension patterns
- New sub-tabs: add id to union type, add to tabs array, render in content block
- New API routes: add file in `artifacts/api-server/src/routes/`, register in `server.ts`
- New constants: add to `artifacts/crafterz/src/features/app/constants.ts`

**Why:** Blueprint implementation is ongoing; this index prevents re-deriving tab structure from scratch each session.

**How to apply:** Before adding new screens, check this map to avoid duplicating sub-tabs or mis-labelling tab IDs.
