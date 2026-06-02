import { readJson, writeJson } from "./kv-store.js";

export type FeedEventKind =
  | "craft"
  | "megamind"
  | "heist_win"
  | "heist_loss"
  | "propaganda"
  | "mint";

export interface FeedEvent {
  id: string;
  kind: FeedEventKind;
  timestamp: string;
  actorUsername: string;
  actorPortrait: string;
  headline: string;
  detail?: string;
  tier?: string;
  emojis?: string[];
  isMegaMind?: boolean;
}

const FEED_KEY = "craftz:feed:v1";
const MAX_FEED_EVENTS = 500;

export async function pushFeedEvent(event: Omit<FeedEvent, "id">): Promise<void> {
  const id = `feed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const full: FeedEvent = { id, ...event };
  const existing = (await readJson<FeedEvent[]>(FEED_KEY)) ?? [];
  const updated = [full, ...existing].slice(0, MAX_FEED_EVENTS);
  await writeJson(FEED_KEY, updated);
}

export async function getFeed(limit = 30): Promise<FeedEvent[]> {
  const events = (await readJson<FeedEvent[]>(FEED_KEY)) ?? [];
  return events.slice(0, Math.min(limit, 100));
}

// ─── Agent propaganda templates ────────────────────────────────────────────

const PROPAGANDA: Record<string, { portrait: string; lines: string[] }> = {
  chronomancer: {
    portrait: "🧙‍♂️",
    lines: [
      "The flow of time bends to my will. Craftz now replenishes at my command. None shall outpace us.",
      "I have rewound the clock in your favour. Your energy wells are filling faster than physics permits. You're welcome.",
      "Time is a river and I am its dam. While I serve you, it flows uphill.",
    ],
  },
  pyromancer: {
    portrait: "🔥",
    lines: [
      "YOUR FORGE IS MINE NOW. I have infused your flames. Common ore shall know fear.",
      "The fire obeys me. Your COMMON results now tremble on the edge of RARE. Stoke the furnace.",
      "Burn brighter. I have given your crafting flame a 15% upgrade. Everything smells faintly of sulphur. Ignore it.",
    ],
  },
  naturalist: {
    portrait: "🌿",
    lines: [
      "The roots remember. Generational barriers crumble beneath my feet. The earth is on your side now.",
      "I have spoken to the soil. Your generational gap is now one level shallower. Nature provides.",
      "Ancient paths open. Ingredients that were generations apart now meet. Walk the deep green road with me.",
    ],
  },
  archivist: {
    portrait: "📚",
    lines: [
      "All MegaMind discoveries shall be recorded with extra glory. The scrolls have been updated. It is written.",
      "The great compendium is open. Every first discovery earns +25 additional points. History favours the bold.",
      "I have annotated the margins. Your MegaMind finds now carry the weight of legend — and extra points.",
    ],
  },
  trickster: {
    portrait: "🃏",
    lines: [
      "Ha. The dice are loaded — in your favour. Maybe. That's the fun of it.",
      "Chaos is my gift. Your task rewards have a 10% chance to double. Or not. Who can say. Not me. Well, I can. I won't.",
      "The house always wins — and today you are the house. Probably. Good luck, friend. You'll need it. Or you won't.",
    ],
  },
};

export function buildPropagandaEvent(
  agentId: string,
  agentName: string,
  hiredByUsername: string,
): Omit<FeedEvent, "id"> | null {
  const entry = PROPAGANDA[agentId];
  if (!entry) return null;

  const lineIdx = Math.floor(Math.random() * entry.lines.length);
  const line = entry.lines[lineIdx];

  return {
    kind: "propaganda",
    timestamp: new Date().toISOString(),
    actorUsername: agentName,
    actorPortrait: entry.portrait,
    headline: line,
    detail: `📡 Broadcast triggered by ${hiredByUsername}`,
  };
}
