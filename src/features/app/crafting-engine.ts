// ============================================================================
// SEMANTIC CRAFTING ENGINE
// ============================================================================
// Hybrid crafting: AI-powered when AI_API_KEY is set, deterministic fallback
// when it isn't. Both modes enforce:
// - Only genesis items can be combined (no infinite chains)
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
  canCraftFurther: boolean; // false for crafted items (prevents infinite chains)
}

export interface GenesisItem {
  id: string;
  name: string;
  emojis: [string, string?];
  tier: "GENESIS";
  category: string;
  canCraftFurther: true;
}

// ─── 7 Genesis Elements (only these can be combined) ─────────────────────────

export const GENESIS_ITEMS: GenesisItem[] = [
  { id: "water", name: "Water", emojis: ["💧"], tier: "GENESIS", category: "element", canCraftFurther: true },
  { id: "fire",  name: "Fire",  emojis: ["🔥"], tier: "GENESIS", category: "element", canCraftFurther: true },
  { id: "earth", name: "Earth", emojis: ["🌍"], tier: "GENESIS", category: "element", canCraftFurther: true },
  { id: "air",   name: "Air",   emojis: ["💨"], tier: "GENESIS", category: "element", canCraftFurther: true },
  { id: "sun",   name: "Sun",   emojis: ["☀️"], tier: "GENESIS", category: "celestial", canCraftFurther: true },
  { id: "moon",  name: "Moon",  emojis: ["🌙"], tier: "GENESIS", category: "celestial", canCraftFurther: true },
  { id: "time",  name: "Time",  emojis: ["⏰"], tier: "GENESIS", category: "abstract", canCraftFurther: true },
];

// ─── Definitive Combination Registry (fallback when AI is unavailable) ────────

const CRAFT_RECIPES: Record<string, Omit<CraftedItem, "isMegaMind">> = {
  // Element + Element
  "air+earth":  { name: "Dust",     emojis: ["🌫️", "🏜️"],  tier: "COMMON",    recipe: "Air + Earth",   canCraftFurther: false },
  "air+fire":   { name: "Plasma",   emojis: ["⚡", "🔥"],   tier: "RARE",      recipe: "Air + Fire",    canCraftFurther: false },
  "air+water":  { name: "Mist",     emojis: ["🌫️", "💧"],  tier: "COMMON",    recipe: "Air + Water",   canCraftFurther: false },
  "earth+fire": { name: "Lava",     emojis: ["🌋", "🔴"],   tier: "RARE",      recipe: "Earth + Fire",  canCraftFurther: false },
  "earth+water":{ name: "Mud",      emojis: ["💩", "🏞️"],  tier: "COMMON",    recipe: "Earth + Water", canCraftFurther: false },
  "fire+water": { name: "Steam",    emojis: ["💨", "🌫️"],  tier: "COMMON",    recipe: "Fire + Water",  canCraftFurther: false },

  // Celestial + Element
  "fire+sun":   { name: "Flare",    emojis: ["☀️", "🔥"],   tier: "RARE",      recipe: "Fire + Sun",    canCraftFurther: false },
  "moon+water": { name: "Tide",     emojis: ["🌊", "🌙"],   tier: "RARE",      recipe: "Moon + Water",  canCraftFurther: false },
  "sun+water":  { name: "Rainbow",  emojis: ["🌈", "💧"],   tier: "RARE",      recipe: "Sun + Water",   canCraftFurther: false },
  "sun+earth":  { name: "Desert",   emojis: ["🏜️", "☀️"],  tier: "COMMON",    recipe: "Sun + Earth",   canCraftFurther: false },
  "sun+air":    { name: "Breeze",   emojis: ["🌬️", "☀️"],  tier: "COMMON",    recipe: "Sun + Air",     canCraftFurther: false },
  "moon+earth": { name: "Tide Pool",emojis: ["🌊", "🪨"],   tier: "COMMON",    recipe: "Moon + Earth",  canCraftFurther: false },
  "moon+fire":  { name: "Ember",    emojis: ["🔥", "🌙"],   tier: "COMMON",    recipe: "Moon + Fire",   canCraftFurther: false },
  "moon+air":   { name: "Night Wind",emojis: ["🌬️", "🌙"],  tier: "COMMON",    recipe: "Moon + Air",    canCraftFurther: false },

  // Abstract + Element
  "earth+time": { name: "Fossil",   emojis: ["🦴", "🪨"],   tier: "RARE",      recipe: "Earth + Time",  canCraftFurther: false },
  "fire+time":  { name: "Ash",      emojis: ["🌫️", "⏰"],   tier: "COMMON",    recipe: "Fire + Time",   canCraftFurther: false },
  "water+time": { name: "Ice",      emojis: ["🧊", "💧"],   tier: "COMMON",    recipe: "Water + Time",  canCraftFurther: false },
  "air+time":   { name: "Erosion",  emojis: ["🏜️", "⏰"],   tier: "COMMON",    recipe: "Air + Time",    canCraftFurther: false },

  // Celestial + Celestial
  "moon+sun":   { name: "Eclipse",  emojis: ["🌘", "☀️"],   tier: "LEGENDARY", recipe: "Moon + Sun",    canCraftFurther: false },

  // Abstract + Celestial
  "sun+time":   { name: "Season",   emojis: ["🍂", "☀️"],   tier: "RARE",      recipe: "Sun + Time",    canCraftFurther: false },
  "moon+time":  { name: "Phase",    emojis: ["🌗", "⏰"],   tier: "RARE",      recipe: "Moon + Time",   canCraftFurther: false },
};

// ─── Deterministic Fallback Craft ────────────────────────────────────────────

export function craftFallback(
  itemA: string,
  itemB: string,
  globalRegistry: Set<string>,
): CraftedItem | null {
  const a = itemA.toLowerCase().trim();
  const b = itemB.toLowerCase().trim();
  const key = a < b ? `${a}+${b}` : `${b}+${a}`;
  const recipe = CRAFT_RECIPES[key];
  if (!recipe) return null;
  const isMegaMind = !globalRegistry.has(recipe.name.toLowerCase());
  return { ...recipe, isMegaMind };
}

// ─── AI-Powered Craft (calls /api/ai-craft) ──────────────────────────────────

export interface DiscoveredItem {
  name: string;
  tier: string;
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
    description?: string;
  };
  error?: string;
}

export async function aiCraft(
  itemA: string,
  itemB: string,
  discoveredItems: DiscoveredItem[],
): Promise<AiCraftResult> {
  try {
    const res = await fetch("/api/ai-craft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemA, itemB, discoveredItems }),
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
