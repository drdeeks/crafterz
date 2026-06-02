import type { ServerActivity } from "./runtime-api";

export type DiscoveryFeedItem = {
  name: string;
  emoji: string;
  tier: "COMMON" | "RARE" | "LEGENDARY";
  discoverer: string;
  time: string;
  minted: boolean;
};

function getRelativeTime(timestamp: string): string {
  const ageMs = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) return "just now";

  const minutes = Math.floor(ageMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isTier(value: unknown): value is "COMMON" | "RARE" | "LEGENDARY" {
  return value === "COMMON" || value === "RARE" || value === "LEGENDARY";
}

function normalizeKeyPart(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function toDiscoveryFeed(events: ServerActivity[]): DiscoveryFeedItem[] {
  const mintedKeys = new Set(
    events
      .filter((event) => event.type === "mint")
      .map(
        (event) =>
          `${normalizeKeyPart(event.agentId)}:${normalizeKeyPart(event.metadata?.itemName)}`,
      ),
  );

  return events
    .filter((event) => event.type === "craft")
    .filter((event) => event.metadata?.isMegaMind === true)
    .slice(0, 5)
    .map((event) => {
      const itemName = String(event.metadata?.itemName ?? "Unknown");
      const tier = isTier(event.metadata?.tier) ? event.metadata?.tier : "COMMON";
      const eventEmojis = Array.isArray(event.metadata?.emojis)
        ? event.metadata?.emojis.filter(Boolean)
        : [];

      return {
        name: itemName,
        emoji: eventEmojis.length > 0 ? String(eventEmojis[0]) : "✨",
        tier,
        discoverer: event.username ?? event.agentId,
        time: getRelativeTime(event.timestamp),
        minted: mintedKeys.has(
          `${normalizeKeyPart(event.agentId)}:${normalizeKeyPart(itemName)}`,
        ),
      };
    });
}
