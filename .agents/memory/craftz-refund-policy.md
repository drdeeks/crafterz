---
name: Craftz refund policy
description: CrafterZ energy must be refunded on failed crafts — strict no-hole policy
---
# Craftz Energy Refund Policy

## The Rule
In use-crafting.ts, if crafted === null (no recipe found), refund the full CRAFTZ_COST:
```typescript
setCraftz((c) => { const next = Math.min(CRAFTZ_MAX, c + CRAFTZ_COST); craftzRef.current = next; return next; });
```

## Why
User reported energy was consumed even on failed combinations. Enforced as a strict policy even for theoretically unreachable paths.

## How to apply
Any branch that exits the craft async block without producing a crafted item must refund. The if (!crafted) branch in the onUp handler in use-crafting.ts.
