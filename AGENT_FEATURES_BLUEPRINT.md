# CrafterZ Agent-Driven Features — Enterprise Blueprint

**Version:** 1.0 | **Date:** 2026-06-01 | **Classification:** Internal Engineering

---

## 0. Executive Summary

This document is the authoritative implementation reference for four agent-driven features proposed for the CrafterZ Farcaster mini-app. It covers system architecture, phased rollout, DB schema, API contracts, security requirements, failure modes, and rollback procedures — providing everything an engineering team needs to deliver these features to production in a compliant, observable, and reversible manner.

The four features are:

| # | Feature | Core Mechanic |
|---|---------|---------------|
| 1 | **MegaMind Heists & Rivalry** | PvP "craft-off" duels that let players challenge MegaMind owners |
| 2 | **Brain Rental Marketplace** | Rentable AI agents that grant temporary gameplay buffs |
| 3 | **Dynamic Celestial Weather System** | Server-driven time-limited events that mutate crafting outcomes |
| 4 | **AI-Curated Comedy Feed** | LLM-generated satirical captions attached to every item discovery |

Each feature is designed as an **autonomous micro-service** — independently deployable, observable, and disableable via feature flags without touching core crafting logic.

---

## 1. Guiding Principles

### 1.1 Architecture Mandates

- **Hooks, not hacks.** All new features extend the crafting engine through well-defined event hooks (`onCraft`, `onDiscovery`, `onEventTrigger`). No direct mutation of core game-state from feature code.
- **Feature flags first.** Every feature has a server-side boolean kill-switch stored in the `feature_flags` KV table. Flipping the flag instantly enables or disables the feature with zero redeploy.
- **Fail open or fail safe, never fail silently.** When an agent feature fails (AI API down, DB timeout, payment rejected), the system must: (a) log the error with full context, (b) return to a defined safe state, and (c) surface a user-visible fallback — never produce misleading output or silent data loss.
- **Micro-service isolation.** Each feature runs in its own process/lambda that reads from and writes to the main DB through typed API contracts. A crash in the Weather Service does not crash the Heist Service.
- **Idempotency.** All state-mutating operations (heist resolution, rental activation, weather transition, caption generation) must be idempotent so safe retries are possible.

### 1.2 Non-Negotiables

- All on-chain interactions require an explicit user wallet-confirmation step — no invisible transactions.
- All AI-generated content must pass a content moderation filter before being stored or displayed.
- No feature may read or write another feature's private tables directly — cross-feature communication uses shared game events or the public API layer.
- Every new DB migration ships with a down-migration and a rollback runbook.
- Unit and integration tests must exist before a feature enters beta.

---

## 2. Feature 1 — MegaMind Heists & Rivalry System

### 2.1 Concept

A challenger can initiate a "heist" against a player who holds a MegaMind item. Both sides submit crafted items in a blind craft-off; a resolver evaluates the results and, on the challenger's win, the defender temporarily loses their MegaMind status while the challenger earns bonus points and a Rivalry token.

### 2.2 User Flow

```
Challenger taps "⚔ Heist" on a MegaMind item
  → Heist invitation created (status: PENDING, expires 24h)
  → Defender notified via Farcaster frame notification
Defender accepts
  → Both enter sealed crafting phase (both craft blindly, 60s timer)
  → Results submitted to resolver
Resolver evaluates:
  - Tier points  (LEGENDARY=15, RARE=5, COMMON=2)
  - Generation bonus (lower generation wins ties)
  - MegaMind bonus applied if either side holds one
  → Winner determined; on-chain resolution event emitted
Defender loses: MegaMind status suspended 24h, challenger gains Rivalry token
Challenger loses: entry fee forfeited, defender earns Defender bonus
```

### 2.3 DB Schema

```sql
-- Heist events
CREATE TABLE heists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_fid BIGINT NOT NULL,
  defender_fid   BIGINT NOT NULL,
  target_item_id TEXT NOT NULL,          -- item being heisted
  status         TEXT NOT NULL CHECK (status IN ('PENDING','ACTIVE','RESOLVED','EXPIRED','CANCELLED')),
  entry_fee_craftz INT NOT NULL DEFAULT 50,
  challenger_item_id TEXT,               -- submitted crafted item
  defender_item_id   TEXT,
  winner_fid     BIGINT,
  resolution_tx  TEXT,                   -- on-chain tx hash if applicable
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at    TIMESTAMPTZ
);

-- Rivalry tokens (earned by winning a heist)
CREATE TABLE rivalry_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_fid  BIGINT NOT NULL,
  heist_id   UUID REFERENCES heists(id),
  item_name  TEXT NOT NULL,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Heist suspension log (tracks MegaMind suspensions)
CREATE TABLE megamind_suspensions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid             BIGINT NOT NULL,
  item_id         TEXT NOT NULL,
  suspended_by    UUID REFERENCES heists(id),
  suspended_until TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX heists_challenger_fid_idx ON heists(challenger_fid);
CREATE INDEX heists_defender_fid_idx ON heists(defender_fid);
CREATE INDEX heists_status_idx ON heists(status);
```

### 2.4 API Contracts

```
POST /api/heists/initiate
  Body: { challengerFid, defenderFid, targetItemId, entryFeeCraftz }
  Returns: { heistId, expiresAt }
  Errors: 409 (duplicate active heist), 402 (insufficient Craftz), 404 (item not found)

POST /api/heists/:heistId/accept
  Body: { fid }
  Returns: { heistId, status: 'ACTIVE', craftingDeadline }

POST /api/heists/:heistId/submit
  Body: { fid, craftedItemName, craftedItemTier, craftedItemGeneration }
  Returns: { submitted: true }

GET /api/heists/:heistId/status
  Returns: { status, winner, suspendedUntil?, rivalryTokenEarned? }

POST /api/heists/:heistId/cancel
  Body: { fid }
  Returns: { cancelled: true }
```

### 2.5 Resolution Algorithm

```typescript
function resolveHeist(challenger: HeistEntry, defender: HeistEntry): 'CHALLENGER' | 'DEFENDER' | 'TIE' {
  const tierScore = { LEGENDARY: 15, RARE: 5, COMMON: 2, GENESIS: 0 };
  const cScore = tierScore[challenger.tier] - challenger.generation * 0.1;
  const dScore = tierScore[defender.tier]   - defender.generation   * 0.1;

  if (cScore > dScore) return 'CHALLENGER';
  if (dScore > cScore) return 'DEFENDER';
  return 'TIE'; // entry fees returned; no MegaMind change
}
```

### 2.6 Security & Fairness

- **Sealed submission:** Both crafted items are stored encrypted (AES-256-GCM with a server-managed key) until both parties have submitted, preventing last-second gaming.
- **Timeout protection:** If either party fails to submit within 60s, they forfeit. The resolving cron runs every 30s to catch timeouts.
- **Rate limiting:** Maximum 3 active heists per player per day to prevent spam.
- **Entry fee escrow:** Craftz is debited from both parties on `ACTIVE` transition and held in escrow; returned to winner or split on `TIE` — never in a state where funds are charged without resolution.
- **Anti-collusion:** Players may not heist themselves or known alt accounts (FID pair rate-limiting).

### 2.7 Known Drawbacks & Mitigations

| Drawback | Mitigation |
|----------|-----------|
| Could feel exploitative to casual players | Entry fee floor of 50 Craftz creates meaningful stakes; onboarding tooltip explains stakes clearly |
| Asymmetric skill gap | Resolution uses item tier (skill-independent) not crafting speed alone |
| Network lag makes simultaneous reveal unfair | Server-side timestamp validation; 5s grace window |
| MegaMind suspension could feel punishing | Suspension is cosmetic only — player retains item in inventory |

---

## 3. Feature 2 — Brain Rental Marketplace

### 3.1 Concept

A "Job Board" of rentable AI agents (archetypes: Chronomancer, Pyromancer, Naturalist, etc.) that players hire for a fixed period in exchange for Craftz. While active, a rented agent applies a passive buff to the player's crafting results (tier boost chance, generation reduction, Craftz cost discount).

### 3.2 Agent Archetypes (v1)

| Agent | Buff | Base Cost | Duration |
|-------|------|-----------|----------|
| Chronomancer | -20% Craftz regen time (faster refill) | 150 Craftz | 4h |
| Pyromancer | +15% chance to upgrade COMMON→RARE | 200 Craftz | 4h |
| Naturalist | -1 to crafted item generation (lower = rarer) | 250 Craftz | 4h |
| Archivist | +25 pts bonus on every MegaMind discovery | 300 Craftz | 8h |
| Trickster | 10% chance to double Craftz reward on task claim | 100 Craftz | 2h |

### 3.3 DB Schema

```sql
-- Agent definitions (seeded, admin-managed)
CREATE TABLE agents (
  id          TEXT PRIMARY KEY,      -- e.g. 'chronomancer'
  name        TEXT NOT NULL,
  description TEXT,
  portrait    TEXT,                  -- emoji or asset URL
  buff_type   TEXT NOT NULL,         -- 'craftz_regen' | 'tier_boost' | 'gen_reduce' | 'pts_bonus' | 'reward_double'
  buff_value  NUMERIC NOT NULL,
  base_cost_craftz INT NOT NULL,
  duration_ms BIGINT NOT NULL,
  available   BOOLEAN NOT NULL DEFAULT TRUE
);

-- Active rentals
CREATE TABLE agent_rentals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid          BIGINT NOT NULL,
  agent_id     TEXT REFERENCES agents(id),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  cost_paid    INT NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  terminated_early_at TIMESTAMPTZ
);

CREATE INDEX agent_rentals_fid_active_idx ON agent_rentals(fid, is_active) WHERE is_active = TRUE;
CREATE INDEX agent_rentals_expires_idx    ON agent_rentals(expires_at) WHERE is_active = TRUE;
```

### 3.4 API Contracts

```
GET /api/agents
  Returns: Agent[] — available agents with current rental status for requesting user

POST /api/agents/:agentId/rent
  Body: { fid }
  Returns: { rentalId, agentId, expiresAt, buffApplied }
  Errors: 402 (insufficient Craftz), 409 (already renting same agent), 503 (feature disabled)

GET /api/agents/active
  Query: { fid }
  Returns: ActiveRental[] — current active rentals and their buff snapshots

POST /api/agents/rentals/:rentalId/terminate
  Body: { fid }
  Returns: { terminated: true } — no Craftz refund on early termination
```

### 3.5 Buff Application Architecture

Buffs are resolved server-side at craft-time, not stored on the client. The crafting engine calls `applyAgentBuffs(fid)` before computing the final item result:

```typescript
async function applyAgentBuffs(fid: number): Promise<BuffSet> {
  const active = await db.select().from(agentRentals)
    .where(and(eq(agentRentals.fid, fid), eq(agentRentals.isActive, true), gt(agentRentals.expiresAt, new Date())));

  return active.reduce<BuffSet>((acc, rental) => {
    const agent = AGENT_DEFINITIONS[rental.agentId];
    if (!agent) return acc;
    switch (agent.buffType) {
      case 'tier_boost':    acc.tierBoostChance += agent.buffValue; break;
      case 'gen_reduce':    acc.genReduction    += agent.buffValue; break;
      case 'pts_bonus':     acc.megaMindPtsBonus+= agent.buffValue; break;
      case 'reward_double': acc.rewardDoubleChance += agent.buffValue; break;
    }
    return acc;
  }, { tierBoostChance: 0, genReduction: 0, megaMindPtsBonus: 0, rewardDoubleChance: 0 });
}
```

A cron job runs every 5 minutes to expire rentals and send low-time notifications.

### 3.6 Security

- Craftz deduction and rental record creation must be **atomic** (single DB transaction). A charge without a rental record is never acceptable.
- Buffs are validated server-side on every craft — client cannot fake an active buff by modifying local state.
- An agent can only be rented once simultaneously per player. The `agent_rentals` unique index prevents duplicate charges.
- Maximum stacked buff value per category capped server-side (e.g. `tierBoostChance` max 50%) to prevent exploit stacking.

### 3.7 Known Drawbacks & Mitigations

| Drawback | Mitigation |
|----------|-----------|
| Pay-to-win perception | All agents provide small boosts; MegaMind discovery still requires skill/luck |
| Rental expiry confusing to users | Countdown timer on UI; push notification at 30m remaining |
| Agent availability can feel gatekept | All agents always available (no artificial scarcity) — only Craftz gates access |
| Economy drain if Craftz too easy to farm | Economic dashboard tracks Craftz sink/source ratio; tunable via admin panel |

---

## 4. Feature 3 — Dynamic Celestial Weather System

### 4.1 Concept

A server-controlled event scheduler publishes time-limited "weather events" (Sun Flare, Time Storm, Lunar Eclipse, etc.) that temporarily modify craft outcome probabilities globally or per-region. Events are announced to all connected players via a live widget in the UI header.

### 4.2 Weather Event Catalog (v1)

| Event | Duration | Effect | Visual Cue |
|-------|----------|--------|-----------|
| Sun Flare | 1h | +20% fire-element item rarity | Red header glow |
| Lunar Eclipse | 45m | +25% chance to craft LEGENDARY | Dark purple tint |
| Time Storm | 30m | All craft costs halved | Teal lightning pulse |
| Meteor Shower | 2h | +30% MegaMind bonus points | Amber particle effect |
| Void Drift | 1h | -10% all craft results (debuff, rare) | Dark grey desaturation |
| Golden Hour | 90m | Double Craftz regen rate | Golden shimmer |

### 4.3 DB Schema

```sql
-- Weather event definitions (admin-seeded)
CREATE TABLE weather_event_types (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  icon          TEXT,
  duration_ms   BIGINT NOT NULL,
  effect_type   TEXT NOT NULL,    -- 'rarity_boost' | 'legendary_boost' | 'cost_reduce' | 'pts_boost' | 'craftz_regen' | 'rarity_debuff'
  effect_value  NUMERIC NOT NULL,
  element_filter TEXT,            -- NULL = global; 'fire','water',etc = element-specific
  color_hint    TEXT              -- hex for UI tint
);

-- Active and historical weather events
CREATE TABLE weather_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id TEXT REFERENCES weather_event_types(id),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at       TIMESTAMPTZ NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  triggered_by  TEXT NOT NULL DEFAULT 'scheduler', -- 'scheduler' | 'admin'
  metadata      JSONB                               -- arbitrary extra data
);

CREATE INDEX weather_events_active_idx ON weather_events(is_active) WHERE is_active = TRUE;
```

### 4.4 API Contracts

```
GET /api/weather/current
  Returns: { event: WeatherEvent | null, secondsRemaining: number }
  Cache-Control: max-age=30

GET /api/weather/upcoming
  Returns: WeatherEvent[] — next 3 scheduled events with ETAs

POST /api/weather/trigger (admin only)
  Body: { eventTypeId, durationOverrideMs? }
  Returns: { eventId, endsAt }
  Auth: requires admin FID header

DELETE /api/weather/events/:eventId (admin only)
  Returns: { cancelled: true }
```

### 4.5 Scheduler Architecture

The Weather Scheduler runs as a separate Express worker (or cron lambda) on a 60s tick:

```typescript
async function weatherSchedulerTick() {
  // 1. Expire stale active events
  await db.update(weatherEvents)
    .set({ isActive: false })
    .where(and(eq(weatherEvents.isActive, true), lt(weatherEvents.endsAt, new Date())));

  // 2. Check if a new event should start (none currently active)
  const active = await db.select().from(weatherEvents).where(eq(weatherEvents.isActive, true)).limit(1);
  if (active.length > 0) return;

  // 3. Select next event from weighted pool
  const nextType = pickWeightedRandom(WEATHER_EVENT_WEIGHTS);
  const endsAt = new Date(Date.now() + nextType.durationMs);

  await db.insert(weatherEvents).values({ eventTypeId: nextType.id, endsAt, isActive: true });

  // 4. Notify connected clients via SSE broadcast or Farcaster notification
  await broadcastWeatherChange(nextType);
}
```

The effect is applied in the crafting engine by calling `getActiveWeatherBuffs()` before resolving each craft — identical pattern to agent buffs.

### 4.6 Frontend Integration

The `AppHeader` component polls `GET /api/weather/current` every 30 seconds. When an event is active, a weather widget appears in the header showing: icon, name, countdown timer, and a tooltip describing the effect. Background tint is applied via a CSS custom property (`--weather-tint`) set on the root layout element.

### 4.7 Security & Stability

- Only one weather event may be active at a time — the scheduler enforces this with an application-level lock (Redis Redlock or a DB advisory lock).
- Admin-triggered events override the scheduler and are logged with the admin's FID.
- Debuff events (Void Drift) are capped at 10% reduction and may never produce a negative item result — minimum output is always COMMON.
- Weather effects are read-only to the crafting engine; no weather event may create, delete, or modify inventory or player records directly.
- **Kill switch:** Setting `feature_flags.weather_system = false` immediately disables all weather effects and resets `CurrentWeather` to null within one scheduler tick.

### 4.8 Rollback Plan

If a weather event causes a fatal bug:
1. `DELETE /api/weather/events/:eventId` (admin endpoint) — stops the event immediately.
2. Set `feature_flags.weather_system = false` in the KV store — disables all future events.
3. Verify crafting outcomes return to baseline via the integration test suite.
4. Push a hotfix; re-enable feature flag post-fix.
5. Review DB advisory lock logs to confirm the event-selection race was not the root cause.

### 4.9 Known Drawbacks & Mitigations

| Drawback | Mitigation |
|----------|-----------|
| Frequent players have more exposure to boosts | All events are globally broadcast; fairness is equal for all online players |
| Debuff events (Void Drift) may feel punishing | Debuffs are rare (<10% of events), short (≤1h), and flagged visually with clear warnings |
| Scheduler clock drift on server restarts | Persist `lastTickAt` to DB; on boot, apply the deficit ticks before normal schedule resumes |
| Events may conflict with heist or rental buffs | Buff stack is additive — all buffs sum up, capped per-category to prevent exploits |

---

## 5. Feature 4 — AI-Curated Comedy Feed

### 5.1 Concept

Every item discovery event is enriched with an AI-generated satirical caption in the style of a zany tabloid or pulp-fiction newsletter. Captions run through a moderation pipeline before publication. Players can "Ha-ha" react to or report posts.

### 5.2 Caption Generation Pipeline

```
Item crafted → onDiscovery event fired
  → CaptionWorker picks up event from queue
  → Builds prompt using item name, tier, discoverer username, and lore context
  → Calls LLM API (OpenAI/Anthropic via Replit AI integration)
  → Output sent through ContentModerationFilter
      → PASS: store caption, mark as published
      → FAIL: log rejection reason, store safe fallback caption
  → Published caption available on next feed refresh (≤5s)
```

### 5.3 DB Schema

```sql
-- Discovery captions
CREATE TABLE discovery_captions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  craft_event_id  UUID NOT NULL,             -- references craft_events
  item_name       TEXT NOT NULL,
  discoverer_fid  BIGINT NOT NULL,
  caption_text    TEXT NOT NULL,
  is_ai_generated BOOLEAN NOT NULL DEFAULT TRUE,
  moderation_passed BOOLEAN NOT NULL,
  moderation_flags TEXT[],                   -- e.g. ['profanity', 'off_brand']
  ha_ha_count     INT NOT NULL DEFAULT 0,
  reported_count  INT NOT NULL DEFAULT 0,
  is_suppressed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reaction events (ha-ha)
CREATE TABLE caption_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caption_id UUID REFERENCES discovery_captions(id),
  fid        BIGINT NOT NULL,
  reacted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(caption_id, fid)
);

-- Report queue
CREATE TABLE caption_reports (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caption_id UUID REFERENCES discovery_captions(id),
  reporter_fid BIGINT NOT NULL,
  reason     TEXT,
  resolved   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX discovery_captions_craft_event_idx ON discovery_captions(craft_event_id);
CREATE INDEX caption_reports_unresolved_idx ON caption_reports(resolved) WHERE resolved = FALSE;
```

### 5.4 LLM Prompt Template

```
System:
You are the editorial voice of "The Crafterz Gazette" — a zany tabloid covering the alchemy world.
Your captions are punchy (max 2 sentences), playful, and G-rated.
Never mention real people, politics, religion, or use slurs.
Reference the item and discoverer only. Tone: excited tabloid, not stand-up comedy.

User:
Write a caption for this discovery:
- Discoverer: {{username}}
- Item: {{itemName}} ({{tier}} tier)
- Recipe: {{ingredientA}} + {{ingredientB}}
- Context: {{optionalWeatherEvent}}

Respond with ONLY the caption text. No quotes. No commentary.
```

### 5.5 Content Moderation Filter

```typescript
async function moderateCaption(text: string): Promise<ModerationResult> {
  // Layer 1: Static profanity/slur blocklist (fast, synchronous)
  if (containsBlocklistedTerm(text, BLOCKLIST)) {
    return { passed: false, flags: ['profanity'] };
  }

  // Layer 2: Regex heuristics for off-brand patterns
  if (OFF_BRAND_PATTERNS.some((p) => p.test(text))) {
    return { passed: false, flags: ['off_brand'] };
  }

  // Layer 3: AI moderation endpoint (OpenAI Moderation or Anthropic equivalent)
  const result = await callModerationAPI(text);
  if (result.flagged) {
    return { passed: false, flags: result.categories };
  }

  return { passed: true, flags: [] };
}
```

If all layers pass, the caption is published. If any layer fails, a safe fallback is used:
`"{{username}} just discovered {{itemName}}! The Gazette's fact-checkers are still recovering from the shock."`

### 5.6 Human Oversight Workflow

- Captions with `reported_count >= 3` are automatically suppressed (soft-deleted from feed) and added to the human review queue.
- Admins access the review queue via the Admin tab → "Content Moderation" panel.
- Reviewed and cleared captions are unsuppressed. Confirmed violations are hard-deleted and the generation rule that produced them is added to the blocklist.
- A weekly "Joke of the Week" award is surfaced by sorting on `ha_ha_count DESC` over the past 7 days.

### 5.7 Security & Compliance

- The LLM API key is stored exclusively as a Replit environment secret (`AI_API_KEY`) — never in source code or the DB.
- All prompts are parameterised — no user-supplied text is injected raw into the system prompt (item names and usernames are interpolated into the user section only, with a max-length guard of 64 chars each).
- Regional humor localization is deferred to v2; in v1, all captions are in English only.
- A **global kill switch** (`feature_flags.comedy_feed = false`) disables caption generation; existing captions remain visible but new ones are replaced by the safe fallback immediately.

### 5.8 AI Best Practices

| Practice | Implementation |
|----------|---------------|
| AI + human in the loop | AI generates, moderation filter screens, humans review flagged items |
| Cultural sensitivity | Strict prompt banning cultural/religious references; reviewed manually on edge cases |
| Content sandboxing | New prompt templates are A/B tested on a 5% audience before full rollout |
| Abuse prevention | Per-discoverer caption rate limit (max 1 caption per 30s) to prevent prompt injection via rapid crafting |
| Tone management | System prompt enforces tabloid voice; temperature set to 0.7 for creativity without chaos |

### 5.9 Known Drawbacks & Mitigations

| Drawback | Mitigation |
|----------|-----------|
| AI humor may miss cultural context | Strict prompt guardrails + human review for flagged posts |
| Increased API cost at scale | Captions generated async, rate-limited; batching considered for high-volume periods |
| Captions could become repetitive over time | Prompt includes recent item history to encourage variety; templates rotated quarterly |
| Humor may distract from gameplay | Comedy feed is a secondary panel — core inventory and crafting remain the primary UI |

---

## 6. Phased Rollout Plan

### Phase 1 — Foundations (Weeks 1–3)

**Goal:** All infrastructure in place; no user-visible features yet.

- [ ] Define and seed `feature_flags` KV entries for all four features (all `false`)
- [ ] Add DB tables for heists, agents, agent_rentals, weather_event_types, weather_events, discovery_captions, caption_reactions, caption_reports
- [ ] Write and validate all down-migrations
- [ ] Create `onCraft` and `onDiscovery` event hook system in the crafting engine
- [ ] Implement `getActiveWeatherBuffs()` and `applyAgentBuffs()` helpers in the API server
- [ ] Unit tests for resolution algorithm, buff stacking, and moderation filter
- [ ] Code review for all on-chain-adjacent code paths

**Exit criteria:** All migrations applied to dev and staging without error. Unit test coverage >80% on new code. Zero regressions in existing craft/leaderboard/task tests.

### Phase 2 — Feature Prototypes (Weeks 4–7)

**Goal:** Each feature works end-to-end in a dev environment between two test accounts.

- [ ] Heist prototype: initiate → accept → craft → resolve flow working between two dev FIDs
- [ ] Rental prototype: rent Chronomancer, verify buff applied to next 5 crafts
- [ ] Weather prototype: admin-trigger "Meteor Shower", verify points multiplier applied
- [ ] Comedy prototype: craft an item, verify caption generated, moderation filter active
- [ ] Internal playtest session with engineering and PM team
- [ ] Gather balance feedback; adjust entry fees, buff values, weather durations

**Exit criteria:** All four features togglable via feature flags. Internal playtest sign-off. No P0 bugs.

### Phase 3 — Closed Beta (Weeks 8–11)

**Goal:** 5% of real users on each feature; full monitoring active.

- [ ] Deploy to production with feature flags at 5% (user FID modulo 20)
- [ ] Set up dashboards: heist attempt rate, rental revenue, weather event coverage, caption flag rate
- [ ] Run security audit on payment flows (agent rental Craftz deduction, heist escrow)
- [ ] Accessibility review of new UI components (weather widget, comedy feed)
- [ ] Edge-case testing: rental expiry mid-craft, heist initiated by offline player, weather during MegaMind mint
- [ ] Collect player feedback via in-app survey and Farcaster cast

**Exit criteria:** No P0/P1 bugs for 7 consecutive days. Caption flag rate <0.5%. Heist resolution always deterministic. Rental charge always matches rental record.

### Phase 4 — Full Launch & Live Ops (Week 12+)

**Goal:** All features live for 100% of users.

- [ ] Flip all feature flags to `true` globally
- [ ] Run in-app launch announcement (Farcaster notification to all users)
- [ ] Launch event: "MegaMind Derby Week" — double Rivalry token rewards for 7 days
- [ ] Establish a live-ops calendar: new weather events monthly, new agents quarterly, new caption templates weekly
- [ ] Set up on-call rotation for comedy feed moderation review queue
- [ ] Post-launch retro at Day 30 to review economy balance and engagement metrics

---

## 7. Observability & Monitoring

### Key Metrics per Feature

| Feature | Metric | Alert Threshold |
|---------|--------|----------------|
| Heists | Heist initiation rate / hour | <5 or >500 → investigate |
| Heists | Resolution accuracy (winner agrees with replay) | <100% → P0 |
| Rentals | Craftz sink rate (rentals per hour) | >10% economy deviation → review |
| Rentals | Orphaned charges (charge without rental record) | Any → P0 |
| Weather | Scheduler tick latency | >90s → alert |
| Weather | Events with no effect applied | >0 → P1 |
| Comedy | Caption generation latency (p95) | >3s → review AI integration |
| Comedy | Moderation pass rate | <90% → review prompt or blocklist |
| Comedy | Report rate per 1000 captions | >5 → escalate to human review |

### Logging Standards

All new services must log with structured JSON:

```json
{
  "timestamp": "2026-06-01T12:00:00Z",
  "level": "info",
  "service": "heist-resolver",
  "heistId": "uuid",
  "event": "heist_resolved",
  "winner": "challenger",
  "challengerScore": 14.9,
  "defenderScore": 5.0,
  "durationMs": 62340
}
```

Error logs must include full context: `heistId`, `fid`, `errorCode`, `stackTrace`, `retryCount`.

---

## 8. Security Summary

| Control | Scope | Enforcement |
|---------|-------|------------|
| Feature flags | All four features | Server-side KV; checked on every request |
| Wallet confirmation | All on-chain actions | Client-enforced UX; server rejects unsigned payloads |
| Sealed submissions | Heist craft-off | AES-256-GCM at rest until both parties submit |
| Atomic Craftz debit | Rental, heist entry fee | DB transaction; rollback on any step failure |
| LLM prompt injection guard | Comedy feed | Max-length, param interpolation, no raw user input in system prompt |
| Content moderation | Comedy feed | 3-layer filter (blocklist → regex → AI moderation API) |
| Rate limits | All features | Per-FID, per-endpoint; enforced in Express middleware |
| Buff cap | Rentals, weather | Server-side max per buff category (e.g., tier_boost ≤50%) |
| Admin auth | Admin endpoints | Requires valid admin FID header, validated against ADMIN_FIDS env var |

---

## 9. Rollback Runbooks

### Emergency Rollback: Any Feature

1. Set `feature_flags.<feature_name> = false` via admin API or KV direct write.
2. Verify affected endpoints return 200 with feature-disabled state (not 500).
3. Check error logs for residual failures from in-flight requests.
4. If DB corruption is suspected, run the relevant down-migration and restore from last backup.
5. Post incident summary to engineering channel within 1 hour.

### Full System Rollback: Multi-Feature Incident

1. Disable all four feature flags immediately.
2. Roll back to the last stable Docker/deployment image.
3. Apply down-migrations in reverse order: comedy → weather → rentals → heists.
4. Restore DB backup from snapshot preceding the release.
5. Validate via the integration test suite against the restored DB.
6. Schedule post-mortem within 48 hours.

---

## 10. Definition of Done

A feature is considered **production-ready** when all of the following are true:

- [ ] Feature flag implemented and tested (enable/disable round-trip)
- [ ] DB migration with down-migration committed and reviewed
- [ ] API contract documented (request/response schema + error codes)
- [ ] Unit test coverage ≥80% on new service code
- [ ] Integration test covers the happy path and at least 3 failure scenarios
- [ ] Security review signed off (payment flows audited by a second engineer)
- [ ] AI prompt/content reviewed by a PM for tone and compliance
- [ ] Monitoring dashboards created and alert thresholds set
- [ ] Rollback runbook written and tested on staging
- [ ] Accessibility check on all new UI components (WCAG 2.1 AA)
- [ ] Closed beta run for ≥7 days without P0/P1 incidents
- [ ] Legal review of any on-chain token mechanics

---

*This document is maintained by the CrafterZ engineering team. All changes must be reviewed by the tech lead and PM before merging. Next review date: 2026-09-01.*
