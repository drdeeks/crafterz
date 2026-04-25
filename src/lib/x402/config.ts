/**
 * X402 Payment Protocol Configuration for CrafterZ
 * 
 * X402 is an HTTP-native payment standard that uses HTTP 402 Payment Required
 * to enable programmatic payments between clients and servers.
 * 
 * See: https://x402.org
 * Docs: https://docs.x402.org
 */

import { ExactEvmScheme } from "@x402/evm/exact/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";

// Network identifiers (CAIP-2 format)
export const NETWORKS = {
  // Base (EVM)
  BASE_MAINNET: "eip155:8453",
  BASE_SEPOLIA: "eip155:84532",
  
  // Solana (SVM)
  SOLANA_MAINNET: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  SOLANA_DEVNET: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  
  // Ethereum (EVM)
  ETHEREUM_MAINNET: "eip155:1",
  ETHEREUM_SEPOLIA: "eip155:11155111",
} as const;

// Facilitator URLs
export const FACILITATORS = {
  TESTNET: "https://x402.org/facilitator",
  PRODUCTION: process.env.X402_FACILITATOR_URL || "https://api.cdp.coinbase.com/platform/v2/x402",
} as const;

// Price configuration for different actions
export const PRICES = {
  craft: "$0.01",              // Craft an item
  mint: "$0.05",              // Mint a MegaMind NFT (default price)
  mintWhitelisted: "$0.00",   // Free mint for whitelisted wallets (gas only)
  gm: "$0.50",                // GM transaction
  taskComplete: "$0.01",      // Complete a daily task
  leaderboard: "$0.00",       // Free to view leaderboard
} as const;

// Whitelisted addresses for free minting (gas only)
// These addresses can mint MegaMinds for free (only pay gas)
// In production, this should be managed via smart contract
// For now, we use environment variable for simplicity
export const WHITELISTED_ADDRESSES: Address[] = (
  process.env.X402_MINT_WHITELIST?.split(",") || []
).filter(Boolean) as Address[];

// Your receiving wallet addresses - REPLACE THESE WITH YOUR ACTUAL ADDRESSES
export const WALLET_ADDRESSES = {
  // EVM addresses (0x...)
  evm: process.env.X402_EVM_ADDRESS || "0x0000000000000000000000000000000000000000",
  
  // Solana addresses (base58)
  svm: process.env.X402_SVM_ADDRESS || "",
} as const;

// Contract owner address - can manage whitelist
export const OWNER_ADDRESS: Address = (
  process.env.X402_OWNER_ADDRESS as Address) || WALLET_ADDRESSES.evm;

// Check if an address is the owner
export function isOwner(address: Address | string): boolean {
  const addr = typeof address === "string" ? address.toLowerCase() : address.toLowerCase();
  return OWNER_ADDRESS.toLowerCase() === addr;
}

/**
 * Create and configure the X402 resource server
 * 
 * This server handles:
 * - Payment verification via facilitator
 * - Settlement of payments
 * - Support for multiple networks (EVM, SVM)
 */
export function createX402Server(useTestnet: boolean = false) {
  const facilitatorClient = new HTTPFacilitatorClient({
    url: useTestnet ? FACILITATORS.TESTNET : FACILITATORS.PRODUCTION,
  });

  const server = new x402ResourceServer(facilitatorClient);

  // Register EVM networks (Base, Ethereum, etc.)
  server.register("eip155:*", new ExactEvmScheme());
  
  // Register SVM networks (Solana)
  server.register("solana:*", new ExactSvmScheme());

  return server;
}

/**
 * Get facilitator URL based on environment
 */
export function getFacilitatorUrl(): string {
  if (process.env.NODE_ENV === "development") {
    return FACILITATORS.TESTNET;
  }
  return FACILITATORS.PRODUCTION;
}

/**
 * Check if we're in testnet mode
 */
export function isTestnetMode(): boolean {
  return process.env.NODE_ENV === "development" || 
         process.env.X402_USE_TESTNET === "true";
}

/**
 * Get the appropriate network identifier based on mode
 */
export function getNetwork(networkType: "base" | "solana" | "ethereum"): string {
  if (isTestnetMode()) {
    switch (networkType) {
      case "base": return NETWORKS.BASE_SEPOLIA;
      case "solana": return NETWORKS.SOLANA_DEVNET;
      case "ethereum": return NETWORKS.ETHEREUM_SEPOLIA;
      default: return NETWORKS.BASE_SEPOLIA;
    }
  }
  
  switch (networkType) {
    case "base": return NETWORKS.BASE_MAINNET;
    case "solana": return NETWORKS.SOLANA_MAINNET;
    case "ethereum": return NETWORKS.ETHEREUM_MAINNET;
    default: return NETWORKS.BASE_MAINNET;
  }
}

/**
 * Get the appropriate wallet address for a network type
 */
export function getWalletAddress(networkType: "evm" | "svm"): string {
  if (networkType === "svm") {
    return WALLET_ADDRESSES.svm;
  }
  return WALLET_ADDRESSES.evm;
}

// Default X402 server instance
let defaultServer: ReturnType<typeof createX402Server> | null = null;

export function getX402Server(): ReturnType<typeof createX402Server> {
  if (!defaultServer) {
    defaultServer = createX402Server(isTestnetMode());
  }
  return defaultServer;
}

// Reset server (for testing)
export function resetX402Server(): void {
  defaultServer = null;
}
