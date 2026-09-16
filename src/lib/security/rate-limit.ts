/**
 * Sliding-window in-memory rate limiter for Taleora.
 * Protects against brute force, denial-of-service, content spam,
 * and malicious scraping across API routes and Server Actions.
 *
 * PRODUCTION DEPLOYMENT & SCALING ARCHITECTURE (ARCH-01):
 * - Single-Instance / Docker Container: The in-memory Map store operates with zero external
 *   dependencies and sub-millisecond atomic updates within the Node.js event loop.
 * - Horizontal Multi-Instance / Serverless Scaling: In multi-container Docker clusters,
 *   Kubernetes pods, or serverless deployments, rate-limit counters reside in separate process
 *   memories. For horizontal multi-instance scaling, configure a distributed store such as
 *   Upstash Redis (@upstash/ratelimit) using an atomic sliding-window algorithm. No Redis
 *   dependency is required for single-instance deployments.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window store
const store = new Map<string, RateLimitRecord>();

// Automatic cleanup every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  // Do not hold Node.js event loop open if running in background
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check and increment request count for a given identifier within a sliding window.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60000
): RateLimitResult {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: record.resetTime,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: record.resetTime,
  };
}

/**
 * Reset rate limit counter for a specific key (e.g. upon successful authentication).
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Rate limit preset profiles.
 */
export const RateLimitProfiles = {
  // Auth endpoints (login, signup, password resets): 10 per minute
  auth: (id: string) => checkRateLimit(`auth:${id}`, 10, 60 * 1000),

  // API endpoints (cron, webhook triggers): 60 per minute
  api: (id: string) => checkRateLimit(`api:${id}`, 60, 60 * 1000),

  // Content submissions (reviews, comments, reports): 20 per minute
  content: (id: string) => checkRateLimit(`content:${id}`, 20, 60 * 1000),

  // Admin and moderation actions: 60 per minute
  admin: (id: string) => checkRateLimit(`admin:${id}`, 60, 60 * 1000),
};
