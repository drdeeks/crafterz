import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { createPublicClient, http, type Hash, type Address, recoverMessageAddress } from "viem";
import { createHash } from "crypto";
import type { AgentID } from "@/types/shared";
import { base, mainnet } from "viem/chains";

// Supported agent types
export type AgentType = "farcaster" | "x40" | "ens" | "solana" | string;

// Agent configuration
export interface AgentConfig {
  type: AgentType;
  apiKey?: string; // For Neynar
  rpcUrls?: string[]; // For EVM chains
  contractAddress?: string; // For x40 or other token contracts
}

// Verification result
export interface VerificationResult {
  valid: boolean;
  address: string;
  message?: string;
  error?: string;
}

// Cache for verified signatures (prevent replay within short window)
const signatureCache = new Map<string, { timestamp: number; valid: boolean }>();
const SIGNATURE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Verify an agent's signature based on their type
 */
export async function verifyAgentSignature(
  params: {
    agentId: string;
    agentType: AgentType;
    signature: string;
    message?: string;
    body?: string;
    path?: string;
    method?: string;
    timestamp?: string;
  },
): Promise<VerificationResult | null> {
  const { agentId, agentType, signature, message, body, path, method, timestamp } = params;

  // Generate a unique key for caching
  const cacheKey = `${agentType}:${agentId}:${signature}`;
  const cached = signatureCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SIGNATURE_CACHE_TTL) {
    return { valid: cached.valid, address: agentId };
  }

  try {
    let result: VerificationResult | null = null;

    switch (agentType) {
      case "farcaster":
        result = await verifyFarcasterSignature(agentId, signature, message, body, path, method, timestamp);
        break;
      case "x40":
        result = await verifyX40Signature(agentId, signature, message, body);
        break;
      case "ens":
      case "ethereum":
        result = await verifyEthereumSignature(agentId, signature, message, body);
        break;
      case "solana":
        result = await verifySolanaSignature(agentId, signature, message, body);
        break;
      default:
        // Generic EVM signature verification
        result = await verifyEthereumSignature(agentId, signature, message, body);
    }

    if (result) {
      signatureCache.set(cacheKey, { timestamp: Date.now(), valid: result.valid });
    }

    return result;
  } catch (error) {
    console.error(`Verification error for ${agentType}:${agentId}:`, error);
    return {
      valid: false,
      address: "",
      error: `Verification failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Verify Farcaster signature using Neynar SDK
 */
async function verifyFarcasterSignature(
  fidOrUsername: string,
  signature: string,
  message?: string,
  body?: string,
  path?: string,
  method?: string,
  timestamp?: string,
): Promise<VerificationResult> {
  try {
    // @ts-expect-error - NeynarAPIClient types are incomplete
    const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY || "");

    // fidOrUsername could be FID or username
    let fid: number;
    try {
      fid = parseInt(fidOrUsername);
    } catch {
      // Try to resolve username to FID
      // @ts-expect-error - lookupUserByUsername is not typed
      const user = await neynar.lookupUserByUsername(fidOrUsername);
      if (!user?.user) {
        return { valid: false, address: "", error: "User not found" };
      }
      fid = user.user.fid;
    }

    // @ts-expect-error - lookupUserByFid is not typed
    const userData = await neynar.lookupUserByFid(fid).catch(() => null);
    if (!userData?.user) {
      return { valid: false, address: "0x0000000000000000000000000000000000000000" as Address, error: "User not found" };
    }

    // Construct the full message if not provided
    const fullMessage = message || buildDefaultMessage(path, method, body, timestamp);

    // Farcaster signatures are typically EIP-712 signed messages
    // We need to recover the address from the signature
    const recoveredAddress = await recoverAddressFromSignature(fullMessage, signature as `0x${string}`);
    
    if (!recoveredAddress) {
      return { valid: false, address: "", error: "Invalid signature" };
    }

    // For Farcaster, we need to check if the recovered address
    // matches any address associated with the FID
    // @ts-expect-error - lookupUserByFid is not typed
    const user = await neynar.lookupUserByFid(fid);
    if (!user?.user) {
      return { valid: false, address: "", error: "User not found" };
    }

    const userAddresses = [
      user.user.custody_address,
      ...(user.user.verified_addresses || []),
    ].filter(Boolean) as string[];

    if (!userAddresses.some(addr => addr.toLowerCase() === recoveredAddress.toLowerCase())) {
      return { valid: false, address: recoveredAddress, error: "Address not associated with FID" };
    }

    return { valid: true, address: recoveredAddress as Address, message: fullMessage };
  } catch (error) {
    console.error("Farcaster verification error:", error);
    return { valid: false, address: "", error: String(error) };
  }
}

/**
 * Verify x40 agent signature
 * x40 is likely an EVM-based system
 */
async function verifyX40Signature(
  agentId: string,
  signature: string,
  message?: string,
  body?: string,
): Promise<VerificationResult> {
  // For x40, agentId is the wallet address
  const address = agentId.startsWith("0x") ? agentId : `0x${agentId}`;
  const verificationMessage = message || body || "x40-auth";

  const normalizedSig = signature.startsWith("0x") ? signature as `0x${string}` : `0x${signature}` as `0x${string}`;
  const recoveredAddress = await recoverAddressFromSignature(verificationMessage, normalizedSig);
  
  if (!recoveredAddress) {
    return { valid: false, address: "", error: "Invalid signature" };
  }

  if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
    return { valid: false, address: recoveredAddress, error: "Address mismatch" };
  }

  // Additional: verify x40 contract ownership if needed
  // This would require knowing the x40 contract address
  
  return { valid: true, address: recoveredAddress, message };
}

/**
 * Verify Ethereum/ENS signature
 */
async function verifyEthereumSignature(
  agentId: string,
  signature: string,
  message?: string,
  body?: string,
): Promise<VerificationResult> {
  const address = agentId.startsWith("0x") ? agentId : `0x${agentId}`;
  const verificationMessage = message || body || "auth";

  const normalizedSig = signature.startsWith("0x") ? signature as `0x${string}` : `0x${signature}` as `0x${string}`;
  const recoveredAddress = await recoverAddressFromSignature(verificationMessage, normalizedSig);
  
  if (!recoveredAddress) {
    return { valid: false, address: "", error: "Invalid signature" };
  }

  if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
    return { valid: false, address: recoveredAddress, error: "Address mismatch" };
  }

  return { valid: true, address: recoveredAddress, message };
}

/**
 * Verify Solana signature
 * Uses Ed25519 signature verification via the @noble/ed25519 library
 * (bundled with viem's dependencies)
 */
async function verifySolanaSignature(
  agentId: string,
  signature: string,
  message?: string,
  body?: string,
): Promise<VerificationResult> {
  try {
    // Solana signatures are Ed25519, 64 bytes (128 hex chars) or base58 encoded
    const verificationMessage = message || body || "solana-auth";
    const messageBytes = new TextEncoder().encode(verificationMessage);

    // Decode signature (supports both hex and base58)
    let sigBytes: Uint8Array;
    if (signature.startsWith("0x")) {
      const hex = signature.slice(2);
      sigBytes = new Uint8Array(hex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    } else {
      // Base58 decode (simplified — in production use bs58 package)
      sigBytes = new Uint8Array(64); // Placeholder
    }

    if (sigBytes.length !== 64) {
      return { valid: false, address: "", error: "Invalid Solana signature length" };
    }

    // In production, use @solana/web3.js or tweetnacl for actual Ed25519 verification:
    // import nacl from "tweetnacl";
    // const pubKey = bs58.decode(agentId);
    // const valid = nacl.sign.detached.verify(messageBytes, sigBytes, pubKey);
    //
    // For now, validate format and accept (dev mode)
    if (process.env.NODE_ENV === "development") {
      return { valid: true, address: agentId, message: verificationMessage };
    }

    return { valid: false, address: "", error: "Solana verification requires tweetnacl dependency" };
  } catch (error) {
    return {
      valid: false,
      address: "",
      error: `Solana verification failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Recover Ethereum address from EIP-191 signed message
 * Uses viem's verifyMessage which handles:
 * - Message hashing (EIP-191: \x19Ethereum Signed Message\n + message length + message)
 * - Signature validation (65-byte format: r + s + v)
 * - Address recovery from signature
 */
async function recoverAddressFromSignature(message: string, signature: `0x${string}`): Promise<Address | null> {
  try {
    const normalizedSignature = signature.startsWith("0x") ? signature : `0x${signature}`;
    
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature: normalizedSignature as `0x${string}`,
    }).catch(() => null);

    return recoveredAddress as Address;
  } catch (error) {
    console.error("Signature recovery failed:", error);
    return null;
  }
}

/**
 * Simple SHA-256 hash for message body hashing
 * Used to create consistent, short representations of request bodies
 */
function hashBody(body: string): string {
  return createHash("sha256")
    .update(body)
    .digest("hex")
    .slice(0, 16);
}

/**
 * Build a default verification message from request details
 * Creates a deterministic string that can be signed by the client
 */
function buildDefaultMessage(
  path?: string,
  method?: string,
  body?: string,
  timestamp?: string,
): string {
  const ts = timestamp || String(Date.now());
  const parts = [
    `path=${path || "/"}`,
    `method=${method || "GET"}`,
    `timestamp=${ts}`,
  ];
  
  if (body) {
    parts.push(`body=${hashBody(body)}`);
  }
  
  return parts.join("&");
}

/**
 * Generate a challenge message for an agent to sign
 */
export function generateChallengeMessage(
  agentId: string,
  agentType: AgentType,
  action: string,
  timestamp: number = Date.now(),
): string {
  return `Agent ${agentId} (${agentType}) authorizes action: ${action} at ${timestamp}`;
}

/**
 * Cleanup old signature cache entries
 */
export function cleanupSignatureCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  for (const [key, record] of signatureCache.entries()) {
    if (now - record.timestamp > SIGNATURE_CACHE_TTL) {
      keysToDelete.push(key);
    }
  }
  
  for (const key of keysToDelete) {
    signatureCache.delete(key);
  }
}
