import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRecentActivity, recordMint, type AgentType, type AgentID } from "@/server/game-state";
import { securityMiddleware } from "@/lib/auth/middleware";
import { isWhitelistedForMint, PRICES, verifyX402Payment } from "@/lib/x402";
import { createPublicClient, http, type Address } from "viem";
import { base, mainnet, arbitrum, optimism, polygon } from "viem/chains";

// Map of supported chain IDs to viem chain objects
const CHAIN_MAP: Record<number, typeof base> = {
  1: mainnet,
  8453: base,
  84532: base,
  42161: arbitrum,
  10: optimism,
  137: polygon,
};

async function verifyTxOnChain(txHash: string, chainId: number, address: string): Promise<boolean> {
  if (process.env.NODE_ENV === "development" || process.env.X402_USE_TESTNET === "true") {
    console.warn(`[SECURITY] TX verification bypassed in dev mode for mint: ${txHash}`);
    return txHash?.startsWith("0x") && txHash.length === 66;
  }
  
  try {
    const chain = CHAIN_MAP[chainId];
    if (!chain) return false;
    
    const client = createPublicClient({ chain, transport: http() });
    const tx = await client.getTransaction({ hash: txHash as `0x${string}` });
    if (!tx) return false;
    
    return tx.from.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

export const dynamic = "force-dynamic";

const mintSchema = z.object({
  // Agent identification
  agentId: z.union([z.number().int().positive(), z.string().trim().min(1).max(100)]),
  agentType: z.enum(["farcaster", "x40", "ens", "solana"]).default("farcaster"),
  
  // Player info
  username: z.string().trim().min(1).max(50).optional(),
  address: z.string().trim().min(1).max(100).optional(),
  fid: z.number().int().positive().optional(),
  
  // Mint data
  itemName: z.string().trim().min(1).max(80),
  tokenId: z.number().int().positive().optional(),
  txHash: z.string().trim().min(1).max(100).optional(),
  chainId: z.number().int().positive().optional(),
  
  // X402 payment data
  x402Amount: z.string().optional(),
  x402Data: z.record(z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(rawLimit) ? rawLimit : 20;
  const events = await getRecentActivity(limit, "mint");

  return NextResponse.json({
    ok: true,
    events: events.filter(Boolean),
  });
}

export async function POST(request: NextRequest) {
  // First, run through security middleware for authentication
  const middlewareResult = await securityMiddleware(request, {
    requireAuth: true,
    agentTypes: ["farcaster", "x40", "ens", "solana"],
  });
  
  if (middlewareResult) {
    return middlewareResult;
  }

  const payload = await request.json().catch(() => null);
  const parsed = mintSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid mint payload",
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
  
  // SECURITY: Headers from middleware take precedence over body
  // This ensures the authenticated agent matches the agent being updated
  if (!agentIdHeader || !agentTypeHeader || !addressHeader) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing authenticated agent headers",
      },
      { status: 401 },
    );
  }
  
  const data = parsed.data;
  
  // Validate that body agent info matches headers (prevent spoofing)
  const agentId: AgentID = agentTypeHeader === "farcaster" 
    ? parseInt(agentIdHeader) || agentIdHeader 
    : agentIdHeader;
  const agentType: AgentType = agentTypeHeader as AgentType;
  const address = addressHeader;
  const fid = fidHeader ? parseInt(fidHeader) : undefined;
  const username = usernameHeader || data.username;
  
  // Check if this address is whitelisted for free minting
  const isWhitelisted = address ? isWhitelistedForMint(address) : false;
  const mintPrice = isWhitelisted ? PRICES.mintWhitelisted : PRICES.mint;
  
  // If not whitelisted, the x402 middleware should have already charged $0.05
  // But since we removed /api/mint from middleware matcher, we need to verify payment here
  // For now, in development, we'll allow both paid and free minting
  // In production, we'd need to verify the x402 payment manually
  
  // Track the price that was (or should be) paid
  let x402Amount: bigint | undefined;
  let x402Paid = false;
  let x402Protocol: string | undefined;
  
  if (data.x402Amount) {
    try {
      x402Amount = BigInt(data.x402Amount);
    } catch {
      // Invalid bigint string
    }
  }
  
  // Verify transaction and payment
  if (address && data.txHash && data.chainId) {
    const txVerified = await verifyTxOnChain(data.txHash, data.chainId, finalAddress);
    
    if (txVerified) {
      // For whitelisted users, no x402 payment required (gas only)
      if (isWhitelisted) {
        x402Paid = true;
        x402Protocol = "X402-whitelisted";
        x402Amount = 0n;
      } else {
        // Verify X402 payment amount
        x402Paid = await verifyX402Payment(data.txHash as `0x${string}`, x402Amount || 0n, data.chainId, address);
        x402Protocol = "X402";
      }
    }
  } else if (isWhitelisted) {
    // Whitelisted users can mint without transaction (admin feature)
    x402Paid = true;
    x402Protocol = "X402-whitelisted";
    x402Amount = 0n;
  }

  const result = await recordMint({
    agentId,
    agentType,
    username,
    address,
    fid,
    itemName: data.itemName,
    tokenId: data.tokenId,
    txHash: data.txHash,
    chainId: data.chainId,
    x402Amount: isWhitelisted ? 0n : x402Amount,
    x402Data: {
      ...data.x402Data,
      isWhitelisted,
      price: mintPrice,
    },
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
    x402Paid,
    x402Protocol,
    price: mintPrice,
    isWhitelisted,
    player: {
      ...result.player,
      x402Spent: result.player.x402Spent.toString(),
    },
  });
}
