import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRecentActivity, recordGm, type AgentType, type AgentID } from "@/server/game-state";
import { securityMiddleware } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

const gmSchema = z.object({
  // Agent identification
  agentId: z.union([z.number().int().positive(), z.string().trim().min(1).max(100)]),
  agentType: z.enum(["farcaster", "x40", "ens", "solana"]).default("farcaster"),
  
  // Player info
  username: z.string().trim().min(1).max(50).optional(),
  address: z.string().trim().min(1).max(100).optional(),
  fid: z.number().int().positive().optional(),
  
  // GM data
  chain: z.string().trim().min(1).max(32),
  txHash: z.string().trim().min(1).max(100).optional(),
  chainId: z.number().int().positive().optional(),
  
  // X402 payment data
  x402Amount: z.string().optional(),
  x402Data: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(rawLimit) ? rawLimit : 20;
  const events = await getRecentActivity(limit, "gm");

  return NextResponse.json({
    ok: true,
    events: events.filter(Boolean),
  });
}

export async function POST(request: NextRequest) {
  // Run through security middleware
  const middlewareResult = await securityMiddleware(request, {
    requireAuth: true,
    agentTypes: ["farcaster", "x40", "ens", "solana"],
  });
  
  if (middlewareResult) {
    return middlewareResult;
  }

  const payload = await request.json().catch(() => null);
  const parsed = gmSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid GM payload",
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
  
  const agentId: AgentID = agentTypeHeader === "farcaster" 
    ? parseInt(agentIdHeader) || agentIdHeader 
    : agentIdHeader;
  const agentType: AgentType = agentTypeHeader as AgentType;
  const address = addressHeader || data.address || "";
  const fid = fidHeader ? parseInt(fidHeader) : (agentType === "farcaster" ? (typeof agentId === "number" ? agentId : undefined) : undefined);
  const username = usernameHeader || data.username;
  
  // Convert x402Amount from string to bigint
  let x402Amount: bigint | undefined;
  if (data.x402Amount) {
    try {
      x402Amount = BigInt(data.x402Amount);
    } catch {
      // Invalid bigint string
    }
  }

  const result = await recordGm({
    agentId,
    agentType,
    username,
    address,
    fid,
    chain: data.chain,
    txHash: data.txHash,
    chainId: data.chainId,
    x402Amount,
    x402Data: data.x402Data,
  });

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
      x402Spent: result.player.x402Spent.toString(),
    },
  });
}
