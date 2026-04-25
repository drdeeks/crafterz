import type { NextRequest } from "next/server";
import { paymentProxy } from "@x402/next";
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

// Get the appropriate network based on mode
const getNetwork = (mainnet: string, testnet: string) => (isTestnet ? testnet : mainnet);

// Default wallet address - MUST be configured for production
const X402_EVM_ADDRESS = process.env.X402_EVM_ADDRESS || "0x0000000000000000000000000000000000000000";

// Define protected routes with x402
const X402_PROTECTED_ROUTES = {
  // Protect craft endpoint - requires payment for crafting
  "/api/craft": {
    accepts: [
      {
        scheme: "exact",
        price: process.env.X402_CRAFT_PRICE || "$0.01",
        network: getNetwork("eip155:8453", "eip155:84532"), // Base
        payTo: X402_EVM_ADDRESS,
      },
    ],
    description: "Craft an item in CrafterZ game",
  },
  
  // Protect gm endpoint - requires payment for GM
  "/api/gm": {
    accepts: [
      {
        scheme: "exact",
        price: process.env.X402_GM_PRICE || "$0.50",
        network: getNetwork("eip155:8453", "eip155:84532"),
        payTo: X402_EVM_ADDRESS,
      },
    ],
    description: "GM (Good Morning) transaction in CrafterZ",
  },
  
  // Protect mint endpoint - requires payment for minting ($0.05 per MegaMind)
  "/api/mint": {
    accepts: [
      {
        scheme: "exact",
        price: process.env.X402_MINT_PRICE || "$0.05",
        network: getNetwork("eip155:8453", "eip155:84532"),
        payTo: X402_EVM_ADDRESS,
      },
    ],
    description: "Mint a MegaMind NFT in CrafterZ",
  },
  
  // Protect tasks endpoint - requires payment for completing tasks
  "/api/tasks": {
    accepts: [
      {
        scheme: "exact",
        price: process.env.X402_TASK_PRICE || "$0.01",
        network: getNetwork("eip155:8453", "eip155:84532"),
        payTo: X402_EVM_ADDRESS,
      },
    ],
    description: "Complete daily tasks in CrafterZ",
  },
};

// Create payment proxy with sync disabled in dev (avoid facilitator calls)
export const proxy = paymentProxy(
  X402_PROTECTED_ROUTES,
  resourceServer,
  undefined,
  undefined,
  !isTestnet // Only sync facilitator on start in production
);

// Configure middleware to run on specific paths
// Note: /api/mint is handled separately to support whitelisted free minting
export const config = {
  matcher: ["/api/craft", "/api/gm", "/api/tasks"],
};

// Export for use in API routes
export { resourceServer, facilitatorClient, isTestnet };
