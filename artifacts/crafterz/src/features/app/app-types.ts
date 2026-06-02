import type { ServerTask } from './runtime-api';

export type AppInventoryTier = 'GENESIS' | 'COMMON' | 'RARE' | 'LEGENDARY';

export interface AppInventoryItem {
  uid: string;
  id: string;
  name: string;
  emoji: string;
  tier: AppInventoryTier;
  generation: number;
  isMegaMind?: boolean;
  isMinted?: boolean;
  tokenId?: number;
  txHash?: string;
  recipe?: string;
}

export interface AppCanvasItem {
  instanceId: string;
  id: string;
  name: string;
  emoji: string;
  tier: string;
  generation: number;
  isMegaMind?: boolean;
  x: number;
  y: number;
  isDragging?: boolean;
}

export type AppDailyTask = Omit<ServerTask, 'updatedAt'> & {
  updatedAt?: string;
};
export type AppDailyTaskType = ServerTask['type'];

export type AppTab = 'inventory' | 'megaminds' | 'tasks' | 'leaderboard' | 'feed' | 'agents' | 'admin';
export type AppMintPhase = 'prompt' | 'signing' | 'confirming' | 'done';

export type EvmChainOption = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type LeaderboardRow = {
  username: string;
  pfp: string;
  points: number;
  megaMinds: number;
  crafts: number;
  rank: number;
  isCurrentUser: boolean;
};

export type PointsConfig = {
  CRAFT_COMMON: number;
  CRAFT_RARE: number;
  CRAFT_LEGENDARY: number;
  MEGAMIND_BONUS: number;
  MINT_MEGAMIND: number;
  GM_ONCHAIN: number;
};

export type AdminStats = {
  totalWords: number;
  totalPlayers: number;
  totalCrafts: number;
  megaMindsDiscovered: number;
  megaMindsMinted: number;
  craftzCirculating: number;
  contractBalance: string;
};
