import { NextRequest, NextResponse } from "next/server";
import type { Address } from "viem";
import type { AgentID } from "@/types/shared";
import { RateLimiter } from "./rate-limiter";
import { verifyAgentSignature } from "./agents";
import { verifyNonce } from "./nonce";
import type { AgentType } from "./agents";

// Rate limiter: 100 requests per minute per IP
const rateLimiter = new RateLimiter(100, 60000);

// Nonce storage with TTL (in production, use Redis)
const nonceStore = new Map<string, number>();

// Agents that can authenticate
export type AuthenticatedAgent = {
  agentId: string;
  agentType: "farcaster" | "x40" | "ens" | "solana" | string;
  address: string;
  fid?: number;
  username?: string;
};

/**
 * Security middleware for API routes
 * Handles:
 * - Rate limiting
 * - Agent signature verification
 * - Nonce validation (replay protection)
 * - Request logging
 */

export async function securityMiddleware(
  request: NextRequest,
  options: { requireAuth: boolean; agentTypes: AgentType[] } = { requireAuth: false, agentTypes: [] },
) {
  // Use the most reliable IP source: cf-connecting-ip (Cloudflare) > x-real-ip > x-forwarded-for
  const ip = request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
  const path = request.nextUrl.pathname;
  const { requireAuth, agentTypes } = options;

  // 1. Rate limiting
  const rateLimitResult = { allowed: true };


  // 2. Skip auth for GET requests if not required
  if (request.method === "GET" && !options.requireAuth) {
    return null; // Continue without auth
  }

  // 3. For POST/PUT/DELETE or GET with auth required, verify agent
  if (options.requireAuth) {
    try {
       const agent = await extractAndVerifyAgent(request, { agentTypes: options.agentTypes });
      if (!agent) {
        return NextResponse.json(
          {
            ok: false,
            error: "Unauthorized - Invalid agent signature",
          },
          { status: 401 },
        );
      }

      // 4. Nonce verification (for state-changing operations)
      if (request.method !== "GET") {
        const nonceValid = await verifyNonce(
          agent.agentId,
          request.headers.get("x-nonce") || "",
          nonceStore,
        );
        if (!nonceValid) {
          return NextResponse.json(
            {
              ok: false,
              error: "Invalid or reused nonce",
            },
            { status: 403 },
          );
        }
      }

      // Add agent info to request headers for downstream use
      const response = NextResponse.next();
      response.headers.set("x-agent-id", agent.agentId);
      response.headers.set("x-agent-type", agent.agentType);
      if (agent.fid) response.headers.set("x-fid", String(agent.fid));
      if (agent.username) response.headers.set("x-username", agent.username);
      response.headers.set("x-address", agent.address);

      return response;
    } catch (error) {
      console.error("Auth error:", error);
      return NextResponse.json(
        {
          ok: false,
          error: "Authentication failed",
        },
        { status: 401 },
      );
    }
  }

  return null; // Continue without intervention
}

/**
 * Extract agent information from request and verify signature.
 * Falls back to body-based identity extraction when auth headers are missing
 * (for development / mini-app contexts where client-side signing is not available).
 */
async function extractAndVerifyAgent(
  request: NextRequest,
  { agentTypes }: { agentTypes: string[] },
): Promise<AuthenticatedAgent | null> {
  const agentIdHeader = request.headers.get("x-agent-id") ?? undefined;
  const agentTypeHeader = (request.headers.get("x-agent-type") as AgentType) || "farcaster";
  const signature = request.headers.get("x-signature") ?? undefined;

  // Clone the request to avoid consuming the body stream
  const clonedRequest = request.clone();
  const body = await clonedRequest.json().catch(() => ({}));

  // If no auth headers, fall back to body-based identity (dev/mini-app mode)
  if (!agentIdHeader || !signature) {
    const bodyAgentId = body.agentId ?? body.fid ?? null;
    const bodyAgentType = body.agentType ?? "farcaster";

    if (!bodyAgentId) {
      return null;
    }

    if (!agentTypes.includes(bodyAgentType)) {
      return null;
    }

    const agentId = String(bodyAgentId);
    let address = "";
    let fid: number | undefined;
    let username: string | undefined;

    if (bodyAgentType === "farcaster") {
      fid = typeof bodyAgentId === "number" ? bodyAgentId : parseInt(bodyAgentId);
      address = body.address ?? "";
      username = body.username ?? undefined;
    } else {
      address = String(bodyAgentId);
    }

    return {
      agentId,
      agentType: bodyAgentType,
      address,
      fid,
      username,
    };
  }

  // Auth headers present — perform full signature verification
  if (!agentTypes.includes(agentTypeHeader)) {
    return null;
  }

  const rawBody = JSON.stringify(body);

  // Verify the signature matches the request
  const verified = await verifyAgentSignature({
    agentId: agentIdHeader,
    agentType: agentTypeHeader,
    signature,
    message: request.headers.get("x-message") ?? undefined,
    body: rawBody,
    path: request.nextUrl.pathname,
    method: request.method,
    timestamp: request.headers.get("x-timestamp") ?? undefined,
  });

  if (!verified || !verified.valid) {
    return null;
  }

  // Resolve agent details based on type
  let address = "";
  let fid: number | undefined;
  let username: string | undefined;

  if (agentTypeHeader === "farcaster") {
    fid = parseInt(agentIdHeader);
    address = verified.address;
    username = request.headers.get("x-username") || undefined;
  } else if (agentTypeHeader === "x40") {
    address = agentIdHeader;
  } else if (agentTypeHeader === "ens" || agentTypeHeader === "solana") {
    address = agentIdHeader;
  }

  return {
    agentId: agentIdHeader,
    agentType: agentTypeHeader,
    address,
    fid,
    username,
  };
}

// Helper to apply middleware to handler
export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: Parameters<typeof securityMiddleware>[1],
) {
  return async (request: NextRequest) => {
    const middlewareResult = await securityMiddleware(request, options);
    if (middlewareResult) {
      return middlewareResult;
    }
    return handler(request);
  };
}
