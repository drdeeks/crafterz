// ============================================================================
// SEMANTIC CRAFTING ENGINE — Recursive with Generation Tracking
// ============================================================================
// Hybrid crafting: AI-powered when AI_API_KEY is set, deterministic fallback
// when it isn't. Supports infinite recursive crafting like Little Alchemy/
// Infinite Craft with generation tracking:
// - Genesis items = Generation 0
// - Crafted items = max(genA, genB) + 1
// - Server-validated MegaMind detection (first global discovery only)
// - Persistent emoji associations per item
// ============================================================================

export type ItemTier = "GENESIS" | "COMMON" | "RARE" | "LEGENDARY";

export interface CraftedItem {
  name: string;
  emojis: [string, string?];
  tier: ItemTier;
  isMegaMind: boolean; // true ONLY if first ever global discovery
  recipe: string; // "Fire + Water"
  generation: number; // 0 = genesis, 1 = first craft, etc.
}

export interface GenesisItem {
  id: string;
  name: string;
  emojis: [string, string?];
  tier: "GENESIS";
  category: string;
  generation: 0;
}

// ─── 7 Genesis Elements (Generation 0) ───────────────────────────────────────

export const GENESIS_ITEMS: GenesisItem[] = [
  { id: "water", name: "Water", emojis: ["💧"], tier: "GENESIS", category: "element", generation: 0 },
  { id: "fire",  name: "Fire",  emojis: ["🔥"], tier: "GENESIS", category: "element", generation: 0 },
  { id: "earth", name: "Earth", emojis: ["🌍"], tier: "GENESIS", category: "element", generation: 0 },
  { id: "air",   name: "Air",   emojis: ["💨"], tier: "GENESIS", category: "element", generation: 0 },
  { id: "sun",   name: "Sun",   emojis: ["☀️"], tier: "GENESIS", category: "celestial", generation: 0 },
  { id: "moon",  name: "Moon",  emojis: ["🌙"], tier: "GENESIS", category: "celestial", generation: 0 },
  { id: "time",  name: "Time",  emojis: ["⏰"], tier: "GENESIS", category: "abstract", generation: 0 },
];

// ─── Definitive Combination Registry (fallback when AI is unavailable) ────────
// Only covers genesis + genesis combinations. AI handles everything else.

const CRAFT_RECIPES: Record<string, Omit<CraftedItem, "isMegaMind" | "generation">> = {
  // Element + Element
  "air+earth":  { name: "Dust",     emojis: ["🌫️", "🏜️"],  tier: "COMMON",    recipe: "Air + Earth" },
  "air+fire":   { name: "Plasma",   emojis: ["⚡", "🔥"],   tier: "RARE",      recipe: "Air + Fire" },
  "air+water":  { name: "Mist",     emojis: ["🌫️", "💧"],  tier: "COMMON",    recipe: "Air + Water" },
  "earth+fire": { name: "Lava",     emojis: ["🌋", "🔴"],   tier: "RARE",      recipe: "Earth + Fire" },
  "earth+water":{ name: "Mud",      emojis: ["💩", "🏞️"],  tier: "COMMON",    recipe: "Earth + Water" },
  "fire+water": { name: "Steam",    emojis: ["💨", "🌫️"],  tier: "COMMON",    recipe: "Fire + Water" },

  // Celestial + Element
  "fire+sun":   { name: "Flare",    emojis: ["☀️", "🔥"],   tier: "RARE",      recipe: "Fire + Sun" },
  "moon+water": { name: "Tide",     emojis: ["🌊", "🌙"],   tier: "RARE",      recipe: "Moon + Water" },
  "sun+water":  { name: "Rainbow",  emojis: ["🌈", "💧"],   tier: "RARE",      recipe: "Sun + Water" },
  "sun+earth":  { name: "Desert",   emojis: ["🏜️", "☀️"],  tier: "COMMON",    recipe: "Sun + Earth" },
  "sun+air":    { name: "Breeze",   emojis: ["🌬️", "☀️"],  tier: "COMMON",    recipe: "Sun + Air" },
  "moon+earth": { name: "Tide Pool",emojis: ["🌊", "🪨"],   tier: "COMMON",    recipe: "Moon + Earth" },
  "moon+fire":  { name: "Ember",    emojis: ["🔥", "🌙"],   tier: "COMMON",    recipe: "Moon + Fire" },
  "moon+air":   { name: "Night Wind",emojis: ["🌬️", "🌙"],  tier: "COMMON",    recipe: "Moon + Air" },

  // Abstract + Element
  "earth+time": { name: "Fossil",   emojis: ["🦴", "🪨"],   tier: "RARE",      recipe: "Earth + Time" },
  "fire+time":  { name: "Ash",      emojis: ["🌫️", "⏰"],   tier: "COMMON",    recipe: "Fire + Time" },
  "water+time": { name: "Ice",      emojis: ["🧊", "💧"],   tier: "COMMON",    recipe: "Water + Time" },
  "air+time":   { name: "Erosion",  emojis: ["🏜️", "⏰"],   tier: "COMMON",    recipe: "Air + Time" },

  // Celestial + Celestial
  "moon+sun":   { name: "Eclipse",  emojis: ["🌘", "☀️"],   tier: "LEGENDARY", recipe: "Moon + Sun" },

  // Abstract + Celestial
  "sun+time":   { name: "Season",   emojis: ["🍂", "☀️"],   tier: "RARE",      recipe: "Sun + Time" },
  "moon+time":  { name: "Phase",    emojis: ["🌗", "⏰"],   tier: "RARE",      recipe: "Moon + Time" },
};

// ─── Deterministic Fallback Craft ────────────────────────────────────────────

export function craftFallback(
  itemA: string,
  itemB: string,
  genA: number,
  genB: number,
  globalRegistry: Set<string>,
): CraftedItem | null {
  const a = itemA.toLowerCase().trim();
  const b = itemB.toLowerCase().trim();
  const key = a < b ? `${a}+${b}` : `${b}+${a}`;
  const recipe = CRAFT_RECIPES[key];
  if (!recipe) return null;
  const isMegaMind = !globalRegistry.has(recipe.name.toLowerCase());
  return {
    ...recipe,
    isMegaMind,
    generation: Math.max(genA, genB) + 1,
  };
}

// ─── AI-Powered Craft (calls /api/ai-craft) ──────────────────────────────────

export interface DiscoveredItem {
  name: string;
  tier: string;
  generation: number;
  emojis: string[];
}

export interface AiCraftResult {
  ok: boolean;
  cached?: boolean;
  conflict?: boolean;
  result?: {
    name: string;
    emojis: [string, string?];
    tier: ItemTier;
    isMegaMind: boolean;
    generation: number;
    description?: string;
  };
  error?: string;
}

export async function aiCraft(
  itemA: string,
  itemB: string,
  genA: number,
  genB: number,
  discoveredItems: DiscoveredItem[],
): Promise<AiCraftResult> {
  try {
    const res = await fetch("/api/ai-craft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemA, itemB, genA, genB, discoveredItems }),
    });

    const data = await res.json();

    if (!data.ok) {
      return { ok: false, error: data.error || "AI craft failed" };
    }

    return {
      ok: true,
      cached: data.cached,
      conflict: data.conflict,
      result: data.result,
    };
  } catch (err) {
    console.error("AI craft request failed:", err);
    return { ok: false, error: "Network error" };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function isGenesisItem(name: string): boolean {
  return GENESIS_ITEMS.some((g) => g.id === name.toLowerCase().trim());
}

export function getGenesisItem(id: string): GenesisItem | undefined {
  return GENESIS_ITEMS.find((g) => g.id === id.toLowerCase().trim());
}

export function getAllRecipeNames(): string[] {
  return Object.values(CRAFT_RECIPES).map((r) => r.name);
}

export function getCraftablePairs(): string[][] {
  return Object.keys(CRAFT_RECIPES).map((k) => k.split("+"));
}
