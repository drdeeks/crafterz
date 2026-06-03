import { Router } from "express";
import { getCurrentWeatherEvent, WEATHER_EVENT_TYPES } from "../lib/weather-state.js";
import { isEnabled } from "../lib/feature-flags.js";

const router = Router();

router.get("/weather/current", async (req, res) => {
  try {
    if (!(await isEnabled("weatherSystem"))) {
      return res.json({ ok: true, event: null, secondsRemaining: 0 });
    }

    const active = getCurrentWeatherEvent();
    if (!active) {
      return res.json({ ok: true, event: null, secondsRemaining: 0 });
    }

    const secondsRemaining = Math.max(0, Math.floor((active.endsAt - Date.now()) / 1000));
    res.json({ ok: true, event: active.event, secondsRemaining, endsAt: active.endsAt });
  } catch (err) {
    console.error("Weather current error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.get("/weather/history", async (_req, res) => {
  try {
    const history = [
      { id: 'wh1', eventType: 'frog_rain', name: 'Frog Rain', icon: '🐸', description: 'One random element substituted with Frog-type', effect: '+frog element discovery paths', durationMs: 7200000, startedAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(), endedAt: new Date(Date.now() - 3 * 24 * 3600000 + 7200000).toISOString() },
      { id: 'wh2', eventType: 'sun_flare', name: 'Solar Flare', icon: '🔥', description: '+40% legendary chance for fire/metal elements', effect: '+legendary chance fire/metal', durationMs: 7200000, startedAt: new Date(Date.now() - 6 * 24 * 3600000).toISOString(), endedAt: new Date(Date.now() - 6 * 24 * 3600000 + 7200000).toISOString() },
      { id: 'wh3', eventType: 'moon_crack', name: 'Moon Crack', icon: '🌙', description: 'Unlocks Lunar Recipe category', effect: '+lunar recipes unlocked', durationMs: 10800000, startedAt: new Date(Date.now() - 9 * 24 * 3600000).toISOString(), endedAt: new Date(Date.now() - 9 * 24 * 3600000 + 10800000).toISOString() },
      { id: 'wh4', eventType: 'time_storm', name: 'Time Storm', icon: '⚡', description: 'All recipe timers halved', effect: '-50% recipe timers', durationMs: 5400000, startedAt: new Date(Date.now() - 11 * 24 * 3600000).toISOString(), endedAt: new Date(Date.now() - 11 * 24 * 3600000 + 5400000).toISOString() },
    ];
    res.json({ ok: true, history });
  } catch (err) {
    console.error("Weather history error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.get("/weather/cosmic-age", async (_req, res) => {
  try {
    res.json({
      ok: true,
      age: {
        id: 'age_first',
        name: 'Age of First Things',
        trigger: 'World inception — no trigger condition required',
        startedAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
        endedAt: null,
        isActive: true,
        description: 'The first age. All discoveries are first discoveries. All events are first events. The frogs have not yet arrived.',
      },
    });
  } catch (err) {
    console.error("Cosmic age error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.get("/weather/upcoming", async (_req, res) => {
  try {
    const WINDOW_MS = 90 * 60 * 1000;
    const now = Date.now();
    const upcoming = [];

    for (let offset = 1; offset <= 6; offset++) {
      const windowIndex = Math.floor(now / WINDOW_MS) + offset;
      if (windowIndex % 4 === 3) continue; // calm window
      const eventType = WEATHER_EVENT_TYPES[windowIndex % WEATHER_EVENT_TYPES.length];
      const startsAt = windowIndex * WINDOW_MS;
      upcoming.push({ event: eventType, startsAt, endsAt: startsAt + eventType.durationWindowMs });
      if (upcoming.length >= 3) break;
    }

    res.json({ ok: true, upcoming });
  } catch (err) {
    console.error("Weather upcoming error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

export default router;
