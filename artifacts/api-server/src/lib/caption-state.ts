import { readJson, writeJson } from "./kv-store.js";

export interface CaptionRecord {
  id: string;
  itemName: string;
  discovererUsername: string;
  tier: string;
  ingredients: string[];
  captionText: string;
  isAiGenerated: boolean;
  moderationPassed: boolean;
  hahCount: number;
  reportCount: number;
  isSuppressed: boolean;
  createdAt: string;
}

const CAPTIONS_KEY = "craftz:captions:v3";
const MAX_CAPTIONS = 200;

const BLOCKLIST = [
  "hate", "kill", "slur", "nazi", "racist", "sexist", "terrorist",
  "violence", "abuse", "harass",
];

const CAPTION_TEMPLATES = [
  "{user}'s agent just unearthed {item} — certified intergalactic grade!",
  "BREAKING: {user} discovered {item}. Scientists baffled. Insurance companies nervous.",
  "{user} forged {item} from the very fabric of chaos. No refunds.",
  "Flash bulletin: {item} has entered the chat, courtesy of the legendary {user}.",
  "{user} may have just broken physics with {item}. We're looking into it.",
  "The Gazette confirms: {user} crafted {item}. Rivals are shaking.",
  "{item} has been born into this world. We have {user} to blame — or thank.",
  "Unconfirmed sources say {user}'s discovery of {item} will change everything. Probably.",
  "{user} mixed {a} and {b} and somehow got {item}. The math checks out, allegedly.",
  "RARE SIGHTING: {item} spotted in {user}'s inventory. Authorities remain puzzled.",
];

function moderateCaption(text: string): boolean {
  const lower = text.toLowerCase();
  return !BLOCKLIST.some((term) => lower.includes(term));
}

function pickTemplate(
  itemName: string,
  username: string,
  tier: string,
  ingredients: string[],
): string {
  const idx = Math.abs(
    itemName.charCodeAt(0) * 31 + username.charCodeAt(0) * 7 + tier.charCodeAt(0),
  ) % CAPTION_TEMPLATES.length;

  const template = CAPTION_TEMPLATES[idx];
  const a = ingredients[0] ?? "mystery";
  const b = ingredients[1] ?? "enigma";

  return template
    .replace(/{user}/g, username)
    .replace(/{item}/g, itemName)
    .replace(/{a}/g, a)
    .replace(/{b}/g, b)
    .replace(/{tier}/g, tier);
}

const SAFE_FALLBACK = (username: string, itemName: string) =>
  `${username} discovered ${itemName}! The Gazette's fact-checkers are still recovering from the shock.`;

async function tryAiCaption(
  itemName: string,
  username: string,
  tier: string,
  ingredients: string[],
): Promise<string | null> {
  const apiKey = process.env["AI_API_KEY"];
  const apiBase = process.env["AI_API_BASE_URL"] || "https://api.openai.com/v1";
  const model = process.env["AI_MODEL"] || "gpt-4o-mini";
  if (!apiKey) return null;

  try {
    const systemPrompt = `You are the editorial voice of "The Crafterz Gazette" — a zany tabloid covering the alchemy world.
Write captions that are punchy (max 2 sentences), playful, and G-rated.
Never mention real people, politics, religion, or use slurs.
Reference the item and discoverer only. Tone: excited tabloid, not stand-up comedy.`;

    const userPrompt = `Write a caption for this discovery:
- Discoverer: ${username.slice(0, 32)}
- Item: ${itemName.slice(0, 40)} (${tier} tier)
- Recipe: ${ingredients.slice(0, 2).join(" + ")}
Respond with ONLY the caption text. No quotes. No commentary. Max 150 chars.`;

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.7,
        max_tokens: 80,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text || text.length > 300) return null;
    return text;
  } catch {
    return null;
  }
}

export async function generateCaption(input: {
  itemName: string;
  discovererUsername: string;
  tier: string;
  ingredients: string[];
  isMegaMind: boolean;
}): Promise<CaptionRecord> {
  const captions = (await readJson<CaptionRecord[]>(CAPTIONS_KEY)) ?? [];
  const id = `cap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  let captionText: string;
  let isAiGenerated = false;

  const aiText = await tryAiCaption(input.itemName, input.discovererUsername, input.tier, input.ingredients);
  if (aiText && moderateCaption(aiText)) {
    captionText = aiText;
    isAiGenerated = true;
  } else {
    const template = pickTemplate(input.itemName, input.discovererUsername, input.tier, input.ingredients);
    captionText = moderateCaption(template) ? template : SAFE_FALLBACK(input.discovererUsername, input.itemName);
  }

  const caption: CaptionRecord = {
    id,
    itemName: input.itemName,
    discovererUsername: input.discovererUsername,
    tier: input.tier,
    ingredients: input.ingredients.slice(0, 2),
    captionText,
    isAiGenerated,
    moderationPassed: true,
    hahCount: 0,
    reportCount: 0,
    isSuppressed: false,
    createdAt: new Date().toISOString(),
  };

  const updated = [caption, ...captions].slice(0, MAX_CAPTIONS);
  await writeJson(CAPTIONS_KEY, updated);
  return caption;
}

export async function getCaptions(limit = 20): Promise<CaptionRecord[]> {
  const captions = (await readJson<CaptionRecord[]>(CAPTIONS_KEY)) ?? [];
  return captions.filter((c) => !c.isSuppressed).slice(0, limit);
}

export async function reactToCaption(captionId: string): Promise<boolean> {
  const captions = (await readJson<CaptionRecord[]>(CAPTIONS_KEY)) ?? [];
  const idx = captions.findIndex((c) => c.id === captionId);
  if (idx < 0) return false;
  captions[idx] = { ...captions[idx], hahCount: (captions[idx].hahCount ?? 0) + 1 };
  await writeJson(CAPTIONS_KEY, captions);
  return true;
}

export async function reportCaption(captionId: string): Promise<boolean> {
  const captions = (await readJson<CaptionRecord[]>(CAPTIONS_KEY)) ?? [];
  const idx = captions.findIndex((c) => c.id === captionId);
  if (idx < 0) return false;
  const newCount = (captions[idx].reportCount ?? 0) + 1;
  captions[idx] = { ...captions[idx], reportCount: newCount, isSuppressed: newCount >= 3 };
  await writeJson(CAPTIONS_KEY, captions);
  return true;
}
