import { readJson, writeJson } from "./kv-store.js";

export type AgentType = "farcaster" | "x40" | "ens" | "solana" | string;
export type AgentID = string | number;
type ItemTier = "COMMON" | "RARE" | "LEGENDARY";
type ActivityType = "craft" | "mint" | "gm" | "x40_payment";

const PTS = {
  CRAFT_COMMON: 2,
  CRAFT_RARE: 5,
  CRAFT_LEGENDARY: 15,
  MEGAMIND_BONUS: 15,
  MINT_MEGAMIND: 25,
  GM_ONCHAIN: 10,
} as const;

export type PlayerStats = {
  agentId: string;
  agentType: AgentType;
  username?: string;
  address?: string;
  fid?: number;
  points: number;
  crafts: number;
  megaMinds: number;
  minted: number;
  gmCount: number;
  x402Spent: string;
  lastUpdatedAt: string;
};

export type ActivityEvent = {
  id: string;
  type: ActivityType;
  agentId: string;
  agentType: AgentType;
  username?: string;
  address?: string;
  fid?: number;
  pointsAwarded: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type DailyTask = {
  id: string;
  type: string;
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

const STORAGE_KEYS = {
  leaderboard: "craftz:leaderboard:v2",
  activity: "craftz:activity:v2",
} as const;

const MAX_ACTIVITY_ITEMS = 1000;

const TASK_TARGET_POOL: Array<{ name: string; hint: string; emojis: [string, string?] }> = [
  { name: "Mystery Potion", hint: "Mix two common items", emojis: ["🧪", "❓"] },
  { name: "Golden Apple", hint: "Shiny and valuable", emojis: ["🍎", "💛"] },
  { name: "Dragon Scale", hint: "Rare and powerful", emojis: ["🐉", "🛡️"] },
  { name: "Phoenix Feather", hint: "From a mythical bird", emojis: ["🔥", "🪶"] },
  { name: "Unicorn Horn", hint: "Magical and rare", emojis: ["🦄", "🔮"] },
];

function strHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function toDateKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function normalizeAgentId(fidOrAddress: AgentID, agentType: AgentType): string {
  if (agentType === "farcaster") {
    const fid = typeof fidOrAddress === "number" ? fidOrAddress : parseInt(String(fidOrAddress));
    if (!Number.isFinite(fid)) return `user:${fidOrAddress}`;
    return `fid:${fid}`;
  }
  const addr = typeof fidOrAddress === "string" ? fidOrAddress.toLowerCase() : String(fidOrAddress).toLowerCase();
  return `${agentType}:${addr}`;
}

function normalizeUsername(agentId: string, username?: string): string {
  if (username && username.trim().length > 0) return username.trim();
  return agentId;
}

function createDefaultPlayer(agentId: AgentID, agentType: AgentType, username?: string, address?: string, fid?: number): PlayerStats {
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
    x402Spent: "0",
    lastUpdatedAt: new Date().toISOString(),
  };
}

function pointsForTier(tier: ItemTier) {
  switch (tier) {
    case "RARE": return PTS.CRAFT_RARE;
    case "LEGENDARY": return PTS.CRAFT_LEGENDARY;
    default: return PTS.CRAFT_COMMON;
  }
}

function activityId(prefix: ActivityType, agentId: AgentID, agentType: AgentType) {
  const id = normalizeAgentId(agentId, agentType);
  return `${prefix}-${id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function getLeaderboardStore(): Promise<Record<string, PlayerStats>> {
  const store = await readJson<Record<string, PlayerStats>>(STORAGE_KEYS.leaderboard);
  return store ?? {};
}

async function pushActivity(event: ActivityEvent) {
  const current = (await readJson<ActivityEvent[]>(STORAGE_KEYS.activity)) ?? [];
  await writeJson(STORAGE_KEYS.activity, [event, ...current].slice(0, MAX_ACTIVITY_ITEMS));
}

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
  if (address && !player.address) player.address = address;
  if (fid && !player.fid) player.fid = fid;

  mutator(player);
  player.lastUpdatedAt = new Date().toISOString();

  store[key] = player;
  await writeJson(STORAGE_KEYS.leaderboard, store);
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
  const events = (await readJson<ActivityEvent[]>(STORAGE_KEYS.activity)) ?? [];
  const filtered = type ? events.filter((e) => e.type === type) : events;
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
}) {
  const tier = input.tier ?? "COMMON";
  const awardedPoints = input.pointsAwarded ?? pointsForTier(tier) + (input.isMegaMind ? PTS.MEGAMIND_BONUS : 0);

  const player = await updatePlayer(input.agentId, input.agentType, input.username, input.address, input.fid, (current) => {
    current.crafts += 1;
    current.points += awardedPoints;
    if (input.isMegaMind) current.megaMinds += 1;
  });

  await pushActivity({
    id: activityId("craft", input.agentId, input.agentType),
    type: "craft",
    agentId: player.agentId,
    agentType: player.agentType,
    username: player.username,
    address: player.address,
    fid: player.fid,
    pointsAwarded: awardedPoints,
    timestamp: new Date().toISOString(),
    metadata: {
      itemName: input.itemName,
      tier,
      ingredients: input.ingredients ?? [],
      emojis: input.emojis ?? [],
      isMegaMind: Boolean(input.isMegaMind),
    },
  });

  return { player, awardedPoints };
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
}) {
  const awardedPoints = PTS.MINT_MEGAMIND;

  const player = await updatePlayer(input.agentId, input.agentType, input.username, input.address, input.fid, (current) => {
    current.minted += 1;
    current.points += awardedPoints;
  });

  await pushActivity({
    id: activityId("mint", input.agentId, input.agentType),
    type: "mint",
    agentId: player.agentId,
    agentType: player.agentType,
    username: player.username,
    address: player.address,
    fid: player.fid,
    pointsAwarded: awardedPoints,
    timestamp: new Date().toISOString(),
    metadata: {
      itemName: input.itemName,
      tokenId: input.tokenId,
      txHash: input.txHash,
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
}) {
  const awardedPoints = PTS.GM_ONCHAIN;

  const player = await updatePlayer(input.agentId, input.agentType, input.username, input.address, input.fid, (current) => {
    current.gmCount += 1;
    current.points += awardedPoints;
  });

  await pushActivity({
    id: activityId("gm", input.agentId, input.agentType),
    type: "gm",
    agentId: player.agentId,
    agentType: player.agentType,
    username: player.username,
    address: player.address,
    fid: player.fid,
    pointsAwarded: awardedPoints,
    timestamp: new Date().toISOString(),
    metadata: { chain: input.chain, txHash: input.txHash },
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
    { id: "task-gm", type: "gm_onchain", title: "Send GM On-Chain", description: "Send one GM transaction on any supported chain.", icon: "🌅", points: PTS.GM_ONCHAIN, xpReward: 50, craftzReward: 10, required: 1, progress: 0, completed: false, updatedAt: now },
    { id: "task-target", type: "craft_target", title: "Today's Mystery Craft", description: "Figure out how to craft this specific item using the hint below.", icon: "🔮", points: 20, xpReward: 100, craftzReward: 20, required: 1, progress: 0, completed: false, targetItem: target.name, targetHint: target.hint, targetEmojis: target.emojis, updatedAt: now },
    { id: "task-crafts", type: "craft_count", title: `Craft ${craftGoal} Items`, description: `Complete ${craftGoal} valid crafts today.`, icon: "⚗️", points: craftGoal * 2, xpReward: craftGoal * 10, craftzReward: craftGoal * 3, required: craftGoal, progress: 0, completed: false, updatedAt: now },
    { id: "task-rare", type: "craft_rare", title: "Craft Something Rare+", description: "Produce at least one RARE or LEGENDARY item today.", icon: "💫", points: 15, xpReward: 75, craftzReward: 15, required: 1, progress: 0, completed: false, updatedAt: now },
    { id: "task-legendary", type: "craft_legendary", title: "Forge a Legend", description: "Discover or craft any LEGENDARY tier item.", icon: "👑", points: 30, xpReward: 150, craftzReward: 25, required: 1, progress: 0, completed: false, updatedAt: now },
    { id: "task-megamind", type: "mint_megamind", title: "Mint a MegaMind", description: "Mint any MegaMind NFT from your collection.", icon: "⚡", points: 40, xpReward: 200, craftzReward: 30, required: 1, progress: 0, completed: false, updatedAt: now },
    { id: "task-discover", type: "discover_new", title: "Achieve a MegaMind", description: "Be the first player globally to craft an item that has never existed before.", icon: "🌐", points: 50, xpReward: 250, craftzReward: 50, required: 1, progress: 0, completed: false, updatedAt: now },
  ];
}

export async function getDailyTasks(agentId: AgentID, agentType: AgentType, dateKey = toDateKey()) {
  const normalizedAgentId = normalizeAgentId(agentId, agentType);
  const key = taskStorageKey(normalizedAgentId, dateKey);
  const existing = await readJson<DailyTask[]>(key);
  if (existing && existing.length > 0) return existing;

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
  const tasks = await readJson<DailyTask[]>(key);

  if (!tasks || tasks.length === 0) return { tasks: [], task: null };

  const nextTasks = tasks.map((task) => {
    if (task.id !== input.taskId) return task;
    if (input.action === "complete") {
      return { ...task, completed: true, progress: task.required, claimedAt: Date.now(), updatedAt: new Date().toISOString() };
    }
    const amount = input.amount ?? 1;
    const progress = Math.min(task.required, task.progress + amount);
    return { ...task, progress, completed: progress >= task.required, updatedAt: new Date().toISOString() };
  });

  await writeJson(key, nextTasks);
  return { tasks: nextTasks, task: nextTasks.find((t) => t.id === input.taskId) ?? null };
}
