export type WeatherEffectType =
  | "tier_boost"
  | "legendary_boost"
  | "cost_reduce"
  | "pts_boost"
  | "craftz_regen"
  | "rarity_debuff";

export interface WeatherEventType {
  id: string;
  name: string;
  icon: string;
  description: string;
  effectType: WeatherEffectType;
  effectValue: number;
  colorHint: string;
  durationWindowMs: number;
}

export const WEATHER_EVENT_TYPES: WeatherEventType[] = [
  {
    id: "sun_flare",
    name: "Sun Flare",
    icon: "☀️",
    description: "+20% fire-element item rarity",
    effectType: "tier_boost",
    effectValue: 0.20,
    colorHint: "#ef4444",
    durationWindowMs: 60 * 60 * 1000,
  },
  {
    id: "lunar_eclipse",
    name: "Lunar Eclipse",
    icon: "🌑",
    description: "+25% chance to craft LEGENDARY",
    effectType: "legendary_boost",
    effectValue: 0.25,
    colorHint: "#7c3aed",
    durationWindowMs: 45 * 60 * 1000,
  },
  {
    id: "time_storm",
    name: "Time Storm",
    icon: "⚡",
    description: "All craft Craftz costs halved",
    effectType: "cost_reduce",
    effectValue: 0.50,
    colorHint: "#0891b2",
    durationWindowMs: 30 * 60 * 1000,
  },
  {
    id: "meteor_shower",
    name: "Meteor Shower",
    icon: "☄️",
    description: "+30% MegaMind bonus points",
    effectType: "pts_boost",
    effectValue: 0.30,
    colorHint: "#d97706",
    durationWindowMs: 120 * 60 * 1000,
  },
  {
    id: "golden_hour",
    name: "Golden Hour",
    icon: "✨",
    description: "Craftz regen rate doubled",
    effectType: "craftz_regen",
    effectValue: 2.0,
    colorHint: "#ca8a04",
    durationWindowMs: 90 * 60 * 1000,
  },
  {
    id: "void_drift",
    name: "Void Drift",
    icon: "🌫️",
    description: "-10% craft rarity (rare debuff event)",
    effectType: "rarity_debuff",
    effectValue: -0.10,
    colorHint: "#52525b",
    durationWindowMs: 60 * 60 * 1000,
  },
];

const WINDOW_MS = 90 * 60 * 1000;

export interface ActiveWeatherEvent {
  event: WeatherEventType;
  startedAt: number;
  endsAt: number;
  windowIndex: number;
}

export function getCurrentWeatherEvent(): ActiveWeatherEvent | null {
  const now = Date.now();
  const windowIndex = Math.floor(now / WINDOW_MS);
  // Every 4th window is a calm period (no event)
  if (windowIndex % 4 === 3) return null;

  const eventType = WEATHER_EVENT_TYPES[windowIndex % WEATHER_EVENT_TYPES.length];
  const windowStart = windowIndex * WINDOW_MS;
  const endsAt = windowStart + eventType.durationWindowMs;

  // If the event has already expired within this window, return null
  if (now > endsAt) return null;

  return {
    event: eventType,
    startedAt: windowStart,
    endsAt,
    windowIndex,
  };
}

export function getWeatherBuffs(): { tierBoost: number; legendaryBoost: number; costMultiplier: number; ptsBoost: number; regenMultiplier: number } {
  const buffs = { tierBoost: 0, legendaryBoost: 0, costMultiplier: 1.0, ptsBoost: 0, regenMultiplier: 1.0 };
  const active = getCurrentWeatherEvent();
  if (!active) return buffs;

  switch (active.event.effectType) {
    case "tier_boost":
      buffs.tierBoost = active.event.effectValue;
      break;
    case "legendary_boost":
      buffs.legendaryBoost = active.event.effectValue;
      break;
    case "cost_reduce":
      buffs.costMultiplier = 1.0 - active.event.effectValue;
      break;
    case "pts_boost":
      buffs.ptsBoost = active.event.effectValue;
      break;
    case "craftz_regen":
      buffs.regenMultiplier = active.event.effectValue;
      break;
    case "rarity_debuff":
      buffs.tierBoost = active.event.effectValue; // negative value = debuff
      break;
  }
  return buffs;
}
