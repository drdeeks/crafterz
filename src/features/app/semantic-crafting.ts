// Crafting engine v2 — see crafting-engine.ts for the real implementation.
// This file is kept as a re-export for backward compatibility.
export {
  craft,
  isGenesisItem,
  getGenesisItem,
  GENESIS_ITEMS,
  getAllRecipeNames,
  getCraftablePairs,
} from './crafting-engine';
export type { CraftedItem, GenesisItem, ItemTier } from './crafting-engine';
