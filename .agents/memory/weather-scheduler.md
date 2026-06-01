---
name: Weather scheduler pattern
description: How the CrafterZ weather system schedules events without a background process
---
# Deterministic Time-Based Weather

## Pattern
```typescript
const WINDOW_MS = 90 * 60 * 1000;
const windowIndex = Math.floor(Date.now() / WINDOW_MS);
if (windowIndex % 4 === 3) return null; // calm period
const eventType = WEATHER_EVENT_TYPES[windowIndex % WEATHER_EVENT_TYPES.length];
```

## Why
No scheduler process needed. Every call to /api/weather/current computes the current event from the clock. Frontend polls every 60s with a local countdown tick.

## How to apply
All weather-sensitive logic should call getCurrentWeatherEvent() from lib/weather-state.ts at request time. Never cache weather state server-side.
