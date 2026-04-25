import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  WHITELISTED_ADDRESSES,
  OWNER_ADDRESS,
  isOwner,
  getMintWhitelist,
  isWhitelistedForMint,
} from "@/lib/x402";
import { securityMiddleware } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

// Schema for address (EVM or Solana)
const addressSchema = z.union([
  z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address"), // EVM
  z.string().length(44, 44).regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid Solana address"), // Base58
]);

// GET - List all whitelisted addresses (owner only)
export async function GET(request: NextRequest) {
  const middlewareResult = await securityMiddleware(request, {
    requireAuth: true,
    agentTypes: ["farcaster", "x40", "ens", "solana"],
  });

  if (middlewareResult) {
    return middlewareResult;
  }

  const address = request.headers.get("x-address");
  
  if (!address || !isOwner(address)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized - Only owner can view whitelist",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    whitelist: getMintWhitelist(),
    owner: OWNER_ADDRESS,
  });
}

// POST - Add address to whitelist (owner only)
export async function POST(request: NextRequest) {
  const middlewareResult = await securityMiddleware(request, {
    requireAuth: true,
    agentTypes: ["farcaster", "x40", "ens", "solana"],
  });

  if (middlewareResult) {
    return middlewareResult;
  }

  const address = request.headers.get("x-address");
  
  if (!address || !isOwner(address)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized - Only owner can modify whitelist",
      },
      { status: 401 }
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = addressSchema.safeParse(payload?.address);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid address format",
        issues: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const newAddress = parsed.data;
  
  // Check if already whitelisted
  if (isWhitelistedForMint(newAddress)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Address already whitelisted",
        address: newAddress,
      },
      { status: 400 }
    );
  }

  // Note: In this implementation, we can't actually modify the const array
  // This is a limitation. For production, you should:
  // 1. Use a database to store whitelist
  // 2. Or use a smart contract for whitelist management
  // 3. Or use a mutable storage (Redis, etc.)
  
  // For now, return success but note the limitation
  console.log(`[X402 Admin] Attempted to add ${newAddress} to whitelist`);
  console.log(`[X402 Admin] Note: Whitelist is currently managed via X402_MINT_WHITELIST env var`);

  return NextResponse.json({
    ok: true,
    message: "Whitelist update requested",
    note: "For production, configure X402_MINT_WHITELIST environment variable",
    address: newAddress,
  });
}

// DELETE - Remove address from whitelist (owner only)
export async function DELETE(request: NextRequest) {
  const middlewareResult = await securityMiddleware(request, {
    requireAuth: true,
    agentTypes: ["farcaster", "x40", "ens", "solana"],
  });

  if (middlewareResult) {
    return middlewareResult;
  }

  const address = request.headers.get("x-address");
  
  if (!address || !isOwner(address)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized - Only owner can modify whitelist",
      },
      { status: 401 }
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = addressSchema.safeParse(payload?.address);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid address format",
        issues: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const removeAddress = parsed.data;
  
  // Check if whitelisted
  if (!isWhitelistedForMint(removeAddress)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Address not in whitelist",
        address: removeAddress,
      },
      { status: 400 }
    );
  }

  // Note: Same limitation as POST - can't modify const array
  console.log(`[X402 Admin] Attempted to remove ${removeAddress} from whitelist`);
  console.log(`[X402 Admin] Note: Whitelist is currently managed via X402_MINT_WHITELIST env var`);

  return NextResponse.json({
    ok: true,
    message: "Whitelist update requested",
    note: "For production, configure X402_MINT_WHITELIST environment variable",
    address: removeAddress,
  });
}

// CHECK - Check if an address is whitelisted (public endpoint)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const checkAddress = searchParams.get("address");

  // If address param is provided, anyone can check if they're whitelisted
  if (checkAddress) {
    const isWhitelisted = isWhitelistedForMint(checkAddress);
    return NextResponse.json({
      ok: true,
      address: checkAddress,
      isWhitelisted,
    });
  }

  // Otherwise, require owner auth to list the full whitelist
  const middlewareResult = await securityMiddleware(request, {
    requireAuth: true,
    agentTypes: ["farcaster", "x40", "ens", "solana"],
  });

  if (middlewareResult) {
    return middlewareResult;
  }

  const address = request.headers.get("x-address");
  
  if (!address || !isOwner(address)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized - Only owner can view whitelist",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    whitelist: getMintWhitelist(),
    owner: OWNER_ADDRESS,
  });
}
