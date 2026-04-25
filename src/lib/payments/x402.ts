/**
 * X402 Payment Protocol Integration
 * 
 * X402 is a transaction payment protocol for the CrafterZ game.
 * This module handles:
 * - X402 transaction verification
 * - Balance checking
 * - Payment processing
 * - Reward distribution
 */

import { createPublicClient, http, type Hash, type Address } from "viem";
import { mainnet, base, arbitrum, optimism, polygon } from "viem/chains";

// Configuration
export interface X402Config {
  contractAddress?: Address; // Optional contract if X402 uses one
  rpcUrls: Record<number, string[]>;
  enabledChains: number[];
  tokenDecimals: number;
  tokenSymbol: string;
  protocolVersion: string;
}

// Default X402 configuration
const DEFAULT_X402_CONFIG: X402Config = {
  contractAddress: process.env.X402_CONTRACT_ADDRESS as Address || undefined,
  rpcUrls: {
    1: ["https://mainnet.infura.io/v3/"], // Ethereum
    8453: ["https://mainnet.base.org"], // Base
    42161: ["https:// arb1.arbitrum.io/rpc"], // Arbitrum
    10: ["https://mainnet.optimism.io"], // Optimism
    137: ["https://polygon-rpc.com"], // Polygon
  },
  enabledChains: [1, 8453, 42161, 10, 137],
  tokenDecimals: 18,
  tokenSymbol: "X402",
  protocolVersion: "1.0",
};

// Payment types
export type PaymentAction = "craft" | "mint" | "gm" | "task" | "boost";

export interface X402PaymentRequest {
  agentId: string;
  agentType: string;
  action: PaymentAction;
  amount: bigint;
  chainId: number;
  txHash?: Hash;
  signature?: string;
  x402Data?: Record<string, unknown>; // Protocol-specific data
}

export interface X402PaymentResult {
  ok: boolean;
  paid: boolean;
  amount?: bigint;
  txHash?: Hash;
  error?: string;
  balance?: bigint;
  protocol?: string;
  x402Data?: Record<string, unknown>;
}

export interface X402Balance {
  address: Address;
  balance: bigint;
  chainId: number;
  protocol: string;
}

/**
 * Get X402 configuration
 */
export function getX402Config(): X402Config {
  return DEFAULT_X402_CONFIG;
}

/**
 * Get EVM client for a specific chain
 */
function getClient(chainId: number): ReturnType<typeof createPublicClient> {
  const config = getX402Config();
  const chain = getChainById(chainId);
  const rpcUrl = config.rpcUrls[chainId]?.[0] || config.rpcUrls[1]?.[0];
  
  if (!rpcUrl) {
    throw new Error(`No RPC URL configured for chain ${chainId}`);
  }
  
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

/**
 * Get chain configuration by ID
 */
function getChainById(chainId: number): any {
  const chainMap: Record<number, any> = {
    1: mainnet,
    8453: base,
    42161: arbitrum,
    10: optimism,
    137: polygon,
  };
  return chainMap[chainId] || mainnet;
}

/**
 * Check if X402 payments are enabled for a chain
 */
export function isX402Enabled(chainId: number): boolean {
  const config = getX402Config();
  return config.enabledChains.includes(chainId);
}

/**
 * Get X402 balance for an address on a specific chain
 * 
 * Implementation depends on how X402 tracks balances:
 * - ERC-20 token contract
 * - Native balance
 * - Protocol-specific state
 */
export async function getX402Balance(
  address: Address | string,
  chainId: number = 8453, // Default to Base
): Promise<X402Balance | null> {
  if (!isX402Enabled(chainId)) {
    console.log(`X402 not enabled for chain ${chainId}`);
    return null;
  }

  try {
    const client = getClient(chainId);
    const addr = typeof address === "string" ? address : address;
    const config = getX402Config();
    
    // If X402 uses a contract, read from it
    if (config.contractAddress) {
      // TODO: Implement contract-based balance check
      // This depends on the X402 contract ABI
      // const balance = await client.readContract({
      //   address: config.contractAddress,
      //   abi: x402Abi,
      //   functionName: "balanceOf",
      //   args: [addr],
      // });
      
      // For now, return mock balance
      return {
        address: addr as Address,
        balance: 1000000000000000000n, // 1 token
        chainId,
        protocol: "X402",
      };
    }
    
    // If X402 uses native balance
    const balance = await client.getBalance({ address: addr as Address });
    
    return {
      address: addr as Address,
      balance,
      chainId,
      protocol: "X402",
    };
  } catch (error) {
    console.error(`Failed to get X402 balance for ${address} on chain ${chainId}:`, error);
    return null;
  }
}

/**
 * Verify an X402 transaction
 * 
 * X402 protocol may have specific verification requirements:
 * - Special transaction format
 * - Specific contract interactions
 * - Metadata validation
 */
export async function verifyX402Transaction(
  txHash: Hash,
  chainId: number,
  expectedAmount: bigint,
  expectedRecipient: Address,
  expectedSender: Address,
  x402Data?: Record<string, unknown>,
): Promise<boolean> {
  try {
    const client = getClient(chainId);
    
    // Get transaction receipt
    const receipt = await client.getTransactionReceipt({ hash: txHash });
    
    if (!receipt) {
      console.log(`Transaction ${txHash} not found on chain ${chainId}`);
      return false;
    }
    
    // Get full transaction
    const tx = await client.getTransaction({ hash: txHash });
    
    if (!tx) {
      console.log(`Transaction details not found for ${txHash}`);
      return false;
    }
    
    // Check sender
    if (tx.from?.toLowerCase() !== expectedSender.toLowerCase()) {
      console.log(`Sender mismatch: expected ${expectedSender}, got ${tx.from}`);
      return false;
    }
    
    // Check that the transaction succeeded
    if (receipt.status !== "success") {
      console.log(`Transaction ${txHash} failed`);
      return false;
    }
    
    // X402-specific validation
    // This depends on the protocol specification
    // For example:
    // - Check for specific function calls
    // - Validate calldata format
    // - Verify against protocol rules
    
    // If x402Data contains expected values, validate them
    if (x402Data) {
      // Protocol-specific validation would go here
      console.log(`X402 protocol validation not yet implemented`);
    }
    
    console.log(`X402 transaction verified: ${txHash} on chain ${chainId}`);
    return true;
  } catch (error) {
    console.error(`Failed to verify X402 transaction ${txHash}:`, error);
    return false;
  }
}

/**
 * Process an X402 payment for an in-game action
 * 
 * In a real implementation, this would:
 * 1. Check the user's X402 balance
 * 2. Verify the transaction (if provided)
 * 3. Process the payment via X402 protocol
 * 4. Grant in-game rewards
 * 
 * For now, this is a mock implementation
 */
export async function processX402Payment(
  request: X402PaymentRequest,
): Promise<X402PaymentResult> {
  const { agentId, agentType, action, amount, chainId, txHash, x402Data } = request;
  
  // Validate chain
  if (!isX402Enabled(chainId)) {
    return {
      ok: false,
      paid: false,
      error: `Chain ${chainId} is not enabled for X402 payments`,
      protocol: "X402",
    };
  }
  
  // If txHash is provided, verify it
  if (txHash) {
    // For now, we'll just check that the txHash looks valid
    if (!txHash.startsWith("0x") || txHash.length !== 66) {
      return {
        ok: false,
        paid: false,
        error: "Invalid transaction hash",
        protocol: "X402",
      };
    }
    
    // In development, accept all valid-looking tx hashes
    if (process.env.NODE_ENV === "development") {
      return {
        ok: true,
        paid: true,
        amount,
        txHash,
        protocol: "X402",
        x402Data,
      };
    }
  }
  
  // Without txHash, we can't verify payment
  return {
    ok: false,
    paid: false,
    error: "No transaction hash provided",
    protocol: "X402",
  };
}

/**
 * Get the X402 cost for a specific action
 */
export function getActionCost(action: PaymentAction): bigint {
  const costs: Record<PaymentAction, bigint> = {
    craft: 10000000000000000n, // 0.01
    mint: 1000000000000000000n, // 1
    gm: 500000000000000000n, // 0.5
    task: 10000000000000000n, // 0.01
    boost: 500000000000000000n, // 0.5
  };
  return costs[action] || 0n;
}

/**
 * Format X402 amount for display
 */
export function formatX402(amount: bigint, decimals: number = 18): string {
  const divisor = 10n ** BigInt(decimals);
  const integer = amount / divisor;
  const fractional = amount % divisor;
  
  if (fractional === 0n) {
    return integer.toString();
  }
  
  const fractionalStr = fractional.toString().padStart(decimals, "0").slice(0, 4);
  return `${integer}.${fractionalStr}`;
}

/**
 * Check if user has sufficient X402 balance for an action
 */
export async function checkSufficientBalance(
  address: Address | string,
  action: PaymentAction,
  chainId: number = 8453,
): Promise<{ hasBalance: boolean; balance: bigint; required: bigint }> {
  const balanceData = await getX402Balance(address, chainId);
  const required = getActionCost(action);
  
  if (!balanceData) {
    return { hasBalance: false, balance: 0n, required };
  }
  
  return {
    hasBalance: balanceData.balance >= required,
    balance: balanceData.balance,
    required,
  };
}

/**
 * Initiate an X402 payment flow
 * 
 * This would typically:
 * 1. Generate a payment request
 * 2. Return a deep link or QR code for the user's wallet
 * 3. Or return transaction data to sign
 */
export async function initiateX402Payment(
  agentId: string,
  agentType: string,
  action: PaymentAction,
  chainId: number = 8453,
  callbackUrl?: string,
): Promise<{
  ok: boolean;
  paymentRequest?: Record<string, unknown>;
  error?: string;
}> {
  const config = getX402Config();
  
  if (!isX402Enabled(chainId)) {
    return {
      ok: false,
      error: `Chain ${chainId} not supported for X402`,
    };
  }
  
  const cost = getActionCost(action);
  
  // X402 protocol-specific payment initiation
  // This depends on how X402 works:
  // - Might involve creating a transaction request
  // - Generating a payment URL
  // - Returning calldata to sign
  
  return {
    ok: true,
    paymentRequest: {
      agentId,
      agentType,
      action,
      amount: cost.toString(),
      chainId,
      protocol: "X402",
      version: config.protocolVersion,
      timestamp: Date.now(),
      callbackUrl,
    },
  };
}
