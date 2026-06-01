/**
 * Authentication and Security Module
 * 
 * Provides:
 * - Agent signature verification (Farcaster, x40, ENS, Solana)
 * - Rate limiting
 * - Nonce management (replay protection)
 * - Security middleware for API routes
 */

export { RateLimiter } from "./rate-limiter";
export { generateNonce, verifyNonce, markNonceAsUsed, clearNonces, getNonceInfo } from "./nonce";
export { verifyAgentSignature, generateChallengeMessage, cleanupSignatureCache } from "./agents";
export { securityMiddleware, withSecurity, type AuthenticatedAgent } from "./middleware";
export type { AgentType, AgentConfig, VerificationResult } from "./agents";
