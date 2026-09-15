/**
 * RFC-Compliant HTTP Rate Limiter for Taleora REST API routes.
 * Implements sliding-window counter per IP/User with standard headers:
 * - RateLimit-Limit
 * - RateLimit-Remaining
 * - RateLimit-Reset
 * - Retry-After (on HTTP 429 Too Many Requests)
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class SlidingWindowRateLimiter {
  private store = new Map<string, RateLimitRecord>();

  constructor() {
    // Periodic cleanup of expired rate limit windows
    if (typeof setInterval !== "undefined") {
      const timer = setInterval(() => {
        const now = Date.now();
        for (const [key, record] of this.store.entries()) {
          if (now > record.resetTime) {
            this.store.delete(key);
          }
        }
      }, 60 * 1000);
      if (timer.unref) timer.unref();
    }
  }

  public check(
    key: string,
    limit: number,
    windowMs = 60 * 1000
  ): {
    success: boolean;
    limit: number;
    remaining: number;
    resetSeconds: number;
    resetTimestamp: number;
  } {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      const resetTime = now + windowMs;
      this.store.set(key, { count: 1, resetTime });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        resetSeconds: Math.ceil(windowMs / 1000),
        resetTimestamp: Math.ceil(resetTime / 1000),
      };
    }

    if (record.count >= limit) {
      const resetSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      return {
        success: false,
        limit,
        remaining: 0,
        resetSeconds,
        resetTimestamp: Math.ceil(record.resetTime / 1000),
      };
    }

    record.count += 1;
    const resetSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - record.count),
      resetSeconds,
      resetTimestamp: Math.ceil(record.resetTime / 1000),
    };
  }

  public reset(key: string) {
    this.store.delete(key);
  }
}

const globalForLimiter = globalThis as unknown as {
  taleoraRateLimiter?: SlidingWindowRateLimiter;
};

export const apiRateLimiter =
  globalForLimiter.taleoraRateLimiter ||
  (globalForLimiter.taleoraRateLimiter = new SlidingWindowRateLimiter());

export function getClientIdentifier(req: NextRequest, userId?: string | null): string {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  return `ip:${ip}`;
}

/**
 * Enforce rate limit on an API request.
 * Returns null if allowed, or a 429 NextResponse if rate limit exceeded.
 */
export function enforceRateLimit(
  req: NextRequest,
  tier: "publicRead" | "storyPublish" | "admin" = "publicRead",
  userId?: string | null
): { allowed: true; headers: Record<string, string> } | { allowed: false; response: NextResponse } {
  const clientId = getClientIdentifier(req, userId);

  let limit = 60;
  const windowMs = 60 * 1000;

  if (tier === "storyPublish") {
    limit = 20; // 20 story/chapter submissions per minute
  } else if (tier === "admin") {
    limit = 120; // Admin telemetry & actions
  } else {
    limit = 80; // Public reading/listing
  }

  const result = apiRateLimiter.check(`${tier}:${clientId}`, limit, windowMs);

  const rateLimitHeaders: Record<string, string> = {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(result.resetTimestamp),
  };

  if (!result.success) {
    rateLimitHeaders["Retry-After"] = String(result.resetSeconds);
    const response = NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `Too many requests. Please try again in ${result.resetSeconds} seconds.`,
        retryAfter: result.resetSeconds,
      },
      {
        status: 429,
        headers: rateLimitHeaders,
      }
    );
    return { allowed: false, response };
  }

  return { allowed: true, headers: rateLimitHeaders };
}
