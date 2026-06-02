type ApiResponse<T> = T | null;

export type ServerPlayer = {
  agentId: string;
  agentType: string;
  username?: string;
  fid?: number;
  points: number;
  crafts: number;
  megaMinds: number;
  minted: number;
  gmCount: number;
  lastUpdatedAt: string;
  rank?: number;
};

export type ServerActivity = {
  id: string;
  type: "craft" | "mint" | "gm" | "x40_payment";
  agentId: string;
  agentType: string;
  username?: string;
  fid?: number;
  pointsAwarded: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type ServerTask = {
  id: string;
  type:
    | "gm_onchain"
    | "craft_target"
    | "mint_megamind"
    | "craft_count"
    | "craft_rare"
    | "craft_legendary"
    | "craft_combo_chain"
    | "discover_new";
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

export type ServerCaption = {
  id: string;
  itemName: string;
  discovererUsername: string;
  tier: string;
  ingredients: string[];
  captionText: string;
  isAiGenerated: boolean;
  hahCount: number;
  reportCount: number;
  isSuppressed: boolean;
  createdAt: string;
};

export type ServerHeist = {
  id: string;
  challengerFid: number;
  defenderFid: number | null;
  defenderUsername: string;
  targetItemName: string;
  targetItemEmojis: string[];
  targetItemTier: string;
  status: string;
  entryCraftz: number;
  challengerItemName?: string;
  challengerItemTier?: string;
  defenderItemName?: string;
  defenderItemTier?: string;
  challengerScore?: number;
  defenderScore?: number;
  winnerFid: number | null;
  pointsAwarded: number;
  rivalryTokenEarned: boolean;
  paymentMethod: string;
  createdAt: string;
  resolvedAt?: string;
};

type LeaderboardResponse = {
  ok: boolean;
  leaderboard: ServerPlayer[];
  recentActivity: ServerActivity[];
};

type TasksResponse = {
  ok: boolean;
  tasks: ServerTask[];
};

type MutationResponse = {
  ok: boolean;
  player?: ServerPlayer;
  tasks?: ServerTask[];
};

const REQUEST_TIMEOUT_MS = 10000;

async function requestJson<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(path, {
      ...options,
      signal: options?.signal ?? controller.signal,
      headers: {
        "content-type": "application/json",
        ...(options?.headers ?? {}),
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchLeaderboardSnapshot(limit = 50) {
  const response = await requestJson<LeaderboardResponse>(
    `/api/leaderboard?limit=${limit}`,
  );

  return response?.ok ? response : null;
}

export async function fetchTasks(fid: number) {
  const response = await requestJson<TasksResponse>(`/api/tasks?fid=${fid}`);
  return response?.ok ? response.tasks : null;
}

export async function progressTask(fid: number, taskId: string, amount = 1) {
  const response = await requestJson<MutationResponse>("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      agentId: fid,
      agentType: "farcaster",
      taskId,
      action: "progress",
      amount,
    }),
  });

  return response?.ok ? response.tasks ?? null : null;
}

export async function completeTask(fid: number, taskId: string) {
  const response = await requestJson<MutationResponse>("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      agentId: fid,
      agentType: "farcaster",
      taskId,
      action: "complete",
    }),
  });

  return response?.ok ? response.tasks ?? null : null;
}

export async function postCraftEvent(input: {
  fid: number;
  username: string;
  itemName: string;
  tier: "COMMON" | "RARE" | "LEGENDARY";
  ingredients: string[];
  emojis: string[];
  isMegaMind: boolean;
  pointsAwarded: number;
}) {
  const response = await requestJson<MutationResponse>("/api/craft", {
    method: "POST",
    body: JSON.stringify({
      agentId: input.fid,
      agentType: "farcaster",
      username: input.username,
      itemName: input.itemName,
      tier: input.tier,
      ingredients: input.ingredients,
      emojis: input.emojis,
      isMegaMind: input.isMegaMind,
      pointsAwarded: input.pointsAwarded,
    }),
  });

  return response?.ok ? response.player ?? null : null;
}

export async function postMintEvent(input: {
  fid: number;
  username: string;
  itemName: string;
  tokenId?: number;
  txHash?: string;
}) {
  const response = await requestJson<MutationResponse>("/api/mint", {
    method: "POST",
    body: JSON.stringify({
      agentId: input.fid,
      agentType: "farcaster",
      username: input.username,
      itemName: input.itemName,
      tokenId: input.tokenId,
      txHash: input.txHash,
    }),
  });

  return response?.ok ? response.player ?? null : null;
}

export async function postGmEvent(input: {
  fid: number;
  username: string;
  chain: string;
  txHash?: string;
}) {
  const response = await requestJson<MutationResponse>("/api/gm", {
    method: "POST",
    body: JSON.stringify({
      agentId: input.fid,
      agentType: "farcaster",
      username: input.username,
      chain: input.chain,
      txHash: input.txHash,
    }),
  });

  return response?.ok ? response.player ?? null : null;
}

// ─── Captions (Comedy Feed) ──────────────────────────────────────────────────

export async function fetchCaptions(limit = 20) {
  const response = await requestJson<{ ok: boolean; captions: ServerCaption[] }>(
    `/api/captions?limit=${limit}`,
  );
  return response?.ok ? response.captions : [];
}

export async function reactToCaption(id: string) {
  await requestJson<{ ok: boolean }>(`/api/captions/${id}/react`, { method: "POST", body: "{}" });
}

export async function reportCaption(id: string) {
  await requestJson<{ ok: boolean }>(`/api/captions/${id}/report`, { method: "POST", body: "{}" });
}

// ─── Heists ──────────────────────────────────────────────────────────────────

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
}) {
  const response = await requestJson<{ ok: boolean; heist: ServerHeist; pointsAwarded: number }>(
    "/api/heists/initiate",
    { method: "POST", body: JSON.stringify(input) },
  );
  return response?.ok ? response : null;
}

export async function fetchHeists(fid: number) {
  const response = await requestJson<{ ok: boolean; heists: ServerHeist[] }>(
    `/api/heists?fid=${fid}`,
  );
  return response?.ok ? response.heists : [];
}

// ─── Live Feed ────────────────────────────────────────────────────────────────

export type FeedEventKind =
  | "craft"
  | "megamind"
  | "heist_win"
  | "heist_loss"
  | "propaganda"
  | "mint";

export type ServerFeedEvent = {
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
};

export async function fetchFeed(limit = 30) {
  const response = await requestJson<{ ok: boolean; events: ServerFeedEvent[] }>(
    `/api/feed?limit=${limit}`,
  );
  return response?.ok ? response.events : [];
}
