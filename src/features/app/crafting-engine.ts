/**
 * Crafting Engine v2
 * 
 * Deterministic, semantic-based crafting system.
 * Same two items always produce the same result.
 * No hardcoded combinations - results are generated logically.
 */

import { semanticCraft as doSemanticCraft, CraftResult, clearCraftCache, getCachedCraft, GENESIS_ITEMS, LOGICAL_COMBINATIONS } from "./semantic-crafting";
import { strHash as sharedStrHash } from "@/lib/utils";

// Re-export from semantic crafting
export { GENESIS_ITEMS, LOGICAL_COMBINATIONS, clearCraftCache, getCachedCraft };
export type { CraftResult, ItemDefinition as CraftedItem } from "./semantic-crafting";

/**
 * Main craft simulation function
 * Uses semantic analysis to generate results deterministically
 */
export function simulateCraft(
  nameA: string,
  nameB: string,
  globalRegistry: Set<string> = new Set(),
): CraftResult {
  return doSemanticCraft(nameA, nameB, globalRegistry);
}

/**
 * Simple hash function for determinism
 */
export function strHash(s: string): number {
  return sharedStrHash(s);
}

/**
 * Get all genesis item names
 */
export function getGenesisItemNames(): string[] {
  return Object.keys(GENESIS_ITEMS);
}

/**
 * Get genesis item definition by name
 */
export function getGenesisItem(name: string) {
  return GENESIS_ITEMS[name.toLowerCase().trim()] || null;
}

/**
 * Check if an item is a genesis item
 */
export function isGenesisItem(name: string): boolean {
  return getGenesisItem(name) !== null;
}
