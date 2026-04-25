/**
 * Nonce management for replay protection
 * Stores used nonces to prevent duplicate submissions
 */

// In production, use Redis with TTL
const nonceStore = new Map<string, { usedAt: number; agentId: string }>();
const NONCE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a random nonce
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Mark a nonce as used
 */
export function markNonceAsUsed(nonce: string, agentId: string): void {
  nonceStore.set(nonce, { usedAt: Date.now(), agentId });
  
  // Cleanup old nonces periodically
  if (Math.random() < 0.01) {
    // 1% chance to run cleanup on each call
    cleanupOldNonces();
  }
}

/**
 * Check if a nonce is valid (not used or expired)
 */
export function verifyNonce(
  agentId: string,
  nonce: string,
  customStore?: Map<string, { usedAt: number; agentId: string }>,
): boolean {
  const store = customStore || nonceStore;
  const record = store.get(nonce);

  if (!record) {
    // Nonce not found - it's valid (will be marked as used later)
    return true;
  }

  // Nonce exists - check if it's expired
  const now = Date.now();
  if (now - record.usedAt > NONCE_TTL_MS) {
    // Nonce expired - remove and allow reuse
    store.delete(nonce);
    return true;
  }

  // Nonce was used recently and by a different agent?
  // Allow if same agent (idempotency) or reject if different
  if (record.agentId === agentId) {
    // Same agent, same nonce - idempotent request, allow
    return true;
  }

  // Different agent trying to use same nonce - reject
  return false;
}

/**
 * Clean up old nonces
 */
function cleanupOldNonces(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  for (const [nonce, record] of nonceStore.entries()) {
    if (now - record.usedAt > NONCE_TTL_MS) {
      keysToDelete.push(nonce);
    }
  }
  
  for (const nonce of keysToDelete) {
    nonceStore.delete(nonce);
  }
}

/**
 * Get nonce info for debugging
 */
export function getNonceInfo(nonce: string) {
  return nonceStore.get(nonce);
}

/**
 * Clear all nonces (for testing)
 */
export function clearNonces(): void {
  nonceStore.clear();
}
