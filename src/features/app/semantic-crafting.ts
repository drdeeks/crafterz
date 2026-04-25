/**
 * Semantic Crafting Engine
 * 
 * Generates crafting results deterministically based on input item properties.
 * No hardcoded combinations - everything is derived from semantic analysis.
 * 
 * Key principles:
 * 1. Same two items always produce the same result (deterministic)
 * 2. Results are logically derived from input names and properties
 * 3. Emoji selections are meaningful and limited to 2-4 per item
 * 4. Names are compound/descriptive, not concatenated
 * 5. Multiple input pairs can produce the same output (convergence)
 */

import { strHash } from "./crafting-engine";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type CraftedItem = {
  name: string;
  emojis: [string, string?];
  tier: "COMMON" | "RARE" | "LEGENDARY";
};

export type CraftResult = CraftedItem & {
  isMegaMind: boolean;
};

// ============================================================================
// ITEM SEMANTIC DATABASE
// ============================================================================

/**
 * Semantic categories for items
 * Used to generate logical combinations
 */
export type SemanticCategory = 
  | "element"
  | "celestial"
  | "weather"
  | "terrain"
  | "life"
  | "energy"
  | "time"
  | "material"
  | "liquid"
  | "gas"
  | "solid"
  | "abstract"
  | "mythical"
  | "constructed";

/**
 * Item definition with semantic properties
 */
export interface ItemDefinition {
  name: string;
  primaryEmoji: string;
  secondaryEmojis?: string[];
  categories: SemanticCategory[];
  modifiers: string[];
  baseTier: "GENESIS" | "COMMON" | "RARE" | "LEGENDARY";
}

/**
 * Genesis items - the starting elements
 */
const GENESIS_ITEMS: Record<string, ItemDefinition> = {
  water: {
    name: "Water",
    primaryEmoji: "💧",
    secondaryEmojis: ["🌊"],
    categories: ["element", "liquid"],
    modifiers: ["wet", "fluid", "cool"],
    baseTier: "GENESIS",
  },
  fire: {
    name: "Fire",
    primaryEmoji: "🔥",
    secondaryEmojis: ["🔥"],
    categories: ["element", "energy"],
    modifiers: ["hot", "burning", "intense"],
    baseTier: "GENESIS",
  },
  earth: {
    name: "Earth",
    primaryEmoji: "🌍",
    secondaryEmojis: ["🪨"],
    categories: ["element", "solid", "terrain"],
    modifiers: ["solid", "grounded", "fertile"],
    baseTier: "GENESIS",
  },
  air: {
    name: "Air",
    primaryEmoji: "💨",
    secondaryEmojis: ["😮‍💨"],
    categories: ["element", "gas"],
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
  
  // Mythical combinations
  "mythical+element": 3,
  "mythical+energy": 3,
  "mythical+celestial": 3,
  
  // Life + Energy produces RARE
  "life+energy": 2,
  "life+time": 2,
  
  // Time combinations are often LEGENDARY
  "time+celestial": 3,
  "time+abstract": 3,
};

/**
 * Combinations that should never happen or should be special
 */
const SPECIAL_COMBINATIONS: Map<string, { name: string; emojis: [string, string?]; tier: "COMMON" | "RARE" | "LEGENDARY" }> = new Map();

// ============================================================================
// NAME GENERATION RULES
// ============================================================================

/**
 * Prefixes for compound names based on first item's category
 */
const COMPOUND_PREFIXES: Partial<Record<SemanticCategory, string[]>> = {
  element: ["", "Pure", "Raw", "Natural"],
  celestial: ["", "Solar", "Lunar", "Stellar", "Cosmic"],
  weather: ["", "Storm", "Rain", "Wind"],
  terrain: ["", "Mountain", "River", "Desert"],
  life: ["", "Living", "Organic", "Wild"],
  energy: ["", "Charged", "Electric", "Radiant"],
  time: ["", "Ancient", "Eternal", "Timeless"],
  mythical: ["", "Mythic", "Legendary", "Arcane"],
};

/**
 * Suffixes for compound names based on second item's category
 */
const COMPOUND_SUFFIXES: Partial<Record<SemanticCategory, string[]>> = {
  element: ["", "Stone", "Essence", "Form"],
  celestial: ["", "Light", "Ray", "Body"],
  weather: ["", "Cloud", "Front", "Pattern"],
  terrain: ["", "Formation", "Land", "SCape"],
  life: ["", "Being", "Form", "Entity"],
  energy: ["", "Force", "Field", "Wave"],
  time: ["", "Era", "Age", "Moment"],
  mythical: ["", "Protector", "Guardian", "Spirit"],
};

/**
 * Direct combination mappings for common, logical pairs
 * These are the ONLY hardcoded exceptions - for very specific, well-known combinations
 */
const LOGICAL_COMBINATIONS: Map<string, { name: string; emojis: [string, string?] }> = new Map([
  // Element + Element
  ["fire+water", { name: "Steam", emojis: ["🌫️", "💨"] }],
  ["earth+fire", { name: "Lava", emojis: ["🌋", "🔴"] }],
  ["air+fire", { name: "Lightning", emojis: ["⚡", "🌩️"] }],
  ["earth+water", { name: "Mud", emojis: ["🟫", "💧"] }],
  ["air+water", { name: "Rain", emojis: ["🌧️", "💧"] }],
  ["air+earth", { name: "Dust", emojis: ["🌪️", "🟤"] }],
  
  // Celestial combinations
  ["sun+moon", { name: "Eclipse", emojis: ["🌘", "☀️"] }],
  ["moon+sun", { name: "Eclipse", emojis: ["🌘", "☀️"] }],
  
  // Time combinations
  ["time+moon", { name: "Eternity", emojis: ["♾️", "🌙"] }],
  ["moon+time", { name: "Eternity", emojis: ["♾️", "🌙"] }],
  ["earth+time", { name: "Fossil", emojis: ["🦴", "🪨"] }],
  ["time+earth", { name: "Fossil", emojis: ["🦴", "🪨"] }],
  
  // Classic combinations
  ["sun+water", { name: "Rainbow", emojis: ["🌈", "☀️"] }],
  ["water+sun", { name: "Rainbow", emojis: ["🌈", "☀️"] }],
  ["moon+water", { name: "Tide", emojis: ["🌊", "🌙"] }],
  ["water+moon", { name: "Tide", emojis: ["🌊", "🌙"] }],
  ["air+sun", { name: "Aurora", emojis: ["🌌", "🌈"] }],
  ["sun+air", { name: "Aurora", emojis: ["🌌", "🌈"] }],
]);

/**
 * Category-based naming templates
 * Used when no direct combination is defined
 */
const CATEGORY_NAME_TEMPLATES: Array<{
  categories: SemanticCategory[];
  template: (a: string, b: string) => string;
  emojis: (aEmojis: string[], bEmojis: string[]) => [string, string?];
}> = [
  // Fire combinations
  {
    categories: ["element", "energy"],
    template: (a, b) => fireCombination(a, b),
    emojis: (aEmojis, bEmojis) => selectBestEmojis(aEmojis, bEmojis, 2),
  },
  // Natural formations
  {
    categories: ["element", "terrain"],
    template: (a, b) => naturalFormation(a, b),
    emojis: (aEmojis, bEmojis) => selectBestEmojis(aEmojis, bEmojis, 2),
  },
  // Celestial phenomena
  {
    categories: ["celestial", "celestial"],
    template: (a, b) => celestialCombination(a, b),
    emojis: (aEmojis, bEmojis) => selectBestEmojis(aEmojis, bEmojis, 2),
  },
  // Time-based
  {
    categories: ["time", "element"],
    template: (a, b) => timeCombination(a, b),
    emojis: (aEmojis, bEmojis) => selectBestEmojis(aEmojis, bEmojis, 2),
  },
];

// ============================================================================
// CORE CRAFTING FUNCTION
// ============================================================================

/**
 * Discover if an item name exists in our definitions
 */
function isGenesisItem(name: string): boolean {
  const normalized = name.toLowerCase().trim();
  return GENESIS_ITEMS[normalized] !== undefined;
}

/**
 * Get item definition by name
 */
function getItemDefinition(name: string): ItemDefinition | null {
  // Check genesis items first
  const normalized = name.toLowerCase().trim();
  if (GENESIS_ITEMS[normalized]) {
    return GENESIS_ITEMS[normalized];
  }
  
  // In a full implementation, we'd check a database of discovered items
  // For now, we'll return null for non-genesis items
  return null;
}

/**
 * Main crafting function
 * Takes two item names and a registry of discovered items
 * Returns a deterministic crafting result
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
  
  // 3. Generate name and emojis from item definitions
  const defA = getItemDefinition(firstOrig) || createDefaultDefinition(firstOrig, firstName);
  const defB = getItemDefinition(secondOrig) || createDefaultDefinition(secondOrig, secondName);
  
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
 * Create a default item definition for items we don't have predefined
 */
function createDefaultDefinition(origName: string, normalized: string): ItemDefinition {
  // Extract basic info from the name
  const primaryEmoji = extractPrimaryEmoji(origName);
  const categories = inferCategories(normalized);
  const modifiers = inferModifiers(normalized);
  
  // Default to COMMON tier for generated items
  return {
    name: origName,
    primaryEmoji,
    categories,
    modifiers,
    baseTier: "COMMON",
  };
}

/**
 * Extract primary emoji from name (if name contains emoji)
 */
function extractPrimaryEmoji(name: string): string {
  // Check if name contains emoji
  const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2000-\u2BFF\u2600-\u26FF\u2700-\u27BF]/g;
  const match = name.match(emojiRegex);
  if (match && match.length > 0) {
    return match[0];
  }
  // Default emojis based on name
  return inferDefaultEmoji(name.toLowerCase());
}

/**
 * Infer categories from item name
 */
function inferCategories(name: string): SemanticCategory[] {
  const categories: SemanticCategory[] = [];
  const lower = name.toLowerCase();
  
  if (lower.includes("fire") || lower.includes("flame") || lower.includes("burn")) {
    categories.push("element");
  }
  if (lower.includes("water") || lower.includes("rain") || lower.includes("ocean") || lower.includes("sea")) {
    categories.push("element", "liquid");
  }
  if (lower.includes("earth") || lower.includes("ground") || lower.includes("rock") || lower.includes("stone") || lower.includes("mountain")) {
    categories.push("element", "terrain", "solid");
  }
  if (lower.includes("air") || lower.includes("wind") || lower.includes("sky") || lower.includes("cloud")) {
    categories.push("element", "gas", "weather");
  }
  if (lower.includes("sun") || lower.includes("solar") || lower.includes("star") || lower.includes("light")) {
    categories.push("celestial");
    if (lower.includes("sun")) categories.push("energy");
  }
  if (lower.includes("moon") || lower.includes("lunar")) {
    categories.push("celestial", "time");
  }
  if (lower.includes("time") || lower.includes("eternal") || lower.includes("ancient")) {
    categories.push("time", "abstract");
  }
  if (lower.includes("plant") || lower.includes("tree") || lower.includes("forest") || lower.includes("flower")) {
    categories.push("life");
  }
  if (lower.includes("lightning") || lower.includes("electric") || lower.includes("energy") || lower.includes("power")) {
    categories.push("energy");
  }
  
  // Remove duplicates
  return [...new Set(categories)];
}

/**
 * Infer modifiers from item name
 */
function inferModifiers(name: string): string[] {
  const modifiers: string[] = [];
  const lower = name.toLowerCase();
  
  if (lower.includes("hot") || lower.includes("burning") || lower.includes("fire")) modifiers.push("hot");
  if (lower.includes("cold") || lower.includes("ice") || lower.includes("frozen")) modifiers.push("cold");
  if (lower.includes("wet") || lower.includes("water") || lower.includes("rain")) modifiers.push("wet");
  if (lower.includes("dry") || lower.includes("desert") || lower.includes("arid")) modifiers.push("dry");
  if (lower.includes("hard") || lower.includes("stone") || lower.includes("rock")) modifiers.push("hard");
  if (lower.includes("soft") || lower.includes("mud")) modifiers.push("soft");
  if (lower.includes("fast") || lower.includes("quick")) modifiers.push("fast");
  if (lower.includes("slow") || lower.includes("ancient")) modifiers.push("slow");
  if (lower.includes("bright") || lower.includes("sun") || lower.includes("light")) modifiers.push("bright");
  if (lower.includes("dark") || lower.includes("night") || lower.includes("shadow")) modifiers.push("dark");
  
  return modifiers;
}

/**
 * Infer a default emoji from name
 */
function inferDefaultEmoji(name: string): string {
  if (name.includes("water") || name.includes("rain") || name.includes("ocean")) return "💧";
  if (name.includes("fire") || name.includes("burn") || name.includes("flame")) return "🔥";
  if (name.includes("earth") || name.includes("ground") || name.includes("rock")) return "🪨";
  if (name.includes("air") || name.includes("wind") || name.includes("sky")) return "💨";
  if (name.includes("sun") || name.includes("light")) return "☀️";
  if (name.includes("moon") || name.includes("night")) return "🌙";
  if (name.includes("time") || name.includes("clock") || name.includes("eternal")) return "⏰";
  if (name.includes("plant") || name.includes("tree") || name.includes("forest")) return "🌳";
  if (name.includes("lightning") || name.includes("electric")) return "⚡";
  if (name.includes("cloud")) return "☁️";
  if (name.includes("storm") || name.includes("rain")) return "⛈️";
  if (name.includes("mud")) return "🟫";
  if (name.includes("dust")) return "🌪️";
  if (name.includes("lava")) return "🌋";
  if (name.includes("steam")) return "🌫️";
  if (name.includes("fossil")) return "🦴";
  if (name.includes("tide")) return "🌊";
  if (name.includes("aurora")) return "🌌";
  if (name.includes("eclipse")) return "🌘";
  if (name.includes("desert")) return "🏜️";
  if (name.includes("volcano")) return "🌋";
  
  return "✨"; // Default sparkle
}

// ============================================================================
// NAME GENERATION FUNCTIONS
// ============================================================================

/**
 * Determine tier based on category combination
 */
function determineTier(key: string, a: string, b: string): "COMMON" | "RARE" | "LEGENDARY" {
  const defA = getItemDefinition(a) || createDefaultDefinition(a, a);
  const defB = getItemDefinition(b) || createDefaultDefinition(b, b);
  
  // If either is GENESIS, it's at least COMMON
  if (defA.baseTier === "GENESIS" || defB.baseTier === "GENESIS") {
    // Check for known high-value combinations
    if (key.includes("sun") && key.includes("moon")) return "RARE";
    if (key.includes("sun") && key.includes("fire")) return "RARE";
    if (key.includes("moon") && key.includes("time")) return "LEGENDARY";
    if (key.includes("earth") && key.includes("time")) return "RARE";
    if (key.includes("air") && key.includes("fire")) return "LEGENDARY";
    if (key.includes("sun") && key.includes("water")) return "LEGENDARY";
    
    // Check categories
    for (const [catPair, tierLevel] of Object.entries(TIER_ESCALATION)) {
      const [cat1, cat2] = catPair.split("+");
      if (defA.categories.includes(cat1 as SemanticCategory) && defB.categories.includes(cat2 as SemanticCategory)) {
        return tierLevel === 1 ? "COMMON" : tierLevel === 2 ? "RARE" : "LEGENDARY";
      }
      if (defA.categories.includes(cat2 as SemanticCategory) && defB.categories.includes(cat1 as SemanticCategory)) {
        return tierLevel === 1 ? "COMMON" : tierLevel === 2 ? "RARE" : "LEGENDARY";
      }
    }
    
    return "COMMON";
  }
  
  // For non-genesis items, base on their original tiers
  // i.e., if combining two RARE items, likely LEGENDARY
  // This is a simplification - in practice we'd need to track each item's tier
  
  return "COMMON";
}

/**
 * Generate a name from two item definitions
 */
function generateName(defA: ItemDefinition, defB: ItemDefinition, key: string): string {
  const a = defA.name;
  const b = defB.name;
  
  // Check for direct logical combination
  if (LOGICAL_COMBINATIONS.has(key)) {
    return LOGICAL_COMBINATIONS.get(key)!.name;
  }
  
  // Get primary categories
  const aCats = defA.categories;
  const bCats = defB.categories;
  
  // Check if same item (intensification)
  if (a.toLowerCase() === b.toLowerCase()) {
    return generateIntensifiedName(a, aCats[0]);
  }
  
  // Check for category-based naming
  for (const template of CATEGORY_NAME_TEMPLATES) {
    const hasAllCats = template.categories.every(cat => 
      aCats.includes(cat) || bCats.includes(cat)
    );
    if (hasAllCats) {
      return template.template(a, b);
    }
  }
  
  // Default: compound name
  return generateCompoundName(a, b, defA, defB);
}

/**
 * Generate name for intensified item (same + same)
 */
function generateIntensifiedName(name: string, category: SemanticCategory): string {
  const prefixes = ["", "Greater", "Mega", "Super", "Ultimate"];
  const suffixes: Record<SemanticCategory, string[]> = {
    element: ["Storm", "Surge", "Essence", "Core"],
    celestial: ["Nebula", "Cluster", "Supernova", "Phenomenon"],
    weather: ["Tempest", "Monsoon", "Typhoon", "Vortex"],
    terrain: ["Mountain", "Canyon", "Continent", "Range"],
    life: ["Forest", "Ecosystem", "Civilization", "Biosphere"],
    energy: ["Nova", "Plasma", "Singularity", "Field"],
    time: ["Epoch", "Era", "Infinity", "Eternity"],
    material: ["Alloy", "Compound", "Mixture", "Composite"],
    liquid: ["Ocean", "Flood", "Reservoir", "Deluge"],
    gas: ["Atmosphere", "Cloud", "Nebula", "Vacuum"],
    solid: ["Boulder", "Column", "Structure", "Formation"],
    abstract: ["Concept", "Principle", "Theory", "Cosmos"],
    mythical: ["Pantheon", "Legion", "Armada", "Realms"],
    constructed: ["Architecture", "City", "Metropolis", "Empire"],
  };
  
  const suffix = suffixes[category] || ["Form", "Type", "Variation", "Edition"];
  const base = name.replace(/^(A|An|The) /i, "");
  
  // Use deterministic selection based on name hash
  const h = strHash(name);
  const prefix = prefixes[h % prefixes.length];
  const selectedSuffix = suffix[h % suffix.length];
  
  if (prefix) {
    return `${prefix} ${base} ${selectedSuffix}`.trim();
  }
  return `${base} ${selectedSuffix}`.trim();
}

/**
 * Compound name from two different items
 */
function generateCompoundName(
  a: string,
  b: string,
  defA: ItemDefinition,
  defB: ItemDefinition,
): string {
  const aBase = a.replace(/^(A|An|The) /i, "");
  const bBase = b.replace(/^(A|An|The) /i, "");
  
  // Get primary categories
  const aCat = defA.categories[0];
  const bCat = defB.categories[0];
  
  // Use hash for deterministic selection
  const h = strHash(`${aBase}+${bBase}`);
  
  // Try different naming strategies
  const strategies = [
    // Strategy 1: Prefix from A, root from B
    () => {
      const prefix = getPrefixForCategory(aCat, h);
      return prefix ? `${prefix} ${bBase}` : bBase;
    },
    // Strategy 2: Root from A, suffix from B
    () => {
      const suffix = getSuffixForCategory(bCat, h);
      return suffix ? `${aBase} ${suffix}` : `${aBase} ${bBase}`;
    },
    // Strategy 3: Combined
    () => {
      const prefix = getPrefixForCategory(aCat, h + 1);
      const suffix = getSuffixForCategory(bCat, h + 2);
      return prefix && suffix 
        ? `${prefix} ${aBase} ${suffix}`
        : prefix 
          ? `${prefix} ${aBase}${suffix}`
          : suffix 
            ? `${aBase} ${suffix}`
            : `${aBase}${bBase}`;
    },
  ];
  
  // Select strategy based on hash
  const strategy = strategies[h % strategies.length];
  let name = strategy();
  
  // Capitalize properly
  name = name
    .split(/[\s-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  
  return name;
}

function getPrefixForCategory(cat: SemanticCategory, seed: number): string | null {
  const prefixes = COMPOUND_PREFIXES[cat];
  if (!prefixes || prefixes.length === 0) return null;
  return prefixes[seed % prefixes.length] || null;
}

function getSuffixForCategory(cat: SemanticCategory, seed: number): string | null {
  const suffixes = COMPOUND_SUFFIXES[cat];
  if (!suffixes || suffixes.length === 0) return null;
  return suffixes[seed % suffixes.length] || null;
}

// Specific combination generators
function fireCombination(a: string, b: string): string {
  const fireWords = ["Flame", "Fire", "Burning", "Scorched", "Blazing", "Searing"];
  const targetWords = ["Water", "Earth", "Air", "Stone", "Wood", "Metal"];
  
  const h = strHash(`${a}+${b}`);
  
  if (b.includes("Water") || b.includes("Rain") || b.includes("Ice")) {
    return "Steam";
  }
  if (b.includes("Earth") || b.includes("Stone") || b.includes("Rock")) {
    return h % 2 === 0 ? "Lava" : "Magma";
  }
  if (b.includes("Air") || b.includes("Wind") || b.includes("Storm")) {
    return h % 2 === 0 ? "Lightning" : "Plasma";
  }
  
  return `${fireWords[h % fireWords.length]} ${b}`;
}

function naturalFormation(a: string, b: string): string {
  const h = strHash(`${a}+${b}`);
  const formations = ["Formation", "Structure", "Landform", "Feature", "Phenomenon"];
  return `${a} ${formations[h % formations.length]}`;
}

function celestialCombination(a: string, b: string): string {
  const h = strHash(`${a}+${b}`);
  const endings = ["Alignment", "Conjunction", "Phenomenon", "Event", "Occurrence"];
  return `${a} ${b} ${endings[h % endings.length]}`;
}

function timeCombination(a: string, b: string): string {
  const h = strHash(`${a}+${b}`);
  const prefixes = ["Ancient", "Eternal", "Timeless", "Enduring", "Permanent"];
  return `${prefixes[h % prefixes.length]} ${b}`;
}

// ============================================================================
// EMOJI SELECTION
// ============================================================================

/**
 * Generate emojis from two item definitions (2-4 max)
 */
function generateEmojis(defA: ItemDefinition, defB: ItemDefinition, key: string): [string, string?] {
  const aEmojis = collectAllEmojis(defA);
  const bEmojis = collectAllEmojis(defB);
  
  // Check for direct logical combination
  if (LOGICAL_COMBINATIONS.has(key)) {
    return LOGICAL_COMBINATIONS.get(key)!.emojis;
  }
  
  // Select best emojis from both parents
  const selected = selectBestEmojis(aEmojis, bEmojis, 4);
  
  // Ensure we have at least 1, at most 2
  if (selected.length === 0) {
    return ["✨"];
  }
  if (selected.length === 1) {
    return [selected[0]];
  }
  return [selected[0], selected[1]];
}

/**
 * Collect all emojis from an item definition
 */
function collectAllEmojis(def: ItemDefinition): string[] {
  const emojis = [def.primaryEmoji];
  if (def.secondaryEmojis) {
    emojis.push(...def.secondaryEmojis);
  }
  return emojis;
}

/**
 * Select the best emojis from two sets (max 4 total)
 */
function selectBestEmojis(aEmojis: string[], bEmojis: string[], maxCount: number = 4): string[] {
  // Combine and deduplicate
  const all = [...new Set([...aEmojis, ...bEmojis])];
  
  // Limit to max count
  if (all.length <= maxCount) {
    return all;
  }
  
  // Use hash for deterministic selection
  const h = strHash(all.join(""));
  
  // Sort by visual importance (primary emojis first)
  const aPrimary = aEmojis[0];
  const bPrimary = bEmojis[0];
  const rest = all.filter(e => e !== aPrimary && e !== bPrimary);
  
  // Always include primary emojis if space allows
  const selected = [aPrimary, bPrimary].filter(Boolean);
  
  // Fill remaining slots from rest
  for (let i = 0; i < maxCount - selected.length && i < rest.length; i++) {
    selected.push(rest[(h + i) % rest.length]);
  }
  
  return selected.slice(0, maxCount);
}

// ============================================================================
// DETERMINISTIC CACHING
// ============================================================================

/**
 * Cache for generated craft results
 * Ensures same inputs always produce same outputs
 */
const craftCache = new Map<string, CraftResult>();

/**
 * Clear the craft cache
 */
export function clearCraftCache(): void {
  craftCache.clear();
}

/**
 * Check if a combination has been cached
 */
export function getCachedCraft(a: string, b: string): CraftResult | null {
  const key = [a, b].sort().join("+");
  return craftCache.get(key) || null;
}

// ============================================================================
// EXPORTED UTILITIES
// ============================================================================

export { GENESIS_ITEMS, LOGICAL_COMBINATIONS };
export type { ItemDefinition, SemanticCategory };
