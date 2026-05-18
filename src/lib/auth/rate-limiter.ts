export class RateLimiter {
  private requestCounts: Map<string, { count: number; expiresAt: number }>;
  private cleanupInterval: ReturnType<typeof setInterval> | null;

  constructor(private maxRequests: number, private windowMs: number) {
    this.requestCounts = new Map();
    // Periodically clean up expired entries to prevent memory leak
    this.cleanupInterval = setInterval(() => this.cleanup(), Math.max(windowMs, 60_000));
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requestCounts.entries()) {
      if (record.expiresAt <= now) {
        this.requestCounts.delete(key);
      }
    }
  }

  check(ip: string, path: string): { allowed: boolean; retryAfter?: number } {
    const key = `${ip}:${path}`;
    const now = Date.now();
    const record = this.requestCounts.get(key);

    if (record && record.expiresAt > now) {
      if (record.count >= this.maxRequests) {
        return { allowed: false, retryAfter: record.expiresAt - now };
      }
      record.count++;
      this.requestCounts.set(key, record);
      return { allowed: true };
    }

    this.requestCounts.set(key, { count: 1, expiresAt: now + this.windowMs });
    return { allowed: true };
  }

  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
