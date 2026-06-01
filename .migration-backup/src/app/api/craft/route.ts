import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRecentActivity, recordCraft } from "@/server/game-state";
import { securityMiddleware } from "@/lib/auth/middleware";
import { getX402Config } from "@/lib/payments/x402";

// Don't require auth for GET requests (public read access)
export const dynamic = "force-dynamic";

// Updated schema for agent-agnostic crafting
const createCraftSchema = z.object({
  // Agent identification
  agentId: z.union([z.number().int().positive(), z.string().trim().min(1).max(100)]),
  agentType: z.enum(["farcaster", "x40", "ens", "solana"]).default("farcaster"),
  
  // Player info
  username: z.string().trim().min(1).max(50).optional(),
  address: z.string().trim().min(1).max(100).optional(),
  fid: z.number().int().positive().optional(),
  
  // Craft data
  itemName: z.string().trim().min(1).max(80),
  tier: z.enum(["COMMON", "RARE", "LEGENDARY"]).default("COMMON"),
  ingredients: z.array(z.string().trim().min(1).max(40)).max(5).optional(),
  emojis: z.array(z.string().trim().min(1).max(4)).max(2).optional(),
  isMegaMind: z.boolean().optional(),
  pointsAwarded: z.number().int().min(0).max(500).optional(),
  
  // Optional X402 payment data
  x402Amount: z.string().optional(), // bigint as string for JSON compatibility
  chainId: z.number().int().positive().optional(),
  txHash: z.string().trim().min(1).max(100).optional(),
  x402Data: z.record(z.string(), z.unknown()).optional(), // Protocol-specific data
});

export async function GET(request: NextRequest) {
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(rawLimit) ? rawLimit : 20;
  const events = await getRecentActivity(limit, "craft");

  // Filter out any null/undefined events
  const filteredEvents = events.filter(Boolean);

  return NextResponse.json({
    ok: true,
    events: filteredEvents,
  });
}

export async function POST(request: NextRequest) {
  // First, run through security middleware
  const middlewareResult = await securityMiddleware(request, {
    requireAuth: true,
    agentTypes: ["farcaster", "x40", "ens", "solana"],
  });
  
  if (middlewareResult) {
    return middlewareResult;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createCraftSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid craft payload",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  // Extract agent info from headers (set by middleware) - these are AUTHENTICATED
  const agentIdHeader = request.headers.get("x-agent-id");
  const agentTypeHeader = request.headers.get("x-agent-type");
  const addressHeader = request.headers.get("x-address");
  const fidHeader = request.headers.get("x-fid");
  const usernameHeader = request.headers.get("x-username");
  
  if (!agentIdHeader || !agentTypeHeader) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing authenticated agent headers",
      },
      { status: 401 },
    );
  }
  
  const data = parsed.data;
  
  const agentId = agentTypeHeader === "farcaster" 
    ? parseInt(agentIdHeader) || agentIdHeader 
    : agentIdHeader;
  const agentType = agentTypeHeader as "farcaster" | "x40" | "ens" | "solana";
  const address = addressHeader || data.address || "";
  const fid = fidHeader ? parseInt(fidHeader) : (agentType === "farcaster" ? (typeof agentId === "number" ? agentId : undefined) : undefined);
  const username = usernameHeader || data.username;
  
  // Optional: Allow body to provide additional context but never override auth
  if (data.username && !username) {
    // Only use body username if headers don't have it
    // This allows clients to provide username for display
  }
  
  // Convert x402Amount from string to bigint
  let x402Amount: bigint | undefined;
  if (data.x402Amount) {
    try {
      x402Amount = BigInt(data.x402Amount);
    } catch {
      // Invalid bigint string
    }
  }

  const result = await recordCraft({
    agentId,
    agentType,
    username,
    address,
    fid,
    itemName: data.itemName,
    tier: data.tier,
    ingredients: data.ingredients,
    emojis: data.emojis,
    isMegaMind: data.isMegaMind,
    pointsAwarded: data.pointsAwarded,
    x402Amount,
    chainId: data.chainId,
    txHash: data.txHash,
    x402Data: data.x402Data,
  });

  // Handle null player (invalid request)
  if (!result.player) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid agent data",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    awardedPoints: result.awardedPoints,
    player: {
      ...result.player,
      // Convert bigint to string for JSON serialization
      x402Spent: result.player.x402Spent.toString(),
    },
  });
}
