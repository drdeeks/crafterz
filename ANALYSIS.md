# CrafterZ Codebase Analysis

## Executive Summary

CrafterZ is a **Farcaster mini-app game** built with Next.js 16, TypeScript, and React 19. Players combine elemental ingredients to craft new items, discover MegaMinds (first-ever global discoveries), earn points, complete daily tasks, and mint NFTs on-chain. The application is currently in a **late development/early production** state with core gameplay functional but several critical gaps remaining.

---

## Project Structure

```
crafterz/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes (5 endpoints)
│   │   │   ├── craft/route.ts        # POST craft events, GET recent
│   │   │   ├── gm/route.ts           # POST GM transactions, GET recent
│   │   │   ├── leaderboard/route.ts  # GET leaderboard + activity
│   │   │   ├── mint/route.ts         # POST mint events, GET recent
│   │   │   └── tasks/route.ts        # GET/POST daily tasks
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout with providers
│   │   └── page.tsx                  # Main page, renders MiniApp
│   │
│   ├── components/                   # Shared React components
│   │   └── theme-client.tsx          # Neynar UI theme
│   │
│   ├── config/                      # Application configuration
│   │   ├── private-config.ts         # Server-side secrets (Neynar API key)
│   │   ├── public-config.ts          # Client-side app metadata
│   │   └── types.ts                  # TypeScript type definitions
│   │
│   ├── db/                          # Database Layer
│   │   ├── client.ts                 # Drizzle ORM + Postgres setup
│   │   └── schema.ts                 # Database schema (kv table only)
│   │
│   ├── features/                    # Feature modules
│   │   └── app/                      # Main game feature
│   │       ├── app-types.ts          # Game-specific types
│   │       ├── crafting-engine.ts   # Craft simulation logic (2,000+ combinations)
│   │       ├── discovery-feed.ts    # Activity feed transformer
│   │       ├── mini-app-tabs.tsx    # Tab components (Inventory, Tasks, etc.)
│   │       ├── mini-app.tsx         # Main gameplay component (~1,023 lines)
│   │       ├── providers-and-initialization.tsx  # Jotai + React Query providers
│   │       ├── runtime-api.ts       # Client API wrapper
│   │       └── ui-primitives.tsx     # Reusable UI components
│   │
│   ├── neynar-farcaster-sdk/         # Farcaster SDK wrapper
│   │   └── src/
│   │       ├── mini/index.tsx       # Mini-app initialization
│   │       └── nextjs/get-farcaster-page-metadata.ts
│   │
│   └── server/                      # Server utilities
│       ├── game-state.ts             # Core game logic & data models
│       └── kv-store.ts               # KV storage abstraction (DB + memory fallback)
│
├── .env.example                      # Environment template
├── .env.local                        # Local secrets
├── CHANGELOG.md                      # Recent changes
├── drizzle.config.ts                 # Drizzle Kit configuration
├── next.config.ts                    # Next.js configuration
├── package.json                      # Dependencies & scripts
├── postcss.config.mjs                # PostCSS configuration
├── README.md                         # Project documentation
├── tailwind.config.ts                # Tailwind CSS v4 configuration
└── tsconfig.json                     # TypeScript configuration
```

---

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 16.0.10 | App Router, React Server Components |
| **Language** | TypeScript | 5.9.3 | Type safety |
| **UI Library** | React | 19.2.3 | Component framework |
| **Styling** | Tailwind CSS | v4 | Utility-first CSS |
| **State Management** | Jotai | 2.15.0 | Atomic client state |
| **Data Fetching** | TanStack Query | 5.90.5 | Server state caching |
| **ORM** | Drizzle ORM | 0.38.3 | Database operations |
| **Database** | PostgreSQL | - | Persistent storage |
| **Validation** | Zod | 4.1.12 | Schema validation |
| **Blockchain** | Viem | 2.38.5 | EVM interactions |
| **Wallet** | Wagmi | 2.19.1 | Wallet connection |
| **Farcaster** | @farcaster/miniapp-sdk | 0.2.3 | Farcaster mini-app integration |
| **Farcaster** | @neynar/nodejs-sdk | 3.34.0 | Neynar API access |

---

## Core Architecture

### Data Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client UI      │────▶│   runtime-api   │────▶│   API Routes     │
│   (mini-app.tsx) │     │    (client)      │     │   (server)       │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                       │
                                                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   kv-store.ts    │◄────┤  game-state.ts  │◄────┤   DB Client    │
│  (abstraction)   │     │  (business logic)│     │  (Drizzle/Postgres)
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│   In-Memory      │
│   Map Fallback   │
└─────────────────┘
```

### Key Design Patterns

1. **Feature-Folder Architecture**: `src/features/app/` contains all game-specific logic
2. **API Route Pattern**: Each endpoint follows REST conventions with Zod validation
3. **Dual Storage**: DB persistence with in-memory fallback for development
4. **Optimistic Updates**: Client updates UI immediately, then reconciles with server
5. **Type-Safe API**: Full TypeScript types throughout the stack

---

## API Contract

### Endpoints Overview

| Method | Endpoint | Purpose | Validation |
|--------|----------|---------|------------|
| GET | `/api/leaderboard?limit=N` | Get ranked players + recent activity | Query param: limit |
| POST | `/api/leaderboard` | N/A | - |
| GET | `/api/craft?limit=N` | Get recent craft events | Query param: limit |
| POST | `/api/craft` | Record a craft action | Zod schema: fid, username, itemName, tier, ingredients, emojis, isMegaMind, pointsAwarded |
| GET | `/api/tasks?fid=N&date=YYYY-MM-DD` | Get user's daily tasks | Query params: fid, date |
| POST | `/api/tasks` | Update task progress/completion | Zod schema: fid, taskId, action, amount, dateKey |
| GET | `/api/mint?limit=N` | Get recent mint events | Query param: limit |
| POST | `/api/mint` | Record a mint action | Zod schema: fid, username, itemName, tokenId, txHash |
| GET | `/api/gm?limit=N` | Get recent GM events | Query param: limit |
| POST | `/api/gm` | Record a GM transaction | Zod schema: fid, username, chain, txHash |

### Data Models

#### PlayerStats
```typescript
{
  fid: number;
  username: string;
  points: number;
  crafts: number;
  megaMinds: number;
  minted: number;
  gmCount: number;
  lastUpdatedAt: string;
}
```

#### DailyTask
```typescript
{
  id: string;                    // e.g., "task-gm", "task-target"
  type: DailyTaskType;           // gm_onchain, craft_target, craft_count, etc.
  title: string;
  description: string;
  icon: string;                  // emoji
  points: number;
  xpReward: number;
  craftzReward: number;
  required: number;
  progress: number;
  completed: boolean;
  claimedAt?: number;
  targetItem?: string;           // For craft_target tasks
  targetHint?: string;
  targetEmojis?: [string, string?];
  updatedAt: string;
}
```

#### ActivityEvent
```typescript
{
  id: string;
  type: "craft" | "mint" | "gm";
  fid: number;
  username: string;
  pointsAwarded: number;
  timestamp: string;
  metadata?: Record<string, unknown>;  // itemName, tier, ingredients, emojis, isMegaMind, etc.
}
```

---

## Game Mechanics

### Point System (PTS)

| Action | Points | Notes |
|--------|--------|-------|
| Craft COMMON | 2 | Base crafting reward |
| Craft RARE | 5 | Higher tier craft |
| Craft LEGENDARY | 15 | Highest tier craft |
| MegaMind Bonus | +15 | First global discovery |
| Mint MegaMind | 25 | Replaces tier points (total) |
| GM On-Chain | 10 | Daily GM transaction |

### Crafting System

**Initial Elements (Genesis):**
- Water (💧), Fire (🔥), Earth (🌍), Air (💨), Sun (☀️), Moon (🌙), Time (⏰)

**Combination Logic:**
1. **Preset Combinations** (~300+ defined in `crafting-engine.ts`)
2. **Same-item intensification** (e.g., fire+fire = Inferno)
3. **Semantic tag matching** (fallback based on item categories)
4. **Last resort fallback** (constructs meaningful fused names)

**Deterministic:** Same inputs always produce same output

**MegaMind Detection:** First player globally to craft a specific item gets bonus points and MegaMind status

### Daily Tasks (7 per day)

1. **Send GM On-Chain** - Send GM tx on any supported chain (10 pts)
2. **Today's Mystery Craft** - Craft a specific target item using hints (20 pts)
3. **Craft N Items** - Complete N crafts (3-10, selected randomly) (2×N pts)
4. **Craft Something Rare+** - Craft RARE or LEGENDARY (15 pts)
5. **Forge a Legend** - Craft LEGENDARY tier (30 pts)
6. **Mint a MegaMind** - Mint any MegaMind NFT (40 pts)
7. **Achieve a MegaMind** - Be first to craft any item (50 pts)

### Craftz Token (In-Game Currency)

- **Max:** 100
- **Regen:** +1 every 2.5 seconds
- **Cost:** 5 per craft
- **Rewards:** Earned from completing tasks (craftzReward field)

### Supported EVM Chains

Base, Ethereum, Optimism, Arbitrum, Polygon, Zora

---

## Current Implementation Status

### ✅ Complete & Working

| Component | Status | Notes |
|-----------|--------|-------|
| Next.js project structure | ✅ | Full scaffolding with TypeScript |
| Build system | ✅ | `pnpm build` works |
| Type checking | ✅ | `pnpm type-check` passes |
| Linting | ✅ | ESLint configured |
| API Routes | ✅ | All 5 endpoints with Zod validation |
| Game state logic | ✅ | Points, crafts, MegaMinds tracking |
| Task system | ✅ | Generation, progress, completion |
| Crafting engine | ✅ | 300+ preset combinations + semantic fallback |
| Storage layer | ✅ | Postgres via Drizzle ORM + in-memory fallback |
| Client-server sync | ✅ | Polling with optimistic updates |
| Discovery feed | ✅ | Real activity from server |
| UI/UX | ✅ | All tabs functional (Inventory, MegaMinds, Tasks, Leaderboard, Admin) |
| Farcaster integration | ✅ | SDK initialized, metadata configured |

### ⚠️ Partially Implemented / Needs Attention

| Component | Status | Details |
|-----------|--------|---------|
| **Frontend-Backend Integration** | ⚠️ | Gameplay actions call API but client state not fully wired to server |
| **Authentication** | ⚠️ | No auth on API routes - anyone can mutate any player's state |
| **Anti-Cheat** | ⚠️ | Server trusts client-reported actions (crafts, mints, etc.) |
| **Transaction Verification** | ⚠️ | No chain verification for `/api/gm` and `/api/mint` |
| **Database Schema** | ⚠️ | Only KV table exists; no normalized tables for players, crafts, tasks |

### ❌ Missing / Not Implemented

| Component | Status | Details |
|-----------|--------|---------|
| **Farcaster Identity Verification** | ❌ | Cannot verify user's FID from requests |
| **Signed Actions** | ❌ | No cryptographic proof of action authorship |
| **Rate Limiting** | ❌ | No protection against spam/abuse |
| **Tests** | ❌ | No unit or integration tests |
| **Normalized Database Tables** | ❌ | All data stored in KV blobs |
| **Admin Dashboard** | ⚠️ | Basic admin UI exists but limited functionality |
| **Actual NFT Minting** | ❌ | Mint flow is simulated (no real contract interaction) |

---

## Code Quality Analysis

### Strengths

1. **Type Safety**: Excellent TypeScript coverage with proper types throughout
2. **Validation**: All API inputs validated with Zod schemas
3. **Separation of Concerns**: Clean separation between server logic and client UI
4. **Error Handling**: Graceful fallbacks (DB → memory store)
5. **Deterministic Logic**: Crafting results are predictable and reproducible
6. **Modularity**: Feature folder structure promotes good organization
7. **Documentation**: README is comprehensive and up-to-date
8. **Configuration**: Environment variables properly separated (public/private)

### Code Smells & Technical Debt

| Location | Issue | Severity | Recommendation |
|----------|-------|----------|----------------|
| `mini-app.tsx` | 1,023 lines, multiple concerns | HIGH | Split into smaller feature components |
| API routes | No auth/authorization | CRITICAL | Add Farcaster signature verification |
| `kv-store.ts` | Generic KV abstraction | MEDIUM | Consider typed repositories per entity |
| `game-state.ts` | Business logic mixed with storage | MEDIUM | Separate domain logic from persistence |
| In-memory fallback | Non-persistent | LOW | Acceptable for development only |
| No tests | High risk of regression | HIGH | Add unit tests for core logic |

### Duplicate Code

- Crafting engine logic exists in both client (`crafting-engine.ts`) and server (`game-state.ts`)
- Point constants (PTS) duplicated in multiple files
- Task generation logic mirrored between client and server

### Performance Considerations

- Client polls server every 15 seconds for leaderboard updates
- No pagination on activity feed (limited to 300 items)
- In-memory cache for craft recipes (SESSION_RECIPE_CACHE)
- Optimistic UI updates provide smooth UX

---

## Security Analysis

### Critical Vulnerabilities

| Issue | Risk Level | Impact | Fix Priority |
|-------|------------|--------|--------------|
| **No Authentication** | CRITICAL | Any user can modify any player's state | P0 - Immediate |
| **No Input Sanitization** | HIGH | Malicious payloads could corrupt data | P0 |
| **No Rate Limiting** | HIGH | Easy to spam API endpoints | P1 |
| **No Transaction Verification** | HIGH | Users can claim points for fake mints/GMs | P1 |
| **Cross-User Data Tampering** | CRITICAL | Can modify other players' points/crafts | P0 |

### Recommended Security Improvements

1. **Farcaster Signature Verification**
   - Require signed messages for all state-modifying requests
   - Use `@neynar/nodejs-sdk` to verify FID and signature
   - Example: Verify `fid` matches the signing key

2. **Nonce System**
   - Implement replay protection with nonces
   - Store used nonces to prevent duplicate submissions

3. **Actual Chain Verification**
   - For `/api/gm`: Verify transaction exists on-chain
   - For `/api/mint`: Verify token was actually minted to user
   - Use `viem` to query chain state

4. **Rate Limiting**
   - Per-array, per-endpoint rate limits
   - Consider using `@vercel/sdk` or similar

5. **Input Validation Enhancement**
   - Current: Zod schema validation (good)
   - Add: Business rule validation (e.g., can't craft with items you don't own)

---

## Database Analysis

### Current Schema

```sql
-- Only table that exists:
kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)
```

All game data stored as JSON blobs:
- `craftz:leaderboard:v1` - Player stats (fid → PlayerStats)
- `craftz:activity:v1` - Activity events array
- `craftz:tasks:v1:YYYY-MM-DD:FID` - Daily tasks per user per day

### Problems with Current Approach

1. **No Query Capabilities**: Can't filter/sort/aggregate without loading entire dataset
2. **No Indexes**: Performance degrades as data grows
3. **No Relationships**: No foreign keys, data integrity not enforced
4. **No Typography**: All values are TEXT, no proper data types
5. **Race Conditions**: Concurrent writes could cause conflicts

### Recommended Schema Migration

```typescript
// Proposed tables in src/db/schema.ts

// Players
export const players = pgTable("players", {
  fid: integer("fid").primaryKey(),
  username: text("username").notNull(),
  points: integer("points").default(0),
  crafts: integer("crafts").default(0),
  megaMinds: integer("mega_minds").default(0),
  minted: integer("minted").default(0),
  gmCount: integer("gm_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Craft Events
export const craftEvents = pgTable("craft_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  fid: integer("fid").references(() => players.fid),
  itemName: text("item_name").notNull(),
  tier: text("tier", { enum: ["COMMON", "RARE", "LEGENDARY"] }).notNull(),
  ingredients: text("ingredients").array(),
  emojis: text("emojis").array(),
  isMegaMind: boolean("is_megamind").default(false),
  pointsAwarded: integer("points_awarded").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Mint Events
export const mintEvents = pgTable("mint_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  fid: integer("fid").references(() => players.fid),
  itemName: text("item_name").notNull(),
  tokenId: integer("token_id"),
  txHash: text("tx_hash"),
  pointsAwarded: integer("points_awarded").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// GM Events
export const gmEvents = pgTable("gm_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  fid: integer("fid").references(() => players.fid),
  chain: text("chain").notNull(),
  txHash: text("tx_hash"),
  pointsAwarded: integer("points_awarded").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Daily Tasks
export const dailyTasks = pgTable("daily_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  fid: integer("fid").references(() => players.fid),
  date: date("date").notNull(),
  taskId: text("task_id").notNull(),
  taskType: text("task_type").notNull(),
  progress: integer("progress").default(0),
  required: integer("required").notNull(),
  completed: boolean("completed").default(false),
  claimedAt: timestamp("claimed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.fid, table.date, table.taskId] }),
}));

// Discovered Items (MegaMinds)
export const discoveredItems = pgTable("discovered_items", {
  name: text("name").primaryKey(),
  discovererFid: integer("discoverer_fid").references(() => players.fid),
  discovererUsername: text("discoverer_username").notNull(),
  tier: text("tier", { enum: ["COMMON", "RARE", "LEGENDARY"] }).notNull(),
  emojis: text("emojis").array(),
  discoveredAt: timestamp("discovered_at").defaultNow(),
});
```

---

## File Statistics

| File | Lines | Complexity | Notes |
|------|-------|------------|-------|
| `mini-app.tsx` | 1,023 | HIGH | Main gameplay component |
| `crafting-engine.ts` | 822 | HIGH | Craft combinatorics |
| `game-state.ts` | 483 | MEDIUM | Server business logic |
| `discovery-feed.ts` | 69 | LOW | Feed transformer |
| `app-types.ts` | 75 | LOW | Type definitions |
| API routes | ~50 each | LOW | Simple CRUD endpoints |

**Total Source Files:** ~25 TypeScript files
**Total Lines (src/):** ~3,500 lines
**Test Coverage:** 0%

---

## Build & Deployment

### Scripts Available

```bash
# Development
pnpm run dev              # Start dev server with schema push
pnpm run dev:webpack      # Use webpack instead of turbopack

# Build
pnpm run build            # Production build
pnpm run start            # Run built app

# Quality
pnpm run type-check       # TypeScript validation
pnpm run lint             # ESLint check
pnpm run lint:fix         # Auto-fix lint issues
pnpm run format           # Prettier formatting
pnpm run validate          # Full validation (type + lint + format)

# Database
pnpm run db:push          # Push schema to database

# Deployment
pnpm run deploy:raw       # Vercel production deploy
pnpm run deploy:vercel    # Custom deploy script
```

### Environment Variables

| Variable | Required | Purpose | Default |
|----------|----------|---------|---------|
| `DATABASE_URL` | No | PostgreSQL connection string | - |
| `NEYNAR_API_KEY` | Yes | Neynar API authentication | - |
| `COINGECKO_API_KEY` | No | Coingecko API (has fallback) | Demo key provided |
| `NEXT_PUBLIC_VERCEL_PRODUCTION_URL` | No | Production URL for metadata | localhost:3000 |

### Deployment Targets

- **Primary:** Vercel (Next.js optimized)
- **Database:** PostgreSQL (Supabase, Neon, or self-hosted)
- **Farcaster:** Any Farcaster client with mini-app support

---

## Recommendations & Next Steps

### Priority 1: Security (Do This First)

1. **Add Authentication to API Routes**
   ```typescript
   // Example: Verify Farcaster signature
   import { NeynarAPIClient } from '@neynar/nodejs-sdk';
   
   const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
   const { fid, signature } = await request.json();
   const isValid = await neynar.verifySignature(fid, signature, message);
   ```

2. **Add Transaction Verification**
   ```typescript
   // For /api/gm - verify tx exists
   import { createPublicClient, http } from 'viem';
   import { base } from 'viem/chains';
   
   const client = createPublicClient({ chain: base, transport: http() });
   const txReceipt = await client.getTransactionReceipt({ hash: txHash });
   // Verify tx is from user's address and matches expected data
   ```

3. **Implement Rate Limiting**
   ```typescript
   // Example with simple in-memory rate limiter
   const rateLimitMap = new Map<string, { count: number, resetAt: number }>();
   function checkRateLimit(ip: string, max: number, windowMs: number) { ... }
   ```

### Priority 2: Data Integrity

4. **Migrate to Normalized Schema**
   - Create proper tables for players, crafts, mints, tasks
   - Add indexes for performance
   - Create migration scripts

5. **Add Data Validation at Server Level**
   - Ensure players can't craft items they don't own
   - Prevent duplicate MegaMind claims
   - Validate business rules

### Priority 3: Code Quality

6. **Split `mini-app.tsx` into Smaller Components**
   - `CraftingCanvas.tsx` - Canvas and drag-drop logic
   - `PointSystem.tsx` - Point tracking and toasts
   - `TaskManager.tsx` - Task progression and claiming
   - `LeaderboardView.tsx` - Leaderboard display
   - `MintModal.tsx` - Mint flow UI

7. **Add Unit Tests**
   ```typescript
   // Example test for crafting engine
   describe('simulateCraft', () => {
     it('should return Steam for fire+water', () => {
       const result = simulateCraft('fire', 'water', new Set());
       expect(result.name).toBe('Steam');
       expect(result.tier).toBe('COMMON');
     });
   });
   ```

8. **Add Integration Tests**
   - Test API routes with mock database
   - Test client-server interaction

### Priority 4: Features & Enhancements

9. **Connect Frontend to Backend**
   - Replace client-side state with server data
   - Wire up all gameplay actions to API routes
   - Remove mock data

10. **Implement Real NFT Minting**
    - Deploy smart contract
    - Integrate with wagmi/viem
    - Update mint flow

11. **Add Admin Features**
    - Player lookup/search
    - Stats dashboard
    - Configuration management
    - Broadcast messages

12. **Add Social Features**
    - Share crafted items on Farcaster
    - Leaderboard sharing
    - Achievement badges

### Priority 5: Performance & Scalability

13. **Implement Caching**
    - Redis for frequently accessed data
    - Cache leaderboard calculations

14. **Add Pagination**
    - Activity feed pagination
    - Leaderboard with cursor-based pagination

15. **Optimize Database Queries**
    - Add proper indexes
    - Use materialized views for leaderboard

---

## Success Metrics

### Current State
- ✅ Build: Passing
- ✅ Type Check: Passing  
- ✅ Lint: Passing
- ✅ Local Dev: Working
- ❌ Tests: 0% coverage
- ❌ Security: No authentication
- ❌ Production Ready: No

### Target State
- ✅ Build: Passing
- ✅ Type Check: Passing
- ✅ Lint: Passing
- ✅ Tests: >80% coverage
- ✅ Security: All endpoints authenticated
- ✅ Production Ready: Yes
- ✅ Monitoring: Errors, performance tracked
- ✅ Documentation: Complete

---

## Conclusion

CrafterZ is a **well-architected, feature-rich** Farcaster mini-app with strong foundations. The core gameplay mechanics are implemented and functional. However, **critical security gaps** must be addressed before production deployment, particularly around authentication and anti-cheat measures.

The codebase demonstrates **good TypeScript practices**, **clean separation of concerns**, and **thoughtful error handling**. The main areas for improvement are:

1. **Security** (P0) - Add authentication and validation
2. **Data Model** (P1) - Migrate from KV to normalized tables
3. **Testing** (P2) - Add comprehensive test coverage
4. **Code Organization** (P3) - Split monolithic components
5. **Features** (P4) - Complete frontend-backend integration

Once these are addressed, CrafterZ will be production-ready for deployment as a Farcaster mini-app.

---

*Analysis generated on: 2025-04-23*
*Codebase: CrafterZ v0.1.0*
