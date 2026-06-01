import { readJson, writeJson } from "./kv-store.js";

export type AgentBuffType =
  | "craftz_regen"
  | "tier_boost"
  | "gen_reduce"
  | "pts_bonus"
  | "reward_double";

export interface AgentDefinition {
  id: string;
  name: string;
  portrait: string;
  archetype: string;
  description: string;
  buffType: AgentBuffType;
  buffValue: number;
  buffDescription: string;
  costCraftz: number;
  durationMs: number;
}

export const AGENT_DEFINITIONS: Record<string, AgentDefinition> = {
  chronomancer: {
    id: "chronomancer",
    name: "Chronomancer",
    portrait: "🧙‍♂️",
    archetype: "Time Specialist",
    description: "An ancient wizard who bends the flow of time itself.",
    buffType: "craftz_regen",
    buffValue: 0.5,
    buffDescription: "Craftz regens 50% faster while active",
    costCraftz: 150,
    durationMs: 4 * 60 * 60 * 1000,
  },
  pyromancer: {
    id: "pyromancer",
    name: "Pyromancer",
    portrait: "🔥",
    archetype: "Fire Specialist",
    description: "Channels volatile flame energy into every combination.",
    buffType: "tier_boost",
    buffValue: 0.15,
    buffDescription: "+15% chance for COMMON results to upgrade to RARE",
    costCraftz: 200,
    durationMs: 4 * 60 * 60 * 1000,
  },
  naturalist: {
    id: "naturalist",
    name: "Naturalist",
    portrait: "🌿",
    archetype: "Earth Specialist",
    description: "Draws on deep earth energies to refine generational gaps.",
    buffType: "gen_reduce",
    buffValue: 1,
    buffDescription: "Crafted items are treated as 1 generation lower",
    costCraftz: 250,
    durationMs: 4 * 60 * 60 * 1000,
  },
  archivist: {
    id: "archivist",
    name: "Archivist",
    portrait: "📚",
    archetype: "Knowledge Specialist",
    description: "Records every MegaMind discovery and shares the glory.",
    buffType: "pts_bonus",
    buffValue: 25,
    buffDescription: "+25 pts on every MegaMind discovery",
    costCraftz: 300,
    durationMs: 8 * 60 * 60 * 1000,
  },
  trickster: {
    id: "trickster",
    name: "Trickster",
    portrait: "🃏",
    archetype: "Chaos Specialist",
    description: "A wildcard agent that sometimes doubles your rewards.",
    buffType: "reward_double",
    buffValue: 0.10,
    buffDescription: "10% chance to double Craftz earned from tasks",
    costCraftz: 100,
    durationMs: 2 * 60 * 60 * 1000,
  },
};

const RENTALS_KEY = "craftz:rentals:v3";
const MAX_BUFF_TIER_BOOST = 0.50;
const MAX_BUFF_GEN_REDUCE = 3;

export interface RentalRecord {
  id: string;
  fid: number;
  agentId: string;
  startedAt: string;
  expiresAt: string;
  costCraftz: number;
  isActive: boolean;
  paymentMethod: "craftz" | "x402";
}

async function getRentalStore(): Promise<Record<string, RentalRecord>> {
  return (await readJson<Record<string, RentalRecord>>(RENTALS_KEY)) ?? {};
}

export async function getActiveRentals(fid: number): Promise<Array<RentalRecord & { agent: AgentDefinition }>> {
  const store = await getRentalStore();
  const now = new Date().toISOString();
  return Object.values(store)
    .filter((r) => r.fid === fid && r.isActive && r.expiresAt > now)
    .map((r) => ({ ...r, agent: AGENT_DEFINITIONS[r.agentId] }))
    .filter((r) => r.agent != null);
}

export async function rentAgent(fid: number, agentId: string, paymentMethod: "craftz" | "x402" = "craftz"): Promise<{ ok: true; rental: RentalRecord } | { ok: false; error: string }> {
  const agent = AGENT_DEFINITIONS[agentId];
  if (!agent) return { ok: false, error: "Unknown agent" };

  const store = await getRentalStore();
  const now = new Date();
  const nowIso = now.toISOString();

  // Check no active duplicate rental
  const alreadyActive = Object.values(store).find(
    (r) => r.fid === fid && r.agentId === agentId && r.isActive && r.expiresAt > nowIso,
  );
  if (alreadyActive) return { ok: false, error: "Already renting this agent" };

  const id = `rental-${fid}-${agentId}-${Date.now().toString(36)}`;
  const expiresAt = new Date(now.getTime() + agent.durationMs).toISOString();

  const rental: RentalRecord = {
    id, fid, agentId,
    startedAt: nowIso,
    expiresAt,
    costCraftz: agent.costCraftz,
    isActive: true,
    paymentMethod,
  };

  store[id] = rental;
  await writeJson(RENTALS_KEY, store);
  return { ok: true, rental };
}

export async function getAgentBuffs(fid: number): Promise<{
  tierBoost: number;
  genReduce: number;
  ptsBonusPerMegaMind: number;
  rewardDoubleChance: number;
  regenMultiplier: number;
}> {
  const buffs = { tierBoost: 0, genReduce: 0, ptsBonusPerMegaMind: 0, rewardDoubleChance: 0, regenMultiplier: 1.0 };
  const active = await getActiveRentals(fid);

  for (const rental of active) {
    switch (rental.agent.buffType) {
      case "tier_boost":
        buffs.tierBoost = Math.min(MAX_BUFF_TIER_BOOST, buffs.tierBoost + rental.agent.buffValue);
        break;
      case "gen_reduce":
        buffs.genReduce = Math.min(MAX_BUFF_GEN_REDUCE, buffs.genReduce + rental.agent.buffValue);
        break;
      case "pts_bonus":
        buffs.ptsBonusPerMegaMind += rental.agent.buffValue;
        break;
      case "reward_double":
        buffs.rewardDoubleChance = Math.min(0.50, buffs.rewardDoubleChance + rental.agent.buffValue);
        break;
      case "craftz_regen":
        buffs.regenMultiplier = Math.min(3.0, buffs.regenMultiplier + rental.agent.buffValue);
        break;
    }
  }
  return buffs;
}

export async function expireStaleRentals(): Promise<number> {
  const store = await getRentalStore();
  const now = new Date().toISOString();
  let expired = 0;
  for (const [id, rental] of Object.entries(store)) {
    if (rental.isActive && rental.expiresAt <= now) {
      store[id] = { ...rental, isActive: false };
      expired++;
    }
  }
  if (expired > 0) await writeJson(RENTALS_KEY, store);
  return expired;
}
