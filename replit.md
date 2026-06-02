# CrafterZ

A Farcaster alchemy mini-game where players combine elemental ingredients to discover new items, earn points, compete in MegaMind heists, rent AI agents, and mint discoveries as NFTs on-chain.

---

## Run & Operate

```bash
# Start both servers (Replit manages these as workflows)
pnpm --filter @workspace/api-server run dev   # Express API — port 8080
pnpm --filter @workspace/crafterz run dev     # Vite + React — port 25512

# Typecheck
pnpm run typecheck

# Build all packages
pnpm run build
```

**Required env vars (optional — app works without them):**
- `AI_API_KEY` — OpenAI-compatible key; enables AI crafting + AI gazette captions
- `AI_API_BASE_URL` — defaults to `https://api.openai.com/v1`
- `AI_MODEL` — defaults to `gpt-4o-mini`

---

## Stack

- **Monorepo:** pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend:** React 19, Vite 7, Tailwind CSS v4
- **Backend:** Express 5, esbuild bundle
- **Storage:** Replit KV (key-value store via `@replit/object-storage`) — no database required
- **Validation:** Zod
- **Fonts:** Geist, Geist Mono (Google Fonts)

---

## Where Things Live

```
artifacts/
  crafterz/          — React + Vite frontend
    src/features/app/
      mini-app.tsx           — root component, all tab wiring
      mini-app-components.tsx — AppHeader (weather badge), CraftingCanvas, CraftzBar
      app-types.ts           — AppTab union, shared types
      constants.ts           — CRAFTZ_MAX, CRAFTZ_COST, PTS, TIER_BADGE
      runtime-api.ts         — all fetch wrappers + server types
      hooks/
        use-crafting.ts      — drag-and-drop craft engine, energy refund logic
        use-craftz.ts        — Craftz energy state + regen timer
        use-server-sync.ts   — leaderboard + recent activity polling
        use-tasks.ts         — daily task state
        use-minting.ts       — NFT mint modal state machine
        use-weather.ts       — weather event polling (60s)
        use-agents.ts        — brain rental agent state
        use-feed.ts          — live feed polling (15s, lazy)
      tabs/
        inventory-tab.tsx    — item grid + search
        megaminds-tab.tsx    — MegaMind heist launcher + weapon picker
        tasks-tab.tsx        — daily tasks + GM on-chain
        feed-tab.tsx         — unified live feed (crafts, heists, propaganda, gazette)
        leaderboard-tab.tsx  — rankings table (used inside feed tab)
        agents-tab.tsx       — Brain Rental Job Board
        admin-tab.tsx        — admin panel

  api-server/         — Express backend
    src/
      lib/
        game-state.ts        — leaderboard, activity events, player stats, daily tasks
        kv-store.ts          — KV read/write helpers
        caption-state.ts     — AI/template gazette caption generation + moderation
        heist-state.ts       — heist resolution algorithm + bot opponent pool
        agent-state.ts       — 5 agent archetypes, rental logic, buff calculation
        weather-state.ts     — deterministic time-based weather events
        feed-state.ts        — unified FeedEvent KV log + propaganda templates
        feature-flags.ts     — server-side kill-switches for all agent features
      routes/
        game.ts              — /api/craft, /api/leaderboard, /api/tasks, /api/gm, /api/ai-craft
        heists.ts            — /api/heists/*
        agents.ts            — /api/agents/*
        weather.ts           — /api/weather/*
        captions.ts          — /api/captions/*
        feed.ts              — /api/feed
        health.ts            — /api/health

AGENT_FEATURES_BLUEPRINT.md  — full spec for all 4 agent features + x402 payment model
```

---

## Features

### Core Game
- **Alchemy crafting** — drag two items together on the canvas to combine them
- **AI crafting oracle** — server calls GPT-4o-mini to name, tier, and describe every new combination; results are cached globally
- **Craftz energy** — costs 5 Craftz per craft attempt; refunded if no recipe found; regens over time
- **MegaMind items** — first global discovery of any item earns the MegaMind badge + bonus points
- **NFT minting** — MegaMind items can be minted on-chain (wallet confirmation required)
- **Daily tasks** — rotating objectives with Craftz + XP rewards
- **GM on-chain** — send a Good Morning transaction for points
- **Leaderboard** — global rankings by points, updated on every craft/mint/GM

### Agent Features (Blueprint §2–5)

#### MegaMind Heists & Rivalry (`/api/heists`)
- Challenger picks a target MegaMind and a weapon item from their inventory
- 50 Craftz entry fee deducted autonomously (no wallet popup — in-game currency)
- Server resolves instantly against a bot opponent using a tier-score + generation tiebreak algorithm
- Win → Rivalry token badge + bonus points; result posted to live feed

#### Brain Rental Marketplace (`/api/agents`)
- 5 agent archetypes: Chronomancer, Pyromancer, Naturalist, Archivist, Trickster
- Each applies a unique buff (craftz regen, tier boost, gen reduce, pts bonus, reward double)
- Rental cost deducted autonomously via in-game Craftz (x402 architecture intent documented)
- Hiring an agent triggers their propaganda broadcast on the live feed

#### Dynamic Celestial Weather System (`/api/weather`)
- 6 weather event types: Lunar Eclipse, Meteor Shower, Solar Flare, Void Drift, Crystal Rain, Ethereal Mist
- Fully deterministic — computed from `Math.floor(Date.now() / 90min_window)`; no scheduler needed
- Every 4th window is a calm period
- Live weather badge displayed in AppHeader with animated pulse

#### AI-Curated Comedy Feed — Crafterz Gazette (`/api/captions`)
- Every MegaMind discovery triggers an AI-generated satirical caption (tabloid style)
- Regular crafts have a 25% chance of getting a caption
- 3-layer moderation: profanity blocklist → template fallback → safe fallback
- Players can 🤣 Ha-ha react or 🚩 report; 3 reports auto-suppresses a caption

#### Unified Live Feed (`/api/feed`)
- Single chronological stream merging: craft events, megamind discoveries, heist results, agent propaganda
- Gazette captions displayed below the live events
- Collapsible rankings panel inside the feed tab
- Polls every 15s, lazy (only active when feed tab is open)

---

## Architecture Decisions

- **KV over SQL** — Replit KV is zero-config and sufficient for a mini-game with ≤10k players; no migration headaches. All keys are versioned (`craftz:feed:v1`) so a schema change just uses a new key.
- **Deterministic weather** — no cron job, no scheduler, no drift. `windowIndex = floor(Date.now() / WINDOW_MS)` is the entire scheduler.
- **Fire-and-forget side effects** — caption generation, feed push, propaganda broadcast all happen after `res.json()` so they never block the HTTP response.
- **x402 architecture intent** — heist fees and rental costs use in-game Craftz deduction now; the API accepts `paymentMethod: "craftz" | "x402"` so swapping to real x402 micro-payments is a drop-in change per the blueprint §1.2.
- **Feature flags** — every agent feature has a server-side boolean kill-switch in `lib/feature-flags.ts`; flip it to disable without redeploy.
- **Craftz refund policy** — energy is only consumed on a successful craft. If the AI returns nothing, `CRAFTZ_COST` is refunded immediately. Strict no-hole policy enforced even for theoretically unreachable branches.

---

## User Preferences

- Agent micro-transactions (heist fees, rental costs) must be autonomous — no per-transaction wallet popup. Only user-initiated on-chain actions (mint, large ETH sends) require wallet confirmation.
- All features should fail open: network errors refund Craftz, captions fall back to templates, weather returns null on error.

---

## Gotchas

- `AI_API_KEY` is optional — all AI features degrade gracefully to deterministic fallbacks.
- The Replit badge is injected at the proxy layer (not in source files) and only appears inside Replit's preview environment; it won't appear on an external host.
- Vite proxies `/api/*` → `localhost:8080` in dev; the Express server must be running for any API call to work.
- KV keys are versioned — if you change a data shape, bump the version suffix (e.g. `v3` → `v4`) rather than migrating in place.
