import { readJson, writeJson } from "@/server/kv-store";
import { checkX402Payment, isTestnetMode } from "@/lib/x402";
import { createPublicClient, http, type Hash, type Address } from "viem";
import { base, mainnet, arbitrum, optimism, polygon } from "viem/chains";

// Map of supported chain IDs to viem chain objects
const CHAIN_MAP: Record<number, typeof base> = {
  1: mainnet,
  8453: base,
  84532: base, // Base Sepolia uses same config
  42161: arbitrum,
  10: optimism,
  137: polygon,
};

/**
 * Verify a transaction exists on-chain and was sent from the specified address
 */
async function verifyTransactionOnChain(
  txHash: string,
  chainId: number,
  expectedAddress: Address | string,
): Promise<boolean> {
  // In development/test mode, skip actual verification for testing
  // but log a warning so it's clear this is bypassed
  if (isTestnetMode() || process.env.NODE_ENV === "development") {
    console.warn(
      `[SECURITY] Transaction verification bypassed in dev mode. ` +
      `txHash: ${txHash}, chainId: ${chainId}, address: ${expectedAddress}`
    );
    // Still do basic format validation
    if (!txHash || !txHash.startsWith("0x") || txHash.length !== 66) {
      return false;
    }
    return true;
  }

  // Production: Verify the transaction on-chain
  try {
    const chain = CHAIN_MAP[chainId];
    if (!chain) {
      console.error(`Unsupported chain ID: ${chainId}`);
      return false;
    }

    const client = createPublicClient({
      chain,
      transport: http(),
    });

    const tx = await client.getTransaction({
      hash: txHash as `0x${string}`,
    });

    if (!tx) {
      console.error(`Transaction not found: ${txHash}`);
      return false;
    }

    const normalizedExpected = expectedAddress.toLowerCase();
    const normalizedActual = tx.from.toLowerCase();

    if (normalizedActual !== normalizedExpected) {
      console.error(
        `Transaction address mismatch. ` +
        `Expected: ${normalizedExpected}, Actual: ${normalizedActual}`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Transaction verification failed:`, error);
    return false;
  }
}

/**
 * Map chain string to chain ID
 */
function mapChainStringToId(chain: string): number | null {
  const chainMap: Record<string, number> = {
    "base": 8453,
    "ethereum": 1,
    "mainnet": 1,
    "optimism": 10,
    "arbitrum": 42161,
    "polygon": 137,
    "zora": 7777777,
    "solana": 0, // Not EVM
  };
  return chainMap[chain.toLowerCase()] || null;
}

type ItemTier = "COMMON" | "RARE" | "LEGENDARY";

type ActivityType = "craft" | "mint" | "gm" | "x40_payment";

// Agent types supported
export type AgentID = string | number;
export type AgentType = "farcaster" | "x40" | "ens" | "solana" | string;

type DailyTaskType =
  | "gm_onchain"
  | "craft_target"
  | "mint_megamind"
  | "craft_count"
  | "craft_rare"
  | "craft_legendary"
  | "craft_combo_chain"
  | "discover_new";

type TaskTarget = {
  name: string;
  hint: string;
  emojis: [string, string?];
};

const TASK_TARGET_POOL: TaskTarget[] = [
  { name: "Lava", hint: "Formed when earth meets fire", emojis: ["🌋", "🔴"] },
  { name: "Steam", hint: "What fire does to water", emojis: ["🌫️", "💨"] },
  {
    name: "Fossil",
    hint: "Earth preserves things over time",
    emojis: ["🦴", "🪨"],
  },
  { name: "Tide", hint: "The moon pulls the ocean", emojis: ["🌊", "🌙"] },
  {
    name: "Aurora",
    hint: "Air and sunlight in the sky",
    emojis: ["🌌", "🌈"],
  },
  {
    name: "Eclipse",
    hint: "Two celestial bodies aligned",
    emojis: ["🌘", "☀️"],
  },
  {
    name: "Sundial",
    hint: "An ancient timekeeper",
    emojis: ["🕰️", "☀️"],
  },
  {
    name: "Howl",
    hint: "A sound that fills the night air",
    emojis: ["🐺", "🌙"],
  },
];

const STORAGE_KEYS = {
  leaderboard: "craftz:leaderboard:v1",
  activity: "craftz:activity:v1",
  // New format for agent-agnostic storage
  leaderboardV2: "craftz:leaderboard:v2",
  activityV2: "craftz:activity:v2",
} as const;

const MAX_ACTIVITY_ITEMS = 300;

// Exported types for use across the application

const PTS = {
  CRAFT_COMMON: 2,
  CRAFT_RARE: 5,
  CRAFT_LEGENDARY: 15,
  MEGAMIND_BONUS: 15,
  MINT_MEGAMIND: 25,
  GM_ONCHAIN: 10,
} as const;

// Unified player stats using agent ID
export type PlayerStats = {
  agentId: string; // String representation for consistency (FID as string or address)
  agentType: AgentType;
  username?: string;
  address?: string; // EVM address for X402 payments
  fid?: number; // Farcaster FID if applicable
  points: number;
  crafts: number;
  megaMinds: number;
  minted: number;
  gmCount: number;
  x402Spent: bigint; // Total X402 spent in-game (tracked as bigint string in JSON)
  lastUpdatedAt: string;
};

// Helper to create agent ID string from various inputs
export function normalizeAgentId(fidOrAddress: AgentID, agentType: AgentType): string {
  if (agentType === "farcaster") {
    // For Farcaster, prefix with fid: to distinguish from addresses
    const fid = typeof fidOrAddress === "number" ? fidOrAddress : parseInt(fidOrAddress);
    if (!Number.isFinite(fid)) {
      // If it's a string that's not a number, use as-is (might be username)
      return `user:${fidOrAddress}`;
    }
    return `fid:${fid}`;
  }
  // For other agent types, use the address/ID directly (ensure it's lowercase)
  const addr = typeof fidOrAddress === "string" ? fidOrAddress.toLowerCase() : String(fidOrAddress).toLowerCase();
  return `${agentType}:${addr}`;
}

// Legacy helper for backward compatibility with existing FID-based data
export function createLegacyPlayerStats(fid: number, username?: string): PlayerStats {
  return {
    agentId: `fid:${fid}`,
    agentType: "farcaster",
    fid,
    username,
    points: 0,
    crafts: 0,
    megaMinds: 0,
    minted: 0,
    gmCount: 0,
    x402Spent: 0n,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export type ActivityEvent = {
  id: string;
  type: ActivityType;
  agentId: string;
  agentType: AgentType;
  username?: string;
  address?: string;
  fid?: number;
  pointsAwarded: number;
  x402Amount?: bigint; // X402 spent in this event
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type DailyTask = {
  id: string;
  type: DailyTaskType;
  title: string;
  description: string;
  icon: string;
  points: number;
  xpReward: number;
  craftzReward: number;
  required: number;
  progress: number;
  completed: boolean;
  claimedAt?: number;
  targetItem?: string;
  targetHint?: string;
  targetEmojis?: [string, string?];
  updatedAt: string;
};

type LeaderboardStore = Record<string, PlayerStats>;

function toDateKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function strHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function pointsForTier(tier: ItemTier) {
  switch (tier) {
    case "RARE":
      return PTS.CRAFT_RARE;
    case "LEGENDARY":
      return PTS.CRAFT_LEGENDARY;
    default:
      return PTS.CRAFT_COMMON;
  }
}

function normalizeUsername(agentId: string, username?: string): string {
  if (username && username.trim().length > 0) {
    return username.trim();
  }
  return agentId;
}

function createDefaultPlayer(
  agentId: AgentID,
  agentType: AgentType,
  username?: string,
  address?: string,
  fid?: number,
): PlayerStats {
  const id = normalizeAgentId(agentId, agentType);
  return {
    agentId: id,
    agentType,
    username: normalizeUsername(id, username),
    address,
    fid,
    points: 0,
    crafts: 0,
    megaMinds: 0,
    minted: 0,
    gmCount: 0,
    x402Spent: 0n,
    lastUpdatedAt: new Date().toISOString(),
  };
}

// Legacy compatibility - convert old FID-only to new format
export function convertLegacyPlayer(oldPlayer: {
  fid: number;
  username: string;
  points: number;
  crafts: number;
  megaMinds: number;
  minted: number;
  gmCount: number;
  lastUpdatedAt: string;
}): PlayerStats {
  return {
    agentId: `fid:${oldPlayer.fid}`,
    agentType: "farcaster",
    fid: oldPlayer.fid,
    username: oldPlayer.username,
    points: oldPlayer.points,
    crafts: oldPlayer.crafts,
    megaMinds: oldPlayer.megaMinds,
    minted: oldPlayer.minted,
    gmCount: oldPlayer.gmCount,
    x402Spent: 0n,
    lastUpdatedAt: oldPlayer.lastUpdatedAt,
  };
}

function activityId(prefix: ActivityType, fid: number) {
  return `${prefix}-${fid}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function getLeaderboardStore(): Promise<Record<string, PlayerStats>> {
  // Try new format first
  const newStore = await readJson<Record<string, PlayerStats>>(STORAGE_KEYS.leaderboardV2);
  if (newStore && Object.keys(newStore).length > 0) {
    return newStore;
  }
  
  // Fallback to old format and migrate
  const oldStore = await readJson<Record<string, {
    fid: number;
    username: string;
    points: number;
    crafts: number;
    megaMinds: number;
    minted: number;
    gmCount: number;
    lastUpdatedAt: string;
  }>>(STORAGE_KEYS.leaderboard);
  
  if (oldStore && Object.keys(oldStore).length > 0) {
    // Migrate old format to new
    const migrated: Record<string, PlayerStats> = {};
    for (const [key, oldPlayer] of Object.entries(oldStore)) {
      migrated[key] = convertLegacyPlayer(oldPlayer);
    }
    // Save migrated data
    await writeJson(STORAGE_KEYS.leaderboardV2, migrated);
    return migrated;
  }
  
  return {};
}

async function saveLeaderboardStore(store: Record<string, PlayerStats>) {
  // Save to both old and new formats for backward compatibility
  // First, convert back to old format
  const oldFormatStore: Record<string, any> = {};
  for (const [key, player] of Object.entries(store)) {
    oldFormatStore[key] = {
      fid: player.fid || 0,
      username: player.username || "",
      points: player.points,
      crafts: player.crafts,
      megaMinds: player.megaMinds,
      minted: player.minted,
      gmCount: player.gmCount,
      lastUpdatedAt: player.lastUpdatedAt,
    };
  }
  
  await writeJson(STORAGE_KEYS.leaderboard, oldFormatStore);
  
  // For v2, we need to serialize bigint
  const serializableStore: Record<string, any> = {};
  for (const [key, player] of Object.entries(store)) {
    serializableStore[key] = {
      ...player,
      x402Spent: player.x402Spent.toString(),
    };
  }
  
  await writeJson(STORAGE_KEYS.leaderboardV2, serializableStore);
}

async function pushActivity(event: ActivityEvent) {
  // Try to push to both v1 and v2 formats
  const currentV1 = (await readJson<ActivityEvent[]>(STORAGE_KEYS.activity)) ?? [];
  await writeJson(STORAGE_KEYS.activity, [event, ...currentV1].slice(0, MAX_ACTIVITY_ITEMS));
  
  const currentV2 = (await readJson<ActivityEvent[]>(STORAGE_KEYS.activityV2)) ?? [];
  await writeJson(STORAGE_KEYS.activityV2, [event, ...currentV2].slice(0, MAX_ACTIVITY_ITEMS));
}

// Remove old LeaderboardStore type if it existed
async function updatePlayer(
  agentId: AgentID,
  agentType: AgentType,
  username: string | undefined,
  address: string | undefined,
  fid: number | undefined,
  mutator: (player: PlayerStats) => void,
) {
  const store = await getLeaderboardStore();
  const key = normalizeAgentId(agentId, agentType);
  const player = store[key] ?? createDefaultPlayer(agentId, agentType, username, address, fid);

  player.username = normalizeUsername(player.agentId, username || player.username);
  // Update address/fid if provided
  if (address && !player.address) player.address = address;
  if (fid && !player.fid) player.fid = fid;
  
  mutator(player);
  player.lastUpdatedAt = new Date().toISOString();

  store[key] = player;
  await saveLeaderboardStore(store);

  return player;
}

export interface LeaderboardPlayer extends PlayerStats {
  rank: number;
}

export async function getLeaderboard(limit = 50): Promise<LeaderboardPlayer[]> {
  const store = await getLeaderboardStore();
  const sorted = Object.values(store).sort((a, b) => b.points - a.points);
  return sorted.slice(0, Math.max(1, Math.min(limit, 100))).map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
}

export async function getRecentActivity(limit = 25, type?: ActivityType) {
  // Try new format first
  const eventsV2 = (await readJson<ActivityEvent[]>(STORAGE_KEYS.activityV2)) ?? [];
  if (eventsV2.length > 0) {
    const filtered = type ? eventsV2.filter((event) => event.type === type) : eventsV2;
    return filtered.slice(0, Math.max(1, Math.min(limit, 100)));
  }
  
  // Fallback to old format
  const events = (await readJson<ActivityEvent[]>(STORAGE_KEYS.activity)) ?? [];
  const filtered = type ? events.filter((event) => event.type === type) : events;
  return filtered.slice(0, Math.max(1, Math.min(limit, 100)));
}

export async function recordCraft(input: {
  agentId: AgentID;
  agentType: AgentType;
  username?: string;
  address?: string;
  fid?: number;
  itemName: string;
  tier?: ItemTier;
  ingredients?: string[];
  emojis?: string[];
  isMegaMind?: boolean;
  pointsAwarded?: number;
  x402Amount?: bigint; // X402 spent on this craft
  chainId?: number; // Chain where X402 payment was made
  txHash?: string; // Transaction hash for X402 payment
  x402Data?: Record<string, unknown>; // X402 protocol-specific data
}) {
  const tier = input.tier ?? "COMMON";
  const awardedPoints =
    input.pointsAwarded ??
    pointsForTier(tier) + (input.isMegaMind ? PTS.MEGAMIND_BONUS : 0);
  
  // Track X402 payment data if provided
  // Note: With x402 middleware enabled, payment is verified by the middleware before reaching here
  // We just track the data for analytics
  let x402Verified = false;
  let x402Amount = input.x402Amount || 0n;
  let finalX402Amount = 0n;
  
  // If x402 data is present, track it
  if (input.txHash && input.chainId && input.address) {
    const address = input.address;
    if (typeof address !== "number") {
          // Verify the transaction was sent from the claimed address

          const txVerified = await verifyTransactionOnChain(

            input.txHash,

            input.chainId,

            address as `0x${string}`,

          );

          

          if (txVerified) {

            // Additional X402-specific verification

            x402Verified = await checkX402Payment(

              input.txHash,

              input.chainId,

              x402Amount,

              address as `0x${string}`,

              input.x402Data,

            );

            finalX402Amount = x402Verified ? x402Amount : 0n;

          }
    }
  }

  const player = await updatePlayer(
    input.agentId,
    input.agentType,
    input.username,
    input.address,
    input.fid,
    (current) => {
      current.crafts += 1;
      current.points += awardedPoints;
      if (input.isMegaMind) {
        current.megaMinds += 1;
      }
      if (finalX402Amount > 0) {
        current.x402Spent += finalX402Amount;
      }
    }
  );

  await pushActivity({
    id: activityIdV2("craft", input.agentId, input.agentType),
    type: "craft",
    agentId: player.agentId,
    agentType: player.agentType,
    username: player.username,
    address: player.address,
    fid: player.fid,
    pointsAwarded: awardedPoints,
    x402Amount: finalX402Amount > 0 ? finalX402Amount : undefined,
    timestamp: new Date().toISOString(),
    metadata: {
      itemName: input.itemName,
      tier,
      ingredients: input.ingredients ?? [],
      emojis: input.emojis ?? [],
      isMegaMind: Boolean(input.isMegaMind),
      x402Paid: x402Verified,
      chainId: input.chainId,
      txHash: input.txHash,
      x402Protocol: input.x402Data ? "X402" : undefined,
    },
  });

  return { player, awardedPoints };
}

// Helper for activity ID with agent type
function activityIdV2(prefix: ActivityType, agentId: AgentID, agentType: AgentType) {
  const id = normalizeAgentId(agentId, agentType);
  return `${prefix}-${id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function recordMint(input: {
  agentId: AgentID;
  agentType: AgentType;
  username?: string;
  address?: string;
  fid?: number;
  itemName: string;
  tokenId?: number;
  txHash?: string;
  chainId?: number;
  x402Amount?: bigint;
  x402Data?: Record<string, unknown>;
}) {
  const awardedPoints = PTS.MINT_MEGAMIND;
  
  // Track X402 payment data if provided
  // Note: With x402 middleware enabled, payment is verified by the middleware before reaching here
  let x402Verified = false;
  let x402Amount = input.x402Amount || 0n;
  let finalX402Amount = 0n;
  
  // If x402 data is present, track it
  if (input.txHash && input.chainId && input.address) {
    const address = input.address;
    if (typeof address !== "number") {
          // Verify the transaction was sent from the claimed address

          const txVerified = await verifyTransactionOnChain(

            input.txHash,

            input.chainId,

            address as `0x${string}`,

          );

          

          if (txVerified) {

            // Additional X402-specific verification

            x402Verified = await checkX402Payment(

              input.txHash,

              input.chainId,

              x402Amount,

              address as `0x${string}`,

              input.x402Data,

            );

            finalX402Amount = x402Verified ? x402Amount : 0n;

          }
    }
  }

  const player = await updatePlayer(
    input.agentId,
    input.agentType,
    input.username,
    input.address,
    input.fid,
    (current) => {
      current.minted += 1;
      current.points += awardedPoints;
      if (finalX402Amount > 0) {
        current.x402Spent += finalX402Amount;
      }
    }
  );

  await pushActivity({
    id: activityIdV2("mint", input.agentId, input.agentType),
    type: "mint",
    agentId: player.agentId,
    agentType: player.agentType,
    username: player.username,
    address: player.address,
    fid: player.fid,
    pointsAwarded: awardedPoints,
    x402Amount: finalX402Amount > 0 ? finalX402Amount : undefined,
    timestamp: new Date().toISOString(),
    metadata: {
      itemName: input.itemName,
      tokenId: input.tokenId,
      txHash: input.txHash,
      chainId: input.chainId,
      x402Paid: x402Verified,
      x402Protocol: input.x402Data ? "X402" : undefined,
    },
  });

  return { player, awardedPoints };
}

export async function recordGm(input: {
  agentId: AgentID;
  agentType: AgentType;
  username?: string;
  address?: string;
  fid?: number;
  chain: string;
  txHash?: string;
  chainId?: number;
  x402Amount?: bigint;
  x402Data?: Record<string, unknown>;
}) {
  const awardedPoints = PTS.GM_ONCHAIN;
  
  // Track X402 payment data if provided
  // Note: With x402 middleware enabled, payment is verified by the middleware before reaching here
  let x402Verified = false;
  let x402Amount = input.x402Amount || 0n;
  let effectiveChainId = input.chainId || mapChainStringToId(input.chain);
  let finalX402Amount = 0n;
  
  // If x402 data is present, track it
  if (input.txHash && effectiveChainId && input.address) {
    const address = input.address;
    if (typeof address !== "number") {
      // Verify the transaction was sent from the claimed address
      const txVerified = await verifyTransactionOnChain(
        input.txHash,
        effectiveChainId,
        address as `0x${string}`,
      );
      
      if (txVerified) {
        // Additional X402-specific verification
        x402Verified = await checkX402Payment(
          input.txHash,
          effectiveChainId,
          x402Amount,
          address as `0x${string}`,
          input.x402Data,
        );
        finalX402Amount = x402Verified ? x402Amount : 0n;
      }
    }
  }

  const player = await updatePlayer(
    input.agentId,
    input.agentType,
    input.username,
    input.address,
    input.fid,
    (current) => {
      current.gmCount += 1;
      current.points += awardedPoints;
      if (finalX402Amount > 0) {
        current.x402Spent += finalX402Amount;
      }
    }
  );

  await pushActivity({
    id: activityIdV2("gm", input.agentId, input.agentType),
    type: "gm",
    agentId: player.agentId,
    agentType: player.agentType,
    username: player.username,
    address: player.address,
    fid: player.fid,
    pointsAwarded: awardedPoints,
    x402Amount: finalX402Amount > 0 ? finalX402Amount : undefined,
    timestamp: new Date().toISOString(),
    metadata: {
      chain: input.chain,
      chainId: effectiveChainId,
      txHash: input.txHash,
      x402Paid: x402Verified,
      x402Protocol: input.x402Data ? "X402" : undefined,
    },
  });

  return { player, awardedPoints };
}

function taskStorageKey(agentId: string, dateKey = toDateKey()) {
  return `craftz:tasks:v2:${dateKey}:${agentId}`;
}

function createDailyTasks(agentId: string, dateKey = toDateKey()): DailyTask[] {
  const seed = strHash(`${agentId}-${dateKey}`);
  const craftGoal = [3, 5, 7, 10][seed % 4];
  const target = TASK_TARGET_POOL[seed % TASK_TARGET_POOL.length];

  const now = new Date().toISOString();

  return [
    {
      id: "task-gm",
      type: "gm_onchain",
      title: "Send GM On-Chain",
      description: "Send one GM transaction on any supported chain.",
      icon: "🌅",
      points: PTS.GM_ONCHAIN,
      xpReward: 50,
      craftzReward: 10,
      required: 1,
      progress: 0,
      completed: false,
      updatedAt: now,
    },
    {
      id: "task-target",
      type: "craft_target",
      title: "Today's Mystery Craft",
      description:
        "Figure out how to craft this specific item using the hint below.",
      icon: "🔮",
      points: 20,
      xpReward: 100,
      craftzReward: 20,
      required: 1,
      progress: 0,
      completed: false,
      targetItem: target.name,
      targetHint: target.hint,
      targetEmojis: target.emojis,
      updatedAt: now,
    },
    {
      id: "task-crafts",
      type: "craft_count",
      title: `Craft ${craftGoal} Items`,
      description: `Complete ${craftGoal} valid crafts today.`,
      icon: "⚗️",
      points: craftGoal * 2,
      xpReward: craftGoal * 10,
      craftzReward: craftGoal * 3,
      required: craftGoal,
      progress: 0,
      completed: false,
      updatedAt: now,
    },
    {
      id: "task-rare",
      type: "craft_rare",
      title: "Craft Something Rare+",
      description: "Produce at least one RARE or LEGENDARY item today.",
      icon: "💫",
      points: 15,
      xpReward: 75,
      craftzReward: 15,
      required: 1,
      progress: 0,
      completed: false,
      updatedAt: now,
    },
    {
      id: "task-legendary",
      type: "craft_legendary",
      title: "Forge a Legend",
      description: "Discover or craft any LEGENDARY tier item.",
      icon: "👑",
      points: 30,
      xpReward: 150,
      craftzReward: 25,
      required: 1,
      progress: 0,
      completed: false,
      updatedAt: now,
    },
    {
      id: "task-megamind",
      type: "mint_megamind",
      title: "Mint a MegaMind",
      description: "Mint any MegaMind NFT from your collection.",
      icon: "⚡",
      points: 40,
      xpReward: 200,
      craftzReward: 30,
      required: 1,
      progress: 0,
      completed: false,
      updatedAt: now,
    },
    {
      id: "task-discover",
      type: "discover_new",
      title: "Achieve a MegaMind",
      description:
        "Be the first player globally to craft an item that has never existed before.",
      icon: "🌐",
      points: 50,
      xpReward: 250,
      craftzReward: 50,
      required: 1,
      progress: 0,
      completed: false,
      updatedAt: now,
    },
  ];
}

export async function getDailyTasks(
  agentId: AgentID,
  agentType: AgentType,
  dateKey = toDateKey(),
) {
  const normalizedAgentId = normalizeAgentId(agentId, agentType);
  const key = taskStorageKey(normalizedAgentId, dateKey);
  const existing = await readJson<DailyTask[]>(key);
  if (existing && existing.length > 0) {
    return existing;
  }

  const generated = createDailyTasks(normalizedAgentId, dateKey);
  await writeJson(key, generated);

  return generated;
}

export async function updateDailyTask(input: {
  agentId: AgentID;
  agentType: AgentType;
  taskId: string;
  action: "progress" | "complete";
  amount?: number;
  dateKey?: string;
}) {
  const dateKey = input.dateKey ?? toDateKey();
  const normalizedAgentId = normalizeAgentId(input.agentId, input.agentType);
  const key = taskStorageKey(normalizedAgentId, dateKey);
  const tasks = await getDailyTasks(input.agentId, input.agentType, dateKey);

  const nextTasks = tasks.map((task) => {
    if (task.id !== input.taskId) {
      return task;
    }

    if (input.action === "complete") {
      return {
        ...task,
        completed: true,
        progress: task.required,
        claimedAt: Date.now(),
        updatedAt: new Date().toISOString(),
      };
    }

    const amount = input.amount ?? 1;
    const progress = Math.min(task.required, task.progress + amount);

    return {
      ...task,
      progress,
      completed: progress >= task.required,
      updatedAt: new Date().toISOString(),
    };
  });

  await writeJson(key, nextTasks);

  return {
    tasks: nextTasks,
    task: nextTasks.find((task) => task.id === input.taskId) ?? null,
  };
}
