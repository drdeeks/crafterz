import type { AppInventoryItem, EvmChainOption } from './app-types';

export const PTS = {
  CRAFT_COMMON:    2,
  CRAFT_RARE:      5,
  CRAFT_LEGENDARY: 15,
  MEGAMIND_BONUS:  15,
  MINT_MEGAMIND:   25,
  GM_ONCHAIN:      10,
  TASK_COMPLETE:   0,
} as const;

export const EVM_CHAINS: EvmChainOption[] = [
  { id: 'base',     name: 'Base',     icon: '🔵', color: '#0052FF' },
  { id: 'ethereum', name: 'Ethereum', icon: '⟠',  color: '#627EEA' },
  { id: 'optimism', name: 'Optimism', icon: '🔴',  color: '#FF0420' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔷',  color: '#28A0F0' },
  { id: 'polygon',  name: 'Polygon',  icon: '🟣',  color: '#8247E5' },
  { id: 'zora',     name: 'Zora',     icon: '⚡',  color: '#A855F7' },
];

export const INITIAL_INVENTORY: AppInventoryItem[] = [
  { uid: 'u-water', id: 'water', name: 'Water', emoji: '💧', tier: 'GENESIS', generation: 0 },
  { uid: 'u-fire',  id: 'fire',  name: 'Fire',  emoji: '🔥', tier: 'GENESIS', generation: 0 },
  { uid: 'u-earth', id: 'earth', name: 'Earth', emoji: '🌍', tier: 'GENESIS', generation: 0 },
  { uid: 'u-air',   id: 'air',   name: 'Air',   emoji: '💨', tier: 'GENESIS', generation: 0 },
  { uid: 'u-sun',   id: 'sun',   name: 'Sun',   emoji: '☀️', tier: 'GENESIS', generation: 0 },
  { uid: 'u-moon',  id: 'moon',  name: 'Moon',  emoji: '🌙', tier: 'GENESIS', generation: 0 },
  { uid: 'u-time',  id: 'time',  name: 'Time',  emoji: '⏳', tier: 'GENESIS', generation: 0 },
];

export const TARGET_POOL: Array<{ name: string; hint: string; emoji: string }> = [
  { name: 'Lava',    hint: 'Formed when earth meets fire',     emoji: '🌋' },
  { name: 'Steam',   hint: 'What fire does to water',          emoji: '💨' },
  { name: 'Fossil',  hint: 'Earth preserves things over time', emoji: '🦴' },
  { name: 'Tide',    hint: 'The moon pulls the ocean',         emoji: '🌊' },
  { name: 'Eclipse', hint: 'Two celestial bodies aligned',     emoji: '🌘' },
  { name: 'Plasma',  hint: 'Air superheated by fire',          emoji: '⚡' },
  { name: 'Rainbow', hint: 'Sunlight through water droplets',  emoji: '🌈' },
  { name: 'Ice',     hint: 'Water frozen by time',             emoji: '🧊' },
];

export const TIER_BADGE: Record<string, string> = {
  GENESIS:   'bg-purple-500/15 text-purple-300 border border-purple-500/25',
  COMMON:    'bg-zinc-700/50 text-zinc-400 border border-zinc-600/40',
  RARE:      'bg-blue-500/15 text-blue-300 border border-blue-500/25',
  LEGENDARY: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
};

export const CRAFTZ_MAX  = 100;
export const CRAFTZ_COST = 5;
export const CRAFTZ_REGEN_MS = 2500;
