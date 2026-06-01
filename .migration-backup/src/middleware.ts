import type { NextRequest } from "next/server";
import { paymentProxy } from "@x402/next";
import type { Address } from "viem";
import type { AgentID } from "@/types/shared";
import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";

// Determine if we're in testnet mode
const isTestnet = process.env.X402_USE_TESTNET === "true" || process.env.NODE_ENV === "development";

// Initialize x402 facilitator client
const facilitatorClient = new HTTPFacilitatorClient({
  url: isTestnet
    ? "https://x402.org/facilitator"
    : process.env.X402_FACILITATOR_URL || "https://api.cdp.coinbase.com/platform/v2/x402",
});

// Create resource server with EVM and SVM support
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register("eip155:*", new ExactEvmScheme())
  .register("solana:*", new ExactSvmScheme());

// Default wallet address - MUST be configured for production
const X402_EVM_ADDRESS = process.env.X402_EVM_ADDRESS || "0x0000000000000000000000000000000000000000";

// Define protected routes with x402
const X402_PROTECTED_ROUTES = {
  "/api/craft": {
    accepts: [
      {
        scheme: "exact",
        price: process.env.X402_CRAFT_PRICE || "$0.01",
        network: "eip155:8453" as `${string}:${string}`,
        payTo: X402_EVM_ADDRESS,
      },
    ],
    description: "Craft an item in CrafterZ game",
  },
  
  "/api/gm": {
    accepts: [
      {
        scheme: "exact",
        price: process.env.X402_GM_PRICE || "$0.50",
        network: "eip155:8453" as `${string}:${string}`,
        payTo: X402_EVM_ADDRESS,
      },
    ],
    description: "GM (Good Morning) transaction in CrafterZ",
  },
  
  "/api/mint": {
    accepts: [
      {
        scheme: "exact",
        price: process.env.X402_MINT_PRICE || "$0.05",
        network: "eip155:8453" as `${string}:${string}`,
        payTo: X402_EVM_ADDRESS,
      },
    ],
    description: "Mint a MegaMind NFT in CrafterZ",
  },
  
  "/api/tasks": {
    accepts: [
      {
        scheme: "exact",
        price: process.env.X402_CRAFT_PRICE || "$0.01",
        network: "eip155:8453" as `${string}:${string}`,
        payTo: X402_EVM_ADDRESS,
      },
    ],
    description: "Complete daily tasks in CrafterZ",
  },
};

// Create payment proxy with sync disabled in dev (avoid facilitator calls)
const x402Proxy = paymentProxy(
  X402_PROTECTED_ROUTES,
  resourceServer,
  undefined,
  undefined,
  !isTestnet
);

// Next.js requires a "middleware" function export
export function middleware(request: NextRequest) {
  return x402Proxy(request);
}

// Configure middleware to run on specific paths
// Note: /api/mint is excluded from matcher — handled separately for whitelisted free minting
export const config = {
  matcher: ["/api/craft", "/api/gm", "/api/tasks"],
};
