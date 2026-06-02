// ============================================================================
// SEMANTIC CRAFTING ENGINE — Recursive with Generation Tracking
// ============================================================================
// Hybrid crafting: AI-powered when AI_API_KEY is set, deterministic fallback
// when it isn't. Supports infinite recursive crafting like Little Alchemy/
// Infinite Craft with generation tracking:
// - Genesis items = Generation 0
// - Crafted items = max(genA, genB) + 1
// - Server-validated MegaMind detection (first global discovery only)
// - Single best emoji per item (duplication across items is allowed)
// ============================================================================

export type ItemTier = "GENESIS" | "COMMON" | "RARE" | "LEGENDARY";

export interface CraftedItem {
  name: string;
  emoji: string;
  tier: ItemTier;
  isMegaMind: boolean;
  recipe: string;
  generation: number;
}

export interface GenesisItem {
  id: string;
  name: string;
  emoji: string;
  tier: "GENESIS";
  category: string;
  generation: 0;
}

// ─── 7 Genesis Elements (Generation 0) ───────────────────────────────────────

export const GENESIS_ITEMS: GenesisItem[] = [
  { id: "water", name: "Water", emoji: "💧", tier: "GENESIS", category: "element", generation: 0 },
  { id: "fire",  name: "Fire",  emoji: "🔥", tier: "GENESIS", category: "element", generation: 0 },
  { id: "earth", name: "Earth", emoji: "🌍", tier: "GENESIS", category: "element", generation: 0 },
  { id: "air",   name: "Air",   emoji: "💨", tier: "GENESIS", category: "element", generation: 0 },
  { id: "sun",   name: "Sun",   emoji: "☀️", tier: "GENESIS", category: "celestial", generation: 0 },
  { id: "moon",  name: "Moon",  emoji: "🌙", tier: "GENESIS", category: "celestial", generation: 0 },
  { id: "time",  name: "Time",  emoji: "⏳", tier: "GENESIS", category: "abstract", generation: 0 },
];

// ─── Definitive Combination Registry (fallback when AI is unavailable) ────────

const CRAFT_RECIPES: Record<string, Omit<CraftedItem, "isMegaMind" | "generation">> = {
  "air+earth":   { name: "Dust",       emoji: "🌫️", tier: "COMMON",    recipe: "Air + Earth" },
  "air+fire":    { name: "Plasma",     emoji: "⚡",  tier: "RARE",      recipe: "Air + Fire" },
  "air+water":   { name: "Mist",       emoji: "🌫️", tier: "COMMON",    recipe: "Air + Water" },
  "earth+fire":  { name: "Lava",       emoji: "🌋",  tier: "RARE",      recipe: "Earth + Fire" },
  "earth+water": { name: "Mud",        emoji: "🟫",  tier: "COMMON",    recipe: "Earth + Water" },
  "fire+water":  { name: "Steam",      emoji: "💨",  tier: "COMMON",    recipe: "Fire + Water" },
  "fire+sun":    { name: "Flare",      emoji: "🌟",  tier: "RARE",      recipe: "Fire + Sun" },
  "moon+water":  { name: "Tide",       emoji: "🌊",  tier: "RARE",      recipe: "Moon + Water" },
  "sun+water":   { name: "Rainbow",    emoji: "🌈",  tier: "RARE",      recipe: "Sun + Water" },
  "sun+earth":   { name: "Desert",     emoji: "🏜️", tier: "COMMON",    recipe: "Sun + Earth" },
  "sun+air":     { name: "Breeze",     emoji: "🌬️", tier: "COMMON",    recipe: "Sun + Air" },
  "moon+earth":  { name: "Tide Pool",  emoji: "🌊",  tier: "COMMON",    recipe: "Moon + Earth" },
  "moon+fire":   { name: "Ember",      emoji: "🔥",  tier: "COMMON",    recipe: "Moon + Fire" },
  "moon+air":    { name: "Night Wind", emoji: "🌬️", tier: "COMMON",    recipe: "Moon + Air" },
  "earth+time":  { name: "Fossil",     emoji: "🦴",  tier: "RARE",      recipe: "Earth + Time" },
  "fire+time":   { name: "Ash",        emoji: "🌫️", tier: "COMMON",    recipe: "Fire + Time" },
  "water+time":  { name: "Ice",        emoji: "🧊",  tier: "COMMON",    recipe: "Water + Time" },
  "air+time":    { name: "Erosion",    emoji: "🏔️", tier: "COMMON",    recipe: "Air + Time" },
  "moon+sun":    { name: "Eclipse",    emoji: "🌘",  tier: "LEGENDARY", recipe: "Moon + Sun" },
  "sun+time":    { name: "Season",     emoji: "🍂",  tier: "RARE",      recipe: "Sun + Time" },
  "moon+time":   { name: "Phase",      emoji: "🌗",  tier: "RARE",      recipe: "Moon + Time" },
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
  emoji: string;
}

export interface AiCraftResult {
  ok: boolean;
  cached?: boolean;
  conflict?: boolean;
  result?: {
    name: string;
    emoji: string;
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
