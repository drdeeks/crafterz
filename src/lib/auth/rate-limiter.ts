/**
 * Simple in-memory rate limiter
 * In production, replace with Redis-based limiter
 */
export class RateLimiter {
  private limits: Map<string, { count: number; resetAt: number }>;
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.limits = new Map();
  }

  /**
   * Check if request is allowed
   * @param key - Unique identifier (IP, address, etc.)
   * @param identifier - Optional path or endpoint identifier
   * @returns { allowed: boolean, retryAfter?: number }
   */
  check(key: string, identifier?: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const compositeKey = identifier ? `${key}:${identifier}` : key;

    const record = this.limits.get(compositeKey);

    if (!record || now > record.resetAt) {
      // New window
      this.limits.set(compositeKey, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true };
    }

    // Existing window
    if (record.count >= this.maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // Increment counter
    this.limits.set(compositeKey, { ...record, count: record.count + 1 });
    return { allowed: true };
  }

  /**
   * Reset limits for a key
   */
  reset(key: string, identifier?: string): void {
    const compositeKey = identifier ? `${key}:${identifier}` : key;
    this.limits.delete(compositeKey);
  }

  /**
   * Clear all limits
   */
  clear(): void {
    this.limits.clear();
  }

  /**
   * Get current count for a key
   */
  getCount(key: string, identifier?: string): number {
    const compositeKey = identifier ? `${key}:${identifier}` : key;
    const record = this.limits.get(compositeKey);
    if (!record || Date.now() > record.resetAt) {
      return 0;
    }
    return record.count;
  }
}

// Singleton instance for general use
let globalRateLimiter: RateLimiter | null = null;

export function getRateLimiter(maxRequests = 100, windowMs = 60000): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter(maxRequests, windowMs);
  }
  return globalRateLimiter;
}
