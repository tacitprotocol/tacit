/**
 * Tacit Protocol — Rate Limiter
 *
 * Simple sliding window rate limiter for relay connections.
 */

interface Window {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private windows = new Map<string, Window>();
  private maxPerMinute: number;

  constructor(maxPerMinute: number) {
    this.maxPerMinute = maxPerMinute;

    // Cleanup stale windows every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if a request is allowed for the given key.
   * Returns true if allowed, false if rate limited.
   */
  allow(key: string): boolean {
    const now = Date.now();
    let window = this.windows.get(key);

    if (!window || now > window.resetAt) {
      window = { count: 0, resetAt: now + 60_000 };
      this.windows.set(key, window);
    }

    if (window.count >= this.maxPerMinute) {
      return false;
    }

    window.count++;
    return true;
  }

  /**
   * Get remaining requests for a key.
   */
  remaining(key: string): number {
    const window = this.windows.get(key);
    if (!window || Date.now() > window.resetAt) return this.maxPerMinute;
    return Math.max(0, this.maxPerMinute - window.count);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, window] of this.windows) {
      if (now > window.resetAt) {
        this.windows.delete(key);
      }
    }
  }
}
