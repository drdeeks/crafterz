const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_NONCES = 100_000; // Hard cap to prevent unbounded growth

type NonceStore = Map<string, number>; // nonce -> timestamp

function cleanupExpiredNonces(store: NonceStore): void {
  const now = Date.now();
  for (const [nonce, timestamp] of store.entries()) {
    if (now - timestamp > NONCE_TTL_MS) {
      store.delete(nonce);
    }
  }
}

export function verifyNonce(agentId: string, nonce: string, nonceStore: NonceStore): boolean {
  if (nonceStore.size > MAX_NONCES) {
    cleanupExpiredNonces(nonceStore);
  }

  if (nonceStore.has(nonce)) {
    return false;
  }

  nonceStore.set(nonce, Date.now());
  return true;
}

export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function markNonceAsUsed(nonce: string, nonceStore: NonceStore): void {
  nonceStore.set(nonce, Date.now());
}

export function clearNonces(nonceStore: NonceStore): void {
  nonceStore.clear();
}

export function getNonceInfo(nonce: string, nonceStore: NonceStore): { used: boolean; expired?: boolean } {
  const timestamp = nonceStore.get(nonce);
  if (!timestamp) return { used: false };
  const expired = Date.now() - timestamp > NONCE_TTL_MS;
  return { used: true, expired };
}

export function cleanupNonces(nonceStore: NonceStore): void {
  cleanupExpiredNonces(nonceStore);
}
