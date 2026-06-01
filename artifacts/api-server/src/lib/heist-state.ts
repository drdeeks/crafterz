import { readJson, writeJson } from "./kv-store.js";

export type HeistStatus = "PENDING" | "ACTIVE" | "RESOLVED" | "EXPIRED" | "CANCELLED";
export type ItemTier = "COMMON" | "RARE" | "LEGENDARY" | "GENESIS";

const TIER_SCORE: Record<string, number> = {
  LEGENDARY: 15,
  RARE: 5,
  COMMON: 2,
  GENESIS: 1,
};

const BOT_ITEMS = [
  { name: "Ember Shard",   tier: "RARE",      generation: 2 },
  { name: "Iron Golem",    tier: "COMMON",     generation: 1 },
  { name: "Thunderbolt",   tier: "LEGENDARY",  generation: 3 },
  { name: "Bog Water",     tier: "COMMON",     generation: 1 },
  { name: "Prism Crystal", tier: "RARE",       generation: 2 },
];

export interface HeistRecord {
  id: string;
  challengerFid: number;
  defenderFid: number | null;
  defenderUsername: string;
  targetItemName: string;
  targetItemEmojis: string[];
  targetItemTier: string;
  status: HeistStatus;
  entryCraftz: number;
  challengerItemName?: string;
  challengerItemTier?: string;
  challengerItemGeneration?: number;
  defenderItemName?: string;
  defenderItemTier?: string;
  defenderItemGeneration?: number;
  challengerScore?: number;
  defenderScore?: number;
  winnerFid: number | null;
  pointsAwarded: number;
  rivalryTokenEarned: boolean;
  paymentMethod: "craftz" | "x402";
  createdAt: string;
  resolvedAt?: string;
}

const HEISTS_KEY = "craftz:heists:v3";

async function getHeistStore(): Promise<Record<string, HeistRecord>> {
  return (await readJson<Record<string, HeistRecord>>(HEISTS_KEY)) ?? {};
}

export async function getHeist(id: string): Promise<HeistRecord | null> {
  const store = await getHeistStore();
  return store[id] ?? null;
}

export async function getHeistsByFid(fid: number): Promise<HeistRecord[]> {
  const store = await getHeistStore();
  return Object.values(store)
    .filter((h) => h.challengerFid === fid || h.defenderFid === fid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);
}

function calcScore(tier: string, generation: number): number {
  return (TIER_SCORE[tier] ?? 2) - generation * 0.1;
}

function pickBotItem(): { name: string; tier: string; generation: number } {
  return BOT_ITEMS[Math.floor(Math.random() * BOT_ITEMS.length)];
}

export async function initiateHeist(input: {
  challengerFid: number;
  defenderFid: number | null;
  defenderUsername: string;
  targetItemName: string;
  targetItemEmojis: string[];
  targetItemTier: string;
  entryCraftz: number;
  challengerItemName: string;
  challengerItemTier: string;
  challengerItemGeneration: number;
  paymentMethod?: "craftz" | "x402";
}): Promise<{ ok: true; heist: HeistRecord; pointsAwarded: number } | { ok: false; error: string }> {
  const store = await getHeistStore();
  const id = `heist-${input.challengerFid}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const botItem = input.defenderFid === null ? pickBotItem() : null;
  const defenderItemName = botItem?.name;
  const defenderItemTier = botItem?.tier;
  const defenderItemGeneration = botItem?.generation;

  const challengerScore = calcScore(input.challengerItemTier, input.challengerItemGeneration);
  const defenderScore = botItem ? calcScore(botItem.tier, botItem.generation) : 0;

  const challengerWins = challengerScore > defenderScore;
  const isTie = Math.abs(challengerScore - defenderScore) < 0.05;

  let winnerFid: number | null = null;
  let pointsAwarded = 0;
  let rivalryTokenEarned = false;

  if (!isTie) {
    winnerFid = challengerWins ? input.challengerFid : (input.defenderFid ?? -1);
    if (challengerWins) {
      pointsAwarded = 20 + Math.floor(challengerScore * 2);
      rivalryTokenEarned = true;
    }
  }

  const heist: HeistRecord = {
    id,
    challengerFid: input.challengerFid,
    defenderFid: input.defenderFid,
    defenderUsername: input.defenderUsername,
    targetItemName: input.targetItemName,
    targetItemEmojis: input.targetItemEmojis,
    targetItemTier: input.targetItemTier,
    status: "RESOLVED",
    entryCraftz: input.entryCraftz,
    challengerItemName: input.challengerItemName,
    challengerItemTier: input.challengerItemTier,
    challengerItemGeneration: input.challengerItemGeneration,
    defenderItemName,
    defenderItemTier,
    defenderItemGeneration,
    challengerScore,
    defenderScore,
    winnerFid,
    pointsAwarded,
    rivalryTokenEarned,
    paymentMethod: input.paymentMethod ?? "craftz",
    createdAt: new Date().toISOString(),
    resolvedAt: new Date().toISOString(),
  };

  store[id] = heist;
  await writeJson(HEISTS_KEY, store);
  return { ok: true, heist, pointsAwarded };
}
