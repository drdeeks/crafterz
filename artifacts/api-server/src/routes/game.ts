import { Router } from "express";
import { z } from "zod";
import {
  getLeaderboard,
  getRecentActivity,
  recordCraft,
  recordMint,
  recordGm,
  getDailyTasks,
  updateDailyTask,
  type AgentType,
  type AgentID,
} from "../lib/game-state.js";
import { readJson, writeJson } from "../lib/kv-store.js";
import { generateCaption } from "../lib/caption-state.js";
import { pushFeedEvent } from "../lib/feed-state.js";

const router = Router();

// ─── Leaderboard ─────────────────────────────────────────────────────────────

router.get("/leaderboard", async (req, res) => {
  try {
    const rawLimit = Number(req.query["limit"] ?? 50);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 50;

    const [leaderboard, recentActivity] = await Promise.all([
      getLeaderboard(limit),
      getRecentActivity(20),
    ]);

    res.json({ ok: true, leaderboard, recentActivity });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// ─── Tasks ───────────────────────────────────────────────────────────────────

const updateTaskSchema = z.object({
  agentId: z.union([z.number().int().positive(), z.string().trim().min(1).max(100)]),
  agentType: z.enum(["farcaster", "x40", "ens", "solana"]).default("farcaster"),
  taskId: z.string().trim().min(1),
  action: z.enum(["progress", "complete"]),
  amount: z.number().int().min(1).max(50).optional(),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

router.get("/tasks", async (req, res) => {
  try {
    const fid = req.query["fid"];
    if (!fid) {
      return res.status(400).json({ ok: false, error: "Query parameter 'fid' is required." });
    }
    const agentType = (req.query["agentType"] as AgentType) || "farcaster";
    const agentId: AgentID = agentType === "farcaster" ? (parseInt(String(fid)) || String(fid)) : String(fid);
    const tasks = await getDailyTasks(agentId, agentType, req.query["date"] as string | undefined);
    res.json({ ok: true, tasks });
  } catch (err) {
    console.error("Tasks GET error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.post("/tasks", async (req, res) => {
  try {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", issues: parsed.error.flatten() });
    }

    const { agentId, agentType, taskId, action, amount, dateKey } = parsed.data;
    const result = await updateDailyTask({ agentId, agentType, taskId, action, amount, dateKey });

    res.json({ ok: true, task: result.task, tasks: result.tasks });
  } catch (err) {
    console.error("Tasks POST error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// ─── Craft ───────────────────────────────────────────────────────────────────

const craftSchema = z.object({
  agentId: z.union([z.number().int().positive(), z.string().trim().min(1).max(100)]),
  agentType: z.enum(["farcaster", "x40", "ens", "solana"]).default("farcaster"),
  username: z.string().trim().min(1).max(50).optional(),
  fid: z.number().int().positive().optional(),
  itemName: z.string().trim().min(1).max(80),
  tier: z.enum(["COMMON", "RARE", "LEGENDARY"]).default("COMMON"),
  ingredients: z.array(z.string().trim().min(1).max(40)).max(5).optional(),
  emojis: z.array(z.string().trim().min(1).max(8)).max(2).optional(),
  isMegaMind: z.boolean().optional(),
  pointsAwarded: z.number().int().min(0).max(500).optional(),
});

router.get("/craft", async (req, res) => {
  try {
    const rawLimit = Number(req.query["limit"] ?? 20);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 20;
    const events = await getRecentActivity(limit, "craft");
    res.json({ ok: true, events });
  } catch (err) {
    console.error("Craft GET error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.post("/craft", async (req, res) => {
  try {
    const parsed = craftSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", issues: parsed.error.flatten() });
    }

    const { player, awardedPoints } = await recordCraft(parsed.data);
    res.json({ ok: true, player, awardedPoints });

    const isMega = Boolean(parsed.data.isMegaMind);
    const username = parsed.data.username ?? "CrafterZ";
    const tier = parsed.data.tier ?? "COMMON";

    // Fire-and-forget: push discovery to live feed
    pushFeedEvent({
      kind: isMega ? "megamind" : "craft",
      timestamp: new Date().toISOString(),
      actorUsername: username,
      actorPortrait: `https://api.dicebear.com/9.x/lorelei/svg?seed=${username}`,
      headline: isMega
        ? `✨ FIRST DISCOVERY! ${username} forged ${parsed.data.itemName}`
        : `${username} crafted ${parsed.data.itemName}`,
      detail: parsed.data.ingredients?.join(" + "),
      tier,
      emojis: parsed.data.emojis,
      isMegaMind: isMega,
    }).catch((err: unknown) => console.error("Feed push error:", err));

    // Fire-and-forget: comedy caption (MegaMinds always get one; 25% chance for others)
    if (isMega || Math.random() < 0.25) {
      generateCaption({
        itemName: parsed.data.itemName,
        discovererUsername: username,
        tier,
        ingredients: parsed.data.ingredients ?? [],
        isMegaMind: isMega,
      }).catch((err: unknown) => console.error("Caption generation error:", err));
    }
  } catch (err) {
    console.error("Craft POST error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// ─── Mint ─────────────────────────────────────────────────────────────────────

const mintSchema = z.object({
  agentId: z.union([z.number().int().positive(), z.string().trim().min(1).max(100)]),
  agentType: z.enum(["farcaster", "x40", "ens", "solana"]).default("farcaster"),
  username: z.string().trim().min(1).max(50).optional(),
  fid: z.number().int().positive().optional(),
  itemName: z.string().trim().min(1).max(80),
  tokenId: z.number().int().positive().optional(),
  txHash: z.string().trim().min(1).max(100).optional(),
});

router.post("/mint", async (req, res) => {
  try {
    const parsed = mintSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", issues: parsed.error.flatten() });
    }

    const { player, awardedPoints } = await recordMint(parsed.data);
    res.json({ ok: true, player, awardedPoints });
  } catch (err) {
    console.error("Mint POST error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// ─── GM ───────────────────────────────────────────────────────────────────────

const gmSchema = z.object({
  agentId: z.union([z.number().int().positive(), z.string().trim().min(1).max(100)]),
  agentType: z.enum(["farcaster", "x40", "ens", "solana"]).default("farcaster"),
  username: z.string().trim().min(1).max(50).optional(),
  fid: z.number().int().positive().optional(),
  chain: z.string().trim().min(1).max(40),
  txHash: z.string().trim().min(1).max(100).optional(),
});

router.post("/gm", async (req, res) => {
  try {
    const parsed = gmSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", issues: parsed.error.flatten() });
    }

    const { player, awardedPoints } = await recordGm(parsed.data);
    res.json({ ok: true, player, awardedPoints });
  } catch (err) {
    console.error("GM POST error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// ─── AI Craft ─────────────────────────────────────────────────────────────────

const AI_CRAFT_CACHE_KEY = "craftz:ai-cache:v3";
const AI_DISCOVERED_KEY = "craftz:ai-discovered:v1";

const craftRequestSchema = z.object({
  itemA: z.string().min(1).max(50),
  itemB: z.string().min(1).max(50),
  genA: z.number().int().min(0).max(50),
  genB: z.number().int().min(0).max(50),
  discoveredItems: z.array(z.object({
    name: z.string(),
    tier: z.string(),
    generation: z.number().int().min(0).max(50),
    emoji: z.string().min(1).max(8),
  })).default([]),
});

const aiResponseSchema = z.object({
  name: z.string().min(1).max(60),
  emoji: z.string().min(1).max(8),
  tier: z.enum(["COMMON", "RARE", "LEGENDARY"]),
  description: z.string().min(1).max(200),
});

function getCacheKey(itemA: string, itemB: string): string {
  const sorted = [itemA.toLowerCase().trim(), itemB.toLowerCase().trim()].sort();
  return `${sorted[0]}+${sorted[1]}`;
}

router.post("/ai-craft", async (req, res) => {
  try {
    const parsed = craftRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid request", issues: parsed.error.flatten() });
    }

    const { itemA, itemB, genA, genB, discoveredItems } = parsed.data;
    const cacheKey = getCacheKey(itemA, itemB);
    const resultGeneration = Math.max(genA, genB) + 1;

    const cache = await readJson<Record<string, z.infer<typeof aiResponseSchema>>>(AI_CRAFT_CACHE_KEY) || {};
    if (cache[cacheKey]) {
      return res.json({ ok: true, cached: true, result: { ...cache[cacheKey], isMegaMind: false, generation: resultGeneration } });
    }

    const apiKey = process.env["AI_API_KEY"];
    const apiBase = process.env["AI_API_BASE_URL"] || "https://api.openai.com/v1";
    const model = process.env["AI_MODEL"] || "gpt-4o-mini";

    if (!apiKey) {
      return res.status(500).json({ ok: false, error: "AI_API_KEY not configured" });
    }

    const discoveredList = discoveredItems.length > 0
      ? discoveredItems.map(d => `- ${d.name} (Gen ${d.generation}, ${d.tier}) ${d.emoji}`).join("\n")
      : "None yet — this is early in the game.";

    const genContext = genA === 0 && genB === 0
      ? "Both ingredients are primordial GENESIS elements (Generation 0)."
      : genA === 0 || genB === 0
        ? `One ingredient is a GENESIS element (Gen 0), the other is a crafted item (Gen ${Math.max(genA, genB)}).`
        : `Both ingredients are crafted items (Gen ${genA} and Gen ${genB}). Result will be Gen ${resultGeneration}.`;

    const systemPrompt = `You are the Crafting Oracle for CrafterZ, a Farcaster mini-game. Players combine items to create new ones.
RULES:
1. Combine the two items logically. Return EXACTLY 1 emoji — the single most iconic, evocative emoji for the result.
2. Tiers: COMMON (60%), RARE (30%), LEGENDARY (10%).
3. Name should be 1-3 words, capitalized, evocative.
4. DO NOT duplicate items from the discovered list.
5. Higher generations → more abstract/complex results.
Respond with ONLY valid JSON: {"name": string, "emoji": string, "tier": "COMMON"|"RARE"|"LEGENDARY", "description": string}`;

    const userPrompt = `What is created when "${itemA}" (Gen ${genA}) and "${itemB}" (Gen ${genB}) are combined?\n${genContext}\nAlready discovered:\n${discoveredList}\nReturn ONLY the JSON object.`;

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.3,
        max_tokens: 150,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "unknown error");
      console.error("AI API error:", response.status, errText);
      return res.status(502).json({ ok: false, error: `AI API returned ${response.status}` });
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({ ok: false, error: "AI returned empty response" });
    }

    let aiResult: z.infer<typeof aiResponseSchema>;
    try {
      aiResult = aiResponseSchema.parse(JSON.parse(content));
    } catch {
      return res.status(502).json({ ok: false, error: "AI returned invalid JSON", raw: content.slice(0, 200) });
    }

    const normalizedName = aiResult.name.toLowerCase().trim();
    const conflict = discoveredItems.find(d => d.name.toLowerCase().trim() === normalizedName);

    if (conflict) {
      return res.json({ ok: true, cached: true, conflict: true, result: { name: conflict.name, emoji: conflict.emoji, tier: conflict.tier, isMegaMind: false, generation: resultGeneration } });
    }

    cache[cacheKey] = aiResult;
    await writeJson(AI_CRAFT_CACHE_KEY, cache);

    const discovered = await readJson<Record<string, { count: number; firstDiscoveredAt: string }>>(AI_DISCOVERED_KEY) || {};
    const isNewGlobalDiscovery = !discovered[normalizedName];
    if (isNewGlobalDiscovery) {
      discovered[normalizedName] = { count: 1, firstDiscoveredAt: new Date().toISOString() };
    } else {
      discovered[normalizedName].count += 1;
    }
    await writeJson(AI_DISCOVERED_KEY, discovered);

    res.json({ ok: true, cached: false, result: { ...aiResult, isMegaMind: isNewGlobalDiscovery, generation: resultGeneration } });
  } catch (err) {
    console.error("AI craft error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

export default router;
