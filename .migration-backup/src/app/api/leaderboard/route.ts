import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard, getRecentActivity } from "@/server/game-state";

export const dynamic = "force-dynamic";

// Leaderboard is public - no auth required
export async function GET(request: NextRequest) {
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(rawLimit) ? rawLimit : 50;

  const [leaderboard, recentActivity] = await Promise.all([
    getLeaderboard(limit),
    getRecentActivity(20),
  ]);

  // Convert bigint to string for JSON serialization
  const serializableLeaderboard = leaderboard.map(player => ({
    ...player,
    x402Spent: player.x402Spent.toString(),
  }));

  const serializableActivity = recentActivity.map(event => ({
    ...event,
    x402Amount: event.x402Amount ? event.x402Amount.toString() : undefined,
  }));

  return NextResponse.json({
    ok: true,
    leaderboard: serializableLeaderboard,
    recentActivity: serializableActivity,
  });
}
