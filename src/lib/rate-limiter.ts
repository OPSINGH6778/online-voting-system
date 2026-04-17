interface RateLimitEntry { count: number; resetTime: number; }

class RateLimiter {
  private attempts = new Map<string, RateLimitEntry>();
  constructor(private maxAttempts = 5, private windowMs = 15 * 60 * 1000) {}

  check(key: string): { limited: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = this.attempts.get(key);
    if (!entry || now > entry.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return { limited: false, remaining: this.maxAttempts - 1, resetIn: 0 };
    }
    if (entry.count >= this.maxAttempts) {
      return { limited: true, remaining: 0, resetIn: Math.ceil((entry.resetTime - now) / 60000) };
    }
    entry.count++;
    return { limited: false, remaining: this.maxAttempts - entry.count, resetIn: 0 };
  }

  // Legacy compat
  isRateLimited(key: string): boolean { return this.check(key).limited; }
  getResetTime(key: string): number { return this.attempts.get(key)?.resetTime || 0; }
  reset(key: string): void { this.attempts.delete(key); }
}

export const otpRateLimiter   = new RateLimiter(5, 15 * 60 * 1000);   // 5 per 15min
export const loginRateLimiter = new RateLimiter(10, 15 * 60 * 1000);  // 10 per 15min
export const signupRateLimiter = new RateLimiter(3, 60 * 60 * 1000);  // 3 per hour
export const resetRateLimiter = new RateLimiter(3, 60 * 60 * 1000);   // 3 resets per hour
