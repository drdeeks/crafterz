// ============================================================================
// SEMANTIC CRAFTING SYSTEM
// ============================================================================



// ============================================================================
// TYPES
// ============================================================================

export type SemanticCategory = "element" | "compound" | "concept" | "mythical" | "legendary" | "void" | "energy" | "life" | "terrain" | "weather" | "celestial" | "time" | "abstract" | "light";

export type ItemTier = "GENESIS" | "COMMON" | "RARE" | "LEGENDARY";

export interface ItemDefinition {
  name: string;
  primaryEmoji: string;
  secondaryEmojis?: string[];
  categories: SemanticCategory[];
  modifiers: string[];
  baseTier: ItemTier;
}

export interface CraftResult {
  name: string;
  emojis: [string, string?];
  tier: ItemTier;
  isMegaMind: boolean;
}

// ============================================================================
// GENESIS ITEMS
// ============================================================================

export const GENESIS_ITEMS: Record<string, ItemDefinition> = {
  fire: {
    name: "Fire",
    primaryEmoji: "🔥",
    secondaryEmojis: ["🌋", "🔥"],
    categories: ["element", "energy"],
    modifiers: ["hot", "destructive", "bright"],
    baseTier: "GENESIS",
  },
  water: {
    name: "Water",
    primaryEmoji: "💧",
    secondaryEmojis: ["🌊", "💦"],
    categories: ["element", "life"],
    modifiers: ["cool", "flowing", "pure"],
    baseTier: "GENESIS",
  },
  earth: {
    name: "Earth",
    primaryEmoji: "🌍",
    secondaryEmojis: ["🏔️", "🌋"],
    categories: ["element", "terrain"],
    modifiers: ["solid", "fertile", "heavy"],
    baseTier: "GENESIS",
  },
  air: {
    name: "Air",
    primaryEmoji: "💨",
    secondaryEmojis: ["🌪️", "💨"],
    categories: ["element", "weather"],
    modifiers: ["light", "mobile", "invisible"],
    baseTier: "GENESIS",
  },
  sun: {
    name: "Sun",
    primaryEmoji: "☀️",
    secondaryEmojis: ["🌞"],
    categories: ["celestial", "energy", "light"],
    modifiers: ["bright", "hot", "radiant"],
    baseTier: "GENESIS",
  },
  moon: {
    name: "Moon",
    primaryEmoji: "🌙",
    secondaryEmojis: ["🌕", "🌘"],
    categories: ["celestial", "time"],
    modifiers: ["dark", "cool", "mysterious", "cyclical"],
    baseTier: "GENESIS",
  },
  time: {
    name: "Time",
    primaryEmoji: "⏰",
    secondaryEmojis: ["⏳", "⌛"],
    categories: ["abstract", "time"],
    modifiers: ["eternal", "fleeting", "ancient"],
    baseTier: "GENESIS",
  },
  life: {
    name: "Life",
    primaryEmoji: "🌱",
    secondaryEmojis: ["🌿", "🐛"],
    categories: ["element", "life"],
    modifiers: ["growing", "organic", "vibrant"],
    baseTier: "GENESIS",
  },
  energy: {
    name: "Energy",
    primaryEmoji: "⚡",
    secondaryEmojis: ["💥", "🔋"],
    categories: ["abstract", "energy"],
    modifiers: ["powerful", "dynamic", "volatile"],
    baseTier: "GENESIS",
  },
};

// ============================================================================
// COMBINATION RULES
// ============================================================================

/**
 * Tier escalation rules based on category combinations
 */
const TIER_ESCALATION: Record<string, number> = {
  // Two elements combining usually produces COMMON
  "element+element": 1,
  "element+celestial": 1,
  "element+weather": 1,
  "element+terrain": 1,
  "element+life": 1,
  
  // Element + Energy often produces RARE
  "element+energy": 2,
  "energy+celestial": 2,
  "energy+time": 2,
  
  // Celestial + Celestial produces RARE
  "celestial+celestial": 2,
  "celestial+time": 2,

  // Triple-energy or abstract combinations produce LEGENDARY
  "energy+energy": 3,
  "abstract+abstract": 3,
  "abstract+energy": 3,
  "legendary+element": 3,
  "legendary+celestial": 3,
  "void+void": 3,
  "mythical+mythical": 3,
};

/**
 * Predefined logical combinations
 */
export const LOGICAL_COMBINATIONS = new Map<string, { name: string; emojis: [string, string?] }>([
  // Basic element combinations (COMMON)
  ["fire+water", { name: "Steam", emojis: ["💨", "🌫️"] }],
  ["water+earth", { name: "Mud", emojis: ["💩", "🏞️"] }],
  ["earth+fire", { name: "Lava", emojis: ["🌋", "🔥"] }],
  ["air+water", { name: "Mist", emojis: ["🌫️", "💨"] }],
  ["air+earth", { name: "Dust", emojis: ["🌪️", "🏜️"] }],
  ["air+fire", { name: "Plasma", emojis: ["⚡", "🔥"] }],
  
  // Element + Life combinations (COMMON)
  ["fire+life", { name: "Cooked", emojis: ["🍳", "🔥"] }],
  ["water+life", { name: "Hydrated", emojis: ["💧", "🌱"] }],
  ["earth+life", { name: "Plant", emojis: ["🌱", "🌿"] }],
  ["air+life", { name: "Bird", emojis: ["🐦", "🌬️"] }],
]);

/**
 * Category-based combination templates
 */
const CATEGORY_COMBINATIONS: Array<{
  categories: SemanticCategory[];
  template: (a: string, b: string) => string;
  emojis: (aEmojis: string[], bEmojis: string[]) => [string, string?];
}> = [
  // Mythical combinations
  {
    categories: ["mythical", "mythical"],
    template: (a, b) => `${a}-${b} Myth`,
    emojis: (aEmojis, bEmojis) => [aEmojis[0], bEmojis[0]] as [string, string?],
  },
  // Natural formations
  {
    categories: ["element", "terrain"],
    template: (a, b) => `${a} ${b}`,
    emojis: (aEmojis, bEmojis) => [aEmojis[0], bEmojis[0]] as [string, string?],
  },
  // Celestial phenomena
  {
    categories: ["celestial", "celestial"],
    template: (a, b) => `${a}-${b} Phenomenon`,
    emojis: (aEmojis, bEmojis) => [aEmojis[0], bEmojis[0]] as [string, string?],
  },
  // Time-based
  {
    categories: ["time", "element"],
    template: (a, b) => `${a} of ${b}`,
    emojis: (aEmojis, bEmojis) => [aEmojis[0], bEmojis[0]] as [string, string?],
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determine tier for a combination
 */
function determineTier(key: string, a: string, b: string): ItemTier {
  const categoryA = GENESIS_ITEMS[a]?.categories[0] || "element";
  const categoryB = GENESIS_ITEMS[b]?.categories[0] || "element";
  const categoryKey = `${categoryA}+${categoryB}`;
  
  const multiplier = TIER_ESCALATION[categoryKey] || 1;
  
  if (multiplier >= 3) return "LEGENDARY";
  if (multiplier >= 2) return "RARE";
  return "COMMON";
}

/**
 * Get item definition by name
 */
function getItemDefinition(name: string): ItemDefinition | null {
  const normalized = name.toLowerCase().trim();
  return GENESIS_ITEMS[normalized] || null;
}

/**
 * Create a default item definition for items we don't have predefined
 */
function createDefaultDefinition(origName: string, normalized: string): ItemDefinition {
  // Default to COMMON tier for generated items
  return {
    name: origName,
    primaryEmoji: "❓",
    categories: ["element"],
    modifiers: [],
    baseTier: "COMMON",
  };
}

/**
 * Generate a name for a combination
 */
function generateName(defA: ItemDefinition, defB: ItemDefinition, key: string): string {
  const categoryA = defA.categories[0];
  const categoryB = defB.categories[0];
  
  const template = CATEGORY_COMBINATIONS.find(t =>
    t.categories.includes(categoryA) && t.categories.includes(categoryB)
  );
  
  if (template) {
    return template.template(defA.name, defB.name);
  }
  
  return `${defA.name} ${defB.name}`;
}

/**
 * Generate emojis for a combination
 */
function generateEmojis(defA: ItemDefinition, defB: ItemDefinition, key: string): [string, string?] {
  const template = CATEGORY_COMBINATIONS.find(t =>
    t.categories.includes(defA.categories[0]) && t.categories.includes(defB.categories[0])
  );
  
  if (template) {
    return template.emojis(
      defA.primaryEmoji ? [defA.primaryEmoji] : [],
      defB.primaryEmoji ? [defB.primaryEmoji] : []
    );
  }
  
  return [defA.primaryEmoji, defB.primaryEmoji];
}

// Cache for crafting results
const craftCache = new Map<string, CraftResult>();

/**
 * Main crafting function
 */
export function semanticCraft(
  nameA: string,
  nameB: string,
  globalRegistry: Set<string> = new Set(),
): CraftResult {
  // Normalize names
  const a = nameA.toLowerCase().trim();
  const b = nameB.toLowerCase().trim();
  
  // Ensure consistent ordering for determinism
  const [firstName, secondName] = a < b ? [a, b] : [b, a];
  const [firstOrig, secondOrig] = a < b ? [nameA, nameB] : [nameB, nameA];
  
  const key = `${firstName}+${secondName}`;
  
  // Check if this combination has been discovered before (MegaMind check)
  const isMegaMind = !globalRegistry.has(key);
  
  // 1. Check for direct logical combinations
  if (LOGICAL_COMBINATIONS.has(key)) {
    const result = LOGICAL_COMBINATIONS.get(key)!;
    const tier = determineTier(key, firstName, secondName);
    return {
      ...result,
      tier,
      isMegaMind,
    };
  }
  
  // 2. Check for reverse order
  const reverseKey = `${secondName}+${firstName}`;
  if (LOGICAL_COMBINATIONS.has(reverseKey)) {
    const result = LOGICAL_COMBINATIONS.get(reverseKey)!;
    const tier = determineTier(reverseKey, secondName, firstName);
    return {
      ...result,
      tier,
      isMegaMind,
    };
  }
  
  // 3. Check for category-based combinations
  const defA = getItemDefinition(firstOrig) || createDefaultDefinition(firstOrig, firstName);
  const defB = getItemDefinition(secondOrig) || createDefaultDefinition(secondOrig, secondName);
  
  const categoryKey = `${defA.categories[0]}+${defB.categories[0]}`;
  const categoryTemplate = CATEGORY_COMBINATIONS.find(template =>
    template.categories.includes(defA.categories[0]) &&
    template.categories.includes(defB.categories[0])
  );
  
  if (categoryTemplate) {
    const name = categoryTemplate.template(firstName, secondName);
    const emojis = categoryTemplate.emojis(defA.primaryEmoji ? [defA.primaryEmoji] : [], defB.primaryEmoji ? [defB.primaryEmoji] : []);
    const tier = determineTier(key, firstName, secondName);
    return {
      name,
      emojis,
      tier,
      isMegaMind,
    };
  }
  
  // 4. Fallback to generic name/emoji generation
  const name = generateName(defA, defB, key);
  const emojis = generateEmojis(defA, defB, key);
  const tier = determineTier(key, firstName, secondName);
  
  return {
    name,
    emojis,
    tier,
    isMegaMind,
  };
}

/**
 * Check if a combination has been cached
 */
export function getCachedCraft(a: string, b: string): CraftResult | null {
  const key = [a, b].sort().join("+");
  return craftCache.get(key) || null;
}

/**
 * Clear the craft cache
 */
export function clearCraftCache(): void {
  craftCache.clear();
}
