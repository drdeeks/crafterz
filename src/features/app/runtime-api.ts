type ApiResponse<T> = T | null;

export type ServerPlayer = {
  fid: number;
  username: string;
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
  type: "craft" | "mint" | "gm";
  fid: number;
  username: string;
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
      fid,
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
      fid,
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
    body: JSON.stringify(input),
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
    body: JSON.stringify(input),
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
    body: JSON.stringify(input),
  });

  return response?.ok ? response.player ?? null : null;
}
