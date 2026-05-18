# CrafterZ — Comprehensive Bug & Error Analysis

> Generated: 2026-05-18
> Scope: Full codebase audit — client, server, API, auth, payments, storage

---

## CRITICAL (P0 — Data Loss, Security, or Complete Breakage)

### C1. Duplicate `agentType` Declaration in `/api/tasks/route.ts`
**File:** `src/app/api/tasks/route.ts:23` and `src/app/api/tasks/route.ts:35`
**Issue:** `const agentType` is declared twice in the same scope. Line 23 declares it, then line 35 re-declares it with `const`, which is a **TypeScript compilation error** (`Cannot redeclare block-scoped variable 'agentType'`).
```ts
// Line 23:
const agentType = request.nextUrl.searchParams.get("agentType") as AgentType || "farcaster";
// Line 35 (duplicate):
const agentType = request.nextUrl.searchParams.get("agentType") as AgentType || "farcaster";
```
**Impact:** Build will fail. The GET handler in `/api/tasks` cannot compile.

### C2. `verifyMessage` Used Incorrectly for Address Recovery
**File:** `src/lib/auth/agents.ts:251`
**Issue:** `verifyMessage` from viem does NOT recover an address — it only verifies that a given address signed a message. The code passes `"0x000...000"` as the address to verify against, which will **always return false** (or throw). To recover an address from a signature, you need `recoverMessageAddress` from viem, not `verifyMessage`.
```ts
const recoveredAddress = await verifyMessage({
  address: "0x0000000000000000000000000000000000000000" as Address, // WRONG
  message,
  signature: normalizedSignature,
}).catch(() => null);
```
**Impact:** ALL Ethereum/EVM signature verification (Farcaster, x40, ENS) always fails. No user can authenticate via EVM signatures.

### C3. `require("crypto")` in Client-Safe Module
**File:** `src/lib/auth/agents.ts:269`
**Issue:** `require("crypto")` is a Node.js CommonJS call. This file may be bundled in edge/server contexts, but using `require` directly is incompatible with ES module setups and Next.js App Router. Should use `import { createHash } from "crypto"` at the top of the file.
**Impact:** Runtime error in some environments; breaks `hashBody()` and thus message building for signature verification.

### C4. Security Middleware Returns `NextResponse.next()` But Body Is Already Consumed
**File:** `src/lib/auth/middleware.ts:126`
**Issue:** `extractAndVerifyAgent` calls `await request.json()` to get the body for signature verification. This **consumes the request body stream**. When the API route handler later calls `await request.json()` (e.g., `src/app/api/craft/route.ts:61`), it gets `null` or throws because the body stream is already consumed.
**Impact:** All POST requests that go through security middleware will fail to parse the body, returning 400 errors.

### C5. Nonce System Has No Expiry — Memory Leak
**File:** `src/lib/auth/nonce.ts:1-7`
**Issue:** The nonce `Set` grows unbounded. Nonces are added but never removed. There is no TTL, no cleanup, and no size limit. In production this will cause a memory leak.
**Impact:** Server memory grows indefinitely; eventual OOM crash.

---

## HIGH (P1 — Functional Bugs, Incorrect Logic)

### H1. Client Sends FID-Only Payload But Server Expects Agent Headers
**File:** `src/features/app/runtime-api.ts:140-156` (and all POST functions)
**Issue:** The client sends `{ fid, username, itemName, ... }` but the server routes expect `agentId`, `agentType`, `address` headers set by security middleware. The client does NOT send `x-agent-id`, `x-agent-type`, `x-signature`, `x-nonce`, `x-timestamp` headers. The middleware will reject all client requests as unauthorized.
**Impact:** All client-side POST operations (craft, mint, gm, tasks) fail with 401.

### H2. `runtime-api.ts` `ServerPlayer` Type Mismatch
**File:** `src/features/app/runtime-api.ts:3-12`
**Issue:** `ServerPlayer` has `fid: number` but the server `PlayerStats` uses `agentId: string`, `agentType: string`, and `fid?: number`. The leaderboard API returns `PlayerStats` spread with `x402Spent`, but the client type expects `fid` as required. The `syncFromServerPlayer` callback in `mini-app.tsx:322` accesses `player.fid` which may be undefined.
**Impact:** Type mismatch causes incorrect leaderboard rendering and potential runtime errors.

### H3. `ServerActivity` Type Missing `agentId`/`agentType` Fields
**File:** `src/features/app/runtime-api.ts:15-23`
**Issue:** `ServerActivity` defines `fid: number` but the server `ActivityEvent` uses `agentId`, `agentType`, and `fid?`. The `toDiscoveryFeed` function accesses `event.username` and `event.metadata` which exist, but the `fid` field may be undefined in the actual server response.
**Impact:** Potential runtime undefined errors when processing activity events.

### H4. `handlePointerDown` Captures Stale `canvasItems`
**File:** `src/features/app/mini-app.tsx:688`
**Issue:** `handlePointerDown` is wrapped in `useCallback` with `[canvasItems, ...]` dependency. Inside the callback, `canvasItems.find(...)` at line 516 reads from the closure. However, the `onMove` and `onUp` handlers are registered via `document.addEventListener` and reference `canvasItems` from the closure at registration time, not at event time. This means drag operations may use stale canvas state.
**Impact:** Drag-and-drop may behave incorrectly when canvas items change during a drag.

### H5. `awardPoints` and `advanceTask` Called Inside `setTimeout` Without Stable References
**File:** `src/features/app/mini-app.tsx:553-582`
**Issue:** `awardPoints` and `advanceTask` are regular functions (not wrapped in `useCallback`) but are called inside a `setTimeout` callback that fires 650ms later. These functions reference state variables (`setMyPoints`, `setDailyTasks`) via closure. While React's functional setState handles this for `setMyPoints`, `advanceTask` reads `dailyTasks` from closure which will be stale.
**Impact:** Task progress may be calculated against outdated task state.

### H6. `mintModal` Closure Staleness in `advanceMint`
**File:** `src/features/app/mini-app.tsx:695-724`
**Issue:** `advanceMint` reads `mintModal` from closure. When called from the "Mint NFT" button onClick, it reads the current state correctly. But the `setTimeout` callbacks inside `advanceMint` (lines 699, 700) also reference `mintModal` from the closure at the time `advanceMint` was called, which may be stale if state changes during the timeout chain.
**Impact:** Mint phase transitions may reference wrong item data.

### H7. `recordCraft` Has Incorrectly Indented Code Block
**File:** `src/server/game-state.ts:463-499`
**Issue:** The X402 verification block inside `recordCraft` has excessive blank lines and strange indentation (lines 465-494). While not a functional bug, the `if (typeof address !== "number")` check is redundant since `address` is typed as `string | undefined` and already checked for truthiness in the outer `if`. More importantly, the entire X402 verification block is inside `if (input.txHash && input.chainId && input.address)` but the inner check `if (typeof address !== "number")` is always true, making the outer check partially redundant.
**Impact:** Code quality issue; misleading structure.

### H8. `saveLeaderboardStore` Serializes `fid: 0` for Non-Farcaster Players
**File:** `src/server/game-state.ts:321-333`
**Issue:** When saving to the old-format leaderboard, `fid: player.fid || 0` sets `fid` to `0` for non-Farcaster agents (x40, ENS, Solana) that don't have an `fid` field. This corrupts the legacy format and could cause issues during migration reads.
**Impact:** Legacy data corruption; potential migration failures.

### H9. `getDailyTasks` in `game-state.ts` Uses Wrong `agentId` for Lookup
**File:** `src/server/game-state.ts:886`
**Issue:** `updateDailyTask` calls `getDailyTasks(input.agentId, input.agentType, dateKey)` but `getDailyTasks` internally normalizes the agentId again. This double-normalization is harmless but inconsistent. More critically, `updateDailyTask` at line 884 creates `key` with `normalizedAgentId` but then calls `getDailyTasks` with the raw `input.agentId`, which will normalize it again — potentially creating a mismatch if normalization is not perfectly idempotent.
**Impact:** Potential task data lookup failures.

### H10. `CHAIN_MAP` Only Supports Base (8453) But `mapChainStringToId` Returns Many IDs
**File:** `src/server/game-state.ts:7-9` vs `src/server/game-state.ts:76-88`
**Issue:** `CHAIN_MAP` only has `{ 8453: base }`, but `mapChainStringToId` returns IDs for Ethereum (1), Optimism (10), Arbitrum (42161), Polygon (137), Zora (7777777). When `verifyTransactionOnChain` is called with any chainId other than 8453, `CHAIN_MAP[chainId]` returns `undefined`, causing the verification to fail with "Unsupported chain ID".
**Impact:** Transaction verification fails on all chains except Base, despite claiming to support multiple chains.

### H11. Mint Route Has Duplicate `verifyTxOnChain` Function
**File:** `src/app/api/mint/route.ts:14-32` vs `src/server/game-state.ts:14-71`
**Issue:** The mint route defines its own `verifyTxOnChain` function that duplicates the one in `game-state.ts`. They have slightly different logic (the mint route version doesn't use `CHAIN_MAP` correctly either — it imports `base` but uses `CHAIN_MAP` which only has 8453). This is code duplication that can drift.
**Impact:** Maintenance burden; potential inconsistency in verification logic.

### H12. `GENESIS_ITEMS` Has Invalid Category Values
**File:** `src/features/app/semantic-crafting.ts:35-108`
**Issue:** `SemanticCategory` type is defined as `"element" | "compound" | "concept" | "mythical" | "legendary" | "void"` (line 11), but `GENESIS_ITEMS` uses categories like `"energy"`, `"life"`, `"terrain"`, `"weather"`, `"celestial"`, `"time"`, `"abstract"` which are NOT in the `SemanticCategory` union. TypeScript should flag this, but the `as const` or loose typing may hide it.
**Impact:** Category-based combination templates will never match because the categories don't exist in the type definition, causing all non-logical combinations to fall through to the generic fallback.

### H13. `CATEGORY_COMBINATIONS` Uses Categories Not in `GENESIS_ITEMS`
**File:** `src/features/app/semantic-crafting.ts:157-186`
**Issue:** The `CATEGORY_COMBINATIONS` array references `"mythical"`, `"terrain"`, `"celestial"`, `"time"` as categories, but no genesis items actually have these as their first category (index 0). For example, `sun` has `["celestial", "energy", "light"]` so `categories[0]` is `"celestial"`, but `moon` has `["celestial", "time"]` so its first category is also `"celestial"`. The template lookup at line 316 checks `defA.categories[0]` and `defB.categories[0]`, which means only the primary category is considered.
**Impact:** Most category-based combinations will not match any template, falling through to generic name generation.

### H14. `determineTier` Never Returns "LEGENDARY"
**File:** `src/features/app/semantic-crafting.ts:195-204`
**Issue:** The `determineTier` function only returns `"RARE"` (multiplier >= 2) or `"COMMON"` (default). There is no path that returns `"LEGENDARY"`. The `TIER_ESCALATION` map maxes out at value 2, and the logic has no threshold for legendary.
**Impact:** No item can ever be crafted as LEGENDARY tier through the semantic system. The `task-legendary` daily task is effectively impossible to complete.

### H15. `GLOBAL_REGISTRY` in `mini-app.tsx` Doesn't Match `GENESIS_ITEMS`
**File:** `src/features/app/mini-app.tsx:63-66` vs `src/features/app/semantic-crafting.ts:35-108`
**Issue:** `GLOBAL_REGISTRY` contains items like `'steam', 'lava', 'mud', 'rain', 'dust', 'desert', 'crater', 'ash', 'brick', 'cloud', 'volcano', 'plant', 'lightning'` but `LOGICAL_COMBINATIONS` only defines results for `fire+water=Steam`, `water+earth=Mud`, `earth+fire=Lava`, `air+water=Mist`, `air+earth=Dust`, `air+fire=Plasma`, `fire+life=Cooked`, `water+life=Hydrated`, `earth+life=Plant`, `air+life=Bird`. Items like `'rain'`, `'desert'`, `'crater'`, `'ash'`, `'brick'`, `'cloud'`, `'volcano'`, `'lightning'` are in the registry but have no way to be produced by the crafting system.
**Impact:** Inconsistent state; registry contains unreachable items.

---

## MEDIUM (P2 — UX Issues, Minor Bugs, Warnings)

### M1. `ADMIN_FID` and `CURRENT_USER_FID` Are Hardcoded to Same Value
**File:** `src/features/app/mini-app.tsx:48-49`
**Issue:** Both are `99999`, meaning every user is always an admin. This is clearly placeholder code that was never updated to use real Farcaster identity.
**Impact:** Every user sees the admin tab and has admin privileges on the client side.

### M2. `craftz` Initial State Is Hardcoded to 87
**File:** `src/features/app/mini-app.tsx:290-291`
**Issue:** Both `useState(87)` and `useRef(87)` are hardcoded. New users should start at a defined value (e.g., `CRAFTZ_MAX = 100`), and this should be synced from the server.
**Impact:** All users start with 87 Craftz instead of a proper initial value.

### M3. `refreshServerSnapshot` Filters Out Current User From `serverPlayers`
**File:** `src/features/app/mini-app.tsx:348-350`
**Issue:** The current player is filtered out of `serverPlayers` and only synced via `syncFromServerPlayer`. But `leaderboardData` useMemo uses `serverPlayers` as `basePlayers` and then inserts `me`. If the server returns the current user in the leaderboard, they're correctly filtered. However, if `serverPlayers.length === 0` (server offline), it falls back to `OTHER_PLAYERS` mock data, which means the real leaderboard is lost.
**Impact:** When server is unavailable, leaderboard shows fake mock data instead of last-known real data.

### M4. `postCraftEvent`, `postMintEvent`, `postGmEvent` Don't Send Auth Headers
**File:** `src/features/app/runtime-api.ts:140-185`
**Issue:** These functions send `body: JSON.stringify(input)` with only `content-type: application/json` header. They don't include `x-agent-id`, `x-agent-type`, `x-signature`, `x-nonce`, `x-timestamp`, or `x-address` headers required by the security middleware.
**Impact:** All POST requests will be rejected with 401 Unauthorized.

### M5. `fetchTasks` Sends `fid` as Query Param But Server Expects `agentId` + `agentType`
**File:** `src/features/app/runtime-api.ts:108-110` vs `src/app/api/tasks/route.ts:20-43`
**Issue:** Client sends `/api/tasks?fid=${fid}`. The server GET handler reads `fid` from query params but also tries to read `agentType`. The error message says "'fid' or 'agentId' is required" but only `fid` is checked. For non-Farcaster agents, this endpoint won't work.
**Impact:** Task fetching only works for Farcaster users.

### M6. `progressTask` and `completeTask` Send `fid` But Server Expects `agentId` + `agentType`
**File:** `src/features/app/runtime-api.ts:113-138`
**Issue:** Client sends `{ fid, taskId, action }` but the server POST schema expects `{ agentId, agentType, taskId, action }`. The Zod schema will reject the payload because `agentId` is required.
**Impact:** Task progress/complete operations always fail with 400 validation error.

### M7. `isGenesisItem` Uses `name.toLowerCase().trim()` But `GENESIS_ITEMS` Keys Are Already Lowercase
**File:** `src/features/app/crafting-engine.ts:57-59`
**Issue:** Minor — the normalization is correct but redundant since all keys in `GENESIS_ITEMS` are already lowercase. Not a bug, just unnecessary computation.
**Impact:** Negligible performance overhead.

### M8. `semanticCraft` Cache Is Never Used
**File:** `src/features/app/semantic-crafting.ts:265, 349-352`
**Issue:** `craftCache` is defined and `getCachedCraft`/`clearCraftCache` are exported, but `semanticCraft` never reads from or writes to the cache. The cache is dead code.
**Impact:** Missed optimization opportunity; dead code.

### M9. `priceToBigInt` Assumes 1 USD = 1 Token
**File:** `src/lib/x402/index.ts:132-139`
**Issue:** The comment explicitly states "For now, assume 1 USD = 1 token (actual conversion depends on oracle)". This means prices like `$0.01` are converted to `0.01 * 10^18` wei, which is not the correct USD-to-crypto conversion.
**Impact:** Payment amounts are mathematically incorrect for real-world use.

### M10. `WHITELISTED_ADDRESSES` Is a `const` Array — Cannot Be Modified at Runtime
**File:** `src/lib/x402/config.ts:53-56` and `src/lib/x402/index.ts:101-119`
**Issue:** `addToMintWhitelist` and `removeFromMintWhitelist` log messages but cannot actually modify the `WHITELISTED_ADDRESSES` const array. The admin whitelist API routes (POST/DELETE) also acknowledge this limitation in comments.
**Impact:** Whitelist management API endpoints are non-functional; they always return a "note" saying to use env vars.

### M11. `OWNER_ADDRESS` Falls Back to Default Zero Address
**File:** `src/lib/x402/config.ts:68-69`
**Issue:** If `X402_OWNER_ADDRESS` is not set, `OWNER_ADDRESS` falls back to `WALLET_ADDRESSES.evm`, which itself falls back to `"0x000...000"`. This means `isOwner()` will match the zero address if neither env var is set.
**Impact:** Anyone with the zero address could be considered owner in misconfigured environments.

### M12. `x-forwarded-for` Can Be Spoofed for Rate Limiting
**File:** `src/lib/auth/middleware.ts:37`
**Issue:** Rate limiting uses `request.headers.get("x-forwarded-for")` which is a client-controllable header. An attacker can spoof their IP to bypass rate limits.
**Impact:** Rate limiting is ineffective against determined attackers.

### M13. `request.json()` Called Twice in Middleware
**File:** `src/lib/auth/middleware.ts:126`
**Issue:** In addition to C4, even if the body were cloned, calling `request.json()` in middleware and then again in the route handler is problematic. Next.js `NextRequest` does not support body cloning natively.
**Impact:** Covered in C4.

### M14. `ADMIN_RECENT_WORDS` Has `undefined` in Emojis Array
**File:** `src/features/app/mini-app.tsx:227`
**Issue:** `{ name: 'Glass', emojis: ['🪟', undefined], ... }` — the second emoji is explicitly `undefined`. While `renderEmojis` filters this out, it's a type violation since `emojis` is typed as `[string, string?]` and `undefined` is technically allowed, but it's sloppy data.
**Impact:** Minor — cosmetic only.

### M15. `tasks/route.ts` GET Has Redundant `agentType` Declaration
**File:** `src/app/api/tasks/route.ts:23` and `src/app/api/tasks/route.ts:35`
**Issue:** Same as C1 — listed again for completeness since it's both a compilation error and a logic issue.

### M16. `mini-app.tsx` `inventoryNamesRef` Not Updated When Items Are Removed
**File:** `src/features/app/mini-app.tsx:297-299`
**Issue:** `inventoryNamesRef` is initialized with `INITIAL_INVENTORY` names and updated when new items are added, but there's no mechanism to remove names from the ref if items are ever removed from inventory. If a "remove item" feature is added later, the ref will cause false-positive duplicate detection.
**Impact:** Future-proofing issue; not currently a bug since there's no remove feature.

### M17. `discovery-feed.ts` `mintedKeys` Uses `username` Instead of `agentId`
**File:** `src/features/app/discovery-feed.ts:38-41`
**Issue:** The minted key is constructed as `${username}:${itemName}`, but usernames can change and are not unique. Two different users with the same username would incorrectly share minted status. Should use `agentId` instead.
**Impact:** Incorrect minted status detection in the discovery feed.

### M18. `kv-store.ts` Database and Memory Store Can Diverge
**File:** `src/server/kv-store.ts:42-65`
**Issue:** `readJson` checks database first, then falls back to memory store. `writeJson` writes to database and deletes from memory, or writes to memory if database fails. If a write to database succeeds but the process crashes before the memory delete, or if database becomes unavailable after being available, the two stores can diverge.
**Impact:** Data inconsistency between database and in-memory fallback.

### M19. `middleware.ts` `/api/mint` Is in `X402_PROTECTED_ROUTES` But Not in `config.matcher`
**File:** `src/middleware.ts:58-69` and `src/middleware.ts:96-97`
**Issue:** The comment on line 95 says `/api/mint` is excluded from the matcher to support whitelisted free minting. However, the route is still defined in `X402_PROTECTED_ROUTES`. This is intentional but confusing — the route definition is dead code since the matcher never triggers it.
**Impact:** Confusing code; not a functional bug.

### M20. `game-state.ts` `pushActivity` Writes to Both V1 and V2 Stores Without Transaction
**File:** `src/server/game-state.ts:349-356`
**Issue:** `pushActivity` writes to both V1 and V2 activity stores sequentially. If the first write succeeds and the second fails, the stores are inconsistent. There's no transaction or rollback mechanism.
**Impact:** Potential data inconsistency between activity store versions.

---

## LOW (P3 — Code Quality, Style, Minor Improvements)

### L1. `mini-app.tsx` Is 1023 Lines — Should Be Split
**File:** `src/features/app/mini-app.tsx`
**Issue:** The main game component is over 1000 lines. The AGENTS.md itself recommends splitting it into feature modules.
**Impact:** Maintainability issue.

### L2. Unused Imports in Multiple Files
- `src/features/app/crafting-engine.ts:14` — `AgentID` imported but never used
- `src/features/app/crafting-engine.ts:15` — `Address` re-exported but likely unused
- `src/lib/x402/index.ts:20` — `AgentID` imported but never used
- `src/lib/x402/config.ts:15` — `AgentID` imported but never used
**Impact:** Bundle size; lint warnings.

### L3. `semantic-crafting.ts.bak` Should Be Removed
**File:** `src/features/app/semantic-crafting.ts.bak`
**Issue:** Backup file checked into source control.
**Impact:** Repo clutter.

### L4. `private-config.ts` Has Hardcoded CoinGecko API Key
**File:** `src/config/private-config.ts:15`
**Issue:** A demo CoinGecko key is hardcoded as a fallback. API keys should never be in source code, even demo keys.
**Impact:** Security risk if the demo key has any associated quota/costs.

### L5. `rate-limiter.ts` Never Cleans Up Expired Entries
**File:** `src/lib/auth/rate-limiter.ts:1-25`
**Issue:** The `requestCounts` Map grows unbounded. Expired entries are never removed. Similar to the nonce issue (C5).
**Impact:** Memory leak over time.

### L6. `agents.ts` `verifySolanaSignature` Is a No-Op
**File:** `src/lib/auth/agents.ts:219-232`
**Issue:** Always returns `{ valid: true }` without any actual verification. Any Solana agent can authenticate with any signature.
**Impact:** Complete security bypass for Solana agents.

### L7. `agents.ts` `generateChallengeMessage` and `cleanupSignatureCache` Are Exported But Never Used
**File:** `src/lib/auth/agents.ts:303-328`
**Issue:** Dead exported functions.
**Impact:** Dead code.

### L8. `mini-app-tabs.tsx` `LeaderboardTab` Uses Array Index as Key for Discoveries
**File:** `src/features/app/mini-app-tabs.tsx:471`
**Issue:** `key={index}` for discovery feed items. If the feed changes, React may incorrectly reuse DOM elements.
**Impact:** Potential rendering glitches when feed updates.

### L9. `game-state.ts` `strHash` Is Duplicated in `crafting-engine.ts`
**File:** `src/server/game-state.ts:206-213` and `src/features/app/crafting-engine.ts:32-38`
**Issue:** Same hash function defined in two places.
**Impact:** Maintenance burden.

### L10. `db/client.ts` Stub Connection Throws at Import Time
**File:** `src/db/client.ts:38-46`
**Issue:** When `DATABASE_URL` is not set, `db` and `connection` are set to functions that throw. However, the `kv-store.ts` checks `process.env.DATABASE_URL` before calling `db`, so the throw is never triggered. The stub is dead code but confusing.
**Impact:** Confusing code structure.

---

## SUMMARY

| Severity | Count | Key Themes |
|----------|-------|------------|
| **CRITICAL (P0)** | 5 | Auth broken, body consumed, compilation errors, wrong viem API |
| **HIGH (P1)** | 15 | Client-server mismatch, tier logic broken, category type mismatch, chain support incomplete |
| **MEDIUM (P2)** | 20 | Missing auth headers, hardcoded values, memory leaks, data inconsistency |
| **LOW (P3)** | 10 | Code quality, dead code, unused imports, file size |
| **TOTAL** | **50** | |

### Top 5 Issues to Fix First:
1. **C4** — Request body consumed by middleware (blocks all POST routes)
2. **C2** — `verifyMessage` should be `recoverMessageAddress` (breaks all EVM auth)
3. **C1** — Duplicate `agentType` declaration (breaks build)
4. **H1** — Client doesn't send auth headers (all client POSTs fail)
5. **H14** — LEGENDARY tier unreachable (core game mechanic broken)
