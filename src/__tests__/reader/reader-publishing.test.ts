import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as cronHandler } from "@/app/api/cron/publish-chapters/route";
import { NextRequest } from "next/server";
import { resetRateLimit } from "@/lib/security/rate-limit";

vi.mock("@/lib/books/queries", () => ({
  publishScheduledChapters: vi.fn().mockResolvedValue(3),
}));

describe("Reader & Publishing Workflow Security Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    resetRateLimit("api:test-cron-runner");
  });

  describe("Publishing Cron Security Guard", () => {
    it("rejects unauthorized cron requests when CRON_SECRET is configured", async () => {
      process.env.CRON_SECRET = "super-secret-cron-key-12345";

      const req = new NextRequest("http://localhost:3000/api/cron/publish-chapters", {
        headers: {
          "x-forwarded-for": "test-cron-runner",
        },
      });

      const response = await cronHandler(req);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Unauthorized");
    });

    it("accepts authorized cron request with Bearer authorization header", async () => {
      process.env.CRON_SECRET = "super-secret-cron-key-12345";

      const req = new NextRequest("http://localhost:3000/api/cron/publish-chapters", {
        headers: {
          "x-forwarded-for": "test-cron-runner",
          authorization: "Bearer super-secret-cron-key-12345",
        },
      });

      const response = await cronHandler(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.publishedCount).toBe(3);
    });

    it("accepts authorized cron request with x-cron-secret header", async () => {
      process.env.CRON_SECRET = "super-secret-cron-key-12345";

      const req = new NextRequest("http://localhost:3000/api/cron/publish-chapters", {
        headers: {
          "x-forwarded-for": "test-cron-runner",
          "x-cron-secret": "super-secret-cron-key-12345",
        },
      });

      const response = await cronHandler(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("rate limits abusive requests to cron endpoint", async () => {
      process.env.CRON_SECRET = "super-secret-cron-key-12345";

      // RateLimitProfiles.api allows 60 req/min. Let's send 61 requests.
      for (let i = 0; i < 60; i++) {
        const req = new NextRequest("http://localhost:3000/api/cron/publish-chapters", {
          headers: {
            "x-forwarded-for": "test-cron-runner",
            authorization: "Bearer super-secret-cron-key-12345",
          },
        });
        const res = await cronHandler(req);
        expect(res.status).toBe(200);
      }

      // 61st request should be rate limited
      const reqBlocked = new NextRequest("http://localhost:3000/api/cron/publish-chapters", {
        headers: {
          "x-forwarded-for": "test-cron-runner",
          authorization: "Bearer super-secret-cron-key-12345",
        },
      });
      const blockedRes = await cronHandler(reqBlocked);
      expect(blockedRes.status).toBe(429);
      const json = await blockedRes.json();
      expect(json.error).toContain("Rate limit exceeded");
    });
  });
});
