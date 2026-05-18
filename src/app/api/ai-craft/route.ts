import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJson, writeJson } from "@/server/kv-store";

const AI_CRAFT_CACHE_KEY = "craftz:ai-cache:v1";
const AI_DISCOVERED_KEY = "craftz:ai-discovered:v1";

const craftRequestSchema = z.object({
  itemA: z.string().min(1).max(50),
  itemB: z.string().min(1).max(50),
  discoveredItems: z.array(z.object({
    name: z.string(),
    tier: z.string(),
    emojis: z.array(z.string()),
  })).default([]),
});

const aiResponseSchema = z.object({
  name: z.string().min(1).max(60),
  emojis: z.array(z.string().min(1).max(8)).length(2),
  tier: z.enum(["COMMON", "RARE", "LEGENDARY"]),
  description: z.string().min(1).max(200),
});

function getCacheKey(itemA: string, itemB: string): string {
  const sorted = [itemA.toLowerCase().trim(), itemB.toLowerCase().trim()].sort();
  return `${sorted[0]}+${sorted[1]}`;
}

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = craftRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { itemA, itemB, discoveredItems } = parsed.data;
  const cacheKey = getCacheKey(itemA, itemB);

  // Check cache first — same combination always returns same result
  const cache = await readJson<Record<string, z.infer<typeof aiResponseSchema>>>(AI_CRAFT_CACHE_KEY) || {};
  if (cache[cacheKey]) {
    const isMegaMind = false; // cached = already discovered
    return NextResponse.json({
      ok: true,
      cached: true,
      result: { ...cache[cacheKey], isMegaMind },
    });
  }

  // Check AI config
  const apiKey = process.env.AI_API_KEY;
  const apiBase = process.env.AI_API_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "AI_API_KEY not configured" },
      { status: 500 },
    );
  }

  // Build discovered items list for context
  const discoveredList = discoveredItems.length > 0
    ? discoveredItems.map(d => `- ${d.name} (${d.tier}, emojis: ${d.emojis.join("")})`).join("\n")
    : "None yet — this is early in the game.";

  // AI prompt — strict, deterministic instructions
  const systemPrompt = `You are the Crafting Oracle for a Farcaster mini-game called CrafterZ.

RULES:
1. Two items are being combined. You must determine what they create.
2. The result must be LOGICAL and SEMANTICALLY RELATED to both ingredients.
3. Return EXACTLY 2 emojis that represent the result.
4. Tier assignment:
   - COMMON: Simple, everyday combinations (60% of results)
   - RARE: Interesting, non-obvious but logical combinations (30%)
   - LEGENDARY: Profound, rare, or cosmic combinations (10%)
5. The name should be 1-3 words, capitalized, and evocative.
6. DO NOT create items that already exist in the discovered list.
7. Be creative but grounded — no nonsense like "Fire + Water = Blahblah".
8. The description should be 1 short sentence explaining the connection.

EXAMPLES:
- Fire + Water = Steam (COMMON, emojis: ["💨","🌫️"])
- Earth + Fire = Lava (RARE, emojis: ["🌋","🔴"])
- Moon + Sun = Eclipse (LEGENDARY, emojis: ["🌘","☀️"])
- Water + Time = Ice (COMMON, emojis: ["🧊","💧"])
- Earth + Time = Fossil (RARE, emojis: ["🦴","🪨"])

Respond with ONLY valid JSON matching this schema:
{"name": string, "emojis": [string, string], "tier": "COMMON"|"RARE"|"LEGENDARY", "description": string}`;

  const userPrompt = `What is created when "${itemA}" and "${itemB}" are combined?

Already discovered items (do NOT duplicate these):
${discoveredList}

Return ONLY the JSON object.`;

  try {
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3, // Low temperature for consistency
        max_tokens: 150,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "unknown error");
      console.error("AI API error:", response.status, errText);
      return NextResponse.json(
        { ok: false, error: `AI API returned ${response.status}` },
        { status: 502 },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { ok: false, error: "AI returned empty response" },
        { status: 502 },
      );
    }

    // Parse and validate AI response
    let aiResult: z.infer<typeof aiResponseSchema>;
    try {
      const parsed = JSON.parse(content);
      aiResult = aiResponseSchema.parse(parsed);
    } catch {
      return NextResponse.json(
        { ok: false, error: "AI returned invalid JSON", raw: content.slice(0, 200) },
        { status: 502 },
      );
    }

    // Check if this result name conflicts with existing discovered items
    const normalizedName = aiResult.name.toLowerCase().trim();
    const conflict = discoveredItems.find(
      (d) => d.name.toLowerCase().trim() === normalizedName,
    );

    if (conflict) {
      // AI duplicated an existing item — return the existing one
      return NextResponse.json({
        ok: true,
        cached: true,
        conflict: true,
        result: {
          name: conflict.name,
          emojis: conflict.emojis,
          tier: conflict.tier,
          isMegaMind: false,
        },
      });
    }

    // Cache the result for deterministic future combinations
    cache[cacheKey] = aiResult;
    await writeJson(AI_CRAFT_CACHE_KEY, cache);

    // Track as discovered (for MegaMind detection on server)
    const discovered = await readJson<Record<string, { count: number; firstDiscoveredAt: string }>>(AI_DISCOVERED_KEY) || {};
    const isNewGlobalDiscovery = !discovered[normalizedName];
    if (isNewGlobalDiscovery) {
      discovered[normalizedName] = { count: 1, firstDiscoveredAt: new Date().toISOString() };
    } else {
      discovered[normalizedName].count += 1;
    }
    await writeJson(AI_DISCOVERED_KEY, discovered);

    return NextResponse.json({
      ok: true,
      cached: false,
      result: {
        ...aiResult,
        isMegaMind: isNewGlobalDiscovery,
      },
    });
  } catch (error) {
    console.error("AI craft error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
