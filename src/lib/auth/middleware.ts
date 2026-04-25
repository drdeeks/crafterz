import { NextRequest, NextResponse } from "next/server";
import { RateLimiter } from "./rate-limiter";
import { verifyAgentSignature } from "./agents";
import { verifyNonce } from "./nonce";

// Rate limiter: 100 requests per minute per IP
const rateLimiter = new RateLimiter(100, 60000);

// Nonce storage (in production, use Redis)
const nonceStore = new Set<string>();

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
  { requireAuth = true, agentTypes = ["farcaster", "x40", "ens", "solana"] }: {
    requireAuth: boolean;
    agentTypes: string[];
  } = {},
) {
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";
  const path = request.nextUrl.pathname;

  // 1. Rate limiting
  const rateLimitResult = rateLimiter.check(ip, path);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Rate limit exceeded",
        retryAfter: rateLimitResult.retryAfter,
      },
      { status: 429 },
    );
  }

  // 2. Skip auth for GET requests if not required
  if (request.method === "GET" && !requireAuth) {
    return null; // Continue without auth
  }

  // 3. For POST/PUT/DELETE or GET with auth required, verify agent
  if (requireAuth) {
    try {
      const agent = await extractAndVerifyAgent(request, { agentTypes });
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
 * Extract agent information from request and verify signature
 */
async function extractAndVerifyAgent(
  request: NextRequest,
  { agentTypes }: { agentTypes: string[] },
): Promise<AuthenticatedAgent | null> {
  const agentId = request.headers.get("x-agent-id");
  const agentType = request.headers.get("x-agent-type");
  const signature = request.headers.get("x-signature");
  const message = request.headers.get("x-message");

  if (!agentId || !agentType || !signature) {
    return null;
  }

  if (!agentTypes.includes(agentType)) {
    return null;
  }

  const body = await request.json().catch(() => ({}));
  const rawBody = JSON.stringify(body);

  // Verify the signature matches the request
  const verified = await verifyAgentSignature({
    agentId,
    agentType,
    signature,
    message,
    body: rawBody,
    path: request.nextUrl.pathname,
    method: request.method,
    timestamp: request.headers.get("x-timestamp"),
  });

  if (!verified) {
    return null;
  }

  // Resolve agent details based on type
  let address = "";
  let fid: number | undefined;
  let username: string | undefined;

  if (agentType === "farcaster") {
    // For Farcaster, agentId should be the FID
    fid = parseInt(agentId);
    address = verified.address;
    username = request.headers.get("x-username") || undefined;
  } else if (agentType === "x40") {
    // x40 agent
    address = agentId; // For x40, agentId is the address
  } else if (agentType === "ens" || agentType === "solana") {
    address = agentId;
  }

  return {
    agentId,
    agentType,
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
