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
