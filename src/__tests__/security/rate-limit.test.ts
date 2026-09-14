import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  resetRateLimit,
  RateLimitProfiles,
} from "@/lib/security/rate-limit";

describe("Rate Limiting Security Suite", () => {
  const TEST_KEY = "test-client-ip-1";

  beforeEach(() => {
    resetRateLimit(TEST_KEY);
    resetRateLimit(`auth:${TEST_KEY}`);
    resetRateLimit(`content:${TEST_KEY}`);
    resetRateLimit(`admin:${TEST_KEY}`);
    resetRateLimit(`api:${TEST_KEY}`);
  });

  it("permits requests within allowed limit", () => {
    const res1 = checkRateLimit(TEST_KEY, 5, 10000);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(4);
    expect(res1.limit).toBe(5);

    const res2 = checkRateLimit(TEST_KEY, 5, 10000);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(3);
  });

  it("blocks requests once rate limit threshold is exceeded", () => {
    for (let i = 0; i < 3; i++) {
      const res = checkRateLimit(TEST_KEY, 3, 10000);
      expect(res.success).toBe(true);
    }

    // 4th request should fail
    const blocked = checkRateLimit(TEST_KEY, 3, 10000);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.limit).toBe(3);
  });

  it("resets rate limit window when resetRateLimit is called", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit(TEST_KEY, 3, 10000);
    }

    expect(checkRateLimit(TEST_KEY, 3, 10000).success).toBe(false);

    resetRateLimit(TEST_KEY);

    const renewed = checkRateLimit(TEST_KEY, 3, 10000);
    expect(renewed.success).toBe(true);
    expect(renewed.remaining).toBe(2);
  });

  it("resets automatically after time window expires", () => {
    vi.useFakeTimers();
    try {
      const windowMs = 5000;
      for (let i = 0; i < 2; i++) {
        checkRateLimit(TEST_KEY, 2, windowMs);
      }

      // Blocked
      expect(checkRateLimit(TEST_KEY, 2, windowMs).success).toBe(false);

      // Advance time beyond window
      vi.advanceTimersByTime(windowMs + 100);

      // Now allowed
      const afterExpiry = checkRateLimit(TEST_KEY, 2, windowMs);
      expect(afterExpiry.success).toBe(true);
      expect(afterExpiry.remaining).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("RateLimitProfiles.auth enforces strict threshold (10 req/min)", () => {
    for (let i = 0; i < 10; i++) {
      expect(RateLimitProfiles.auth(TEST_KEY).success).toBe(true);
    }
    expect(RateLimitProfiles.auth(TEST_KEY).success).toBe(false);
  });

  it("RateLimitProfiles.content enforces content protection threshold (20 req/min)", () => {
    for (let i = 0; i < 20; i++) {
      expect(RateLimitProfiles.content(TEST_KEY).success).toBe(true);
    }
    expect(RateLimitProfiles.content(TEST_KEY).success).toBe(false);
  });
});
