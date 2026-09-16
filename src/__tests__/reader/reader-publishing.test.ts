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

  describe("Chapter Creation & Validation Guard", () => {
    it("successfully validates chapter input with schedule parameters", async () => {
      const { validateChapterPayload } = await import("@/lib/network/validation");
      const result = validateChapterPayload({
        chapter_number: 1,
        title: "Chapter 1",
        content: "This is valid chapter story prose content for Taleora reader.",
        status: "scheduled",
        schedule_type: "specific_date",
        scheduled_for: "2026-09-20T12:00:00.000Z",
      });

      expect(result.success).toBe(true);
      expect(result.data?.chapter_number).toBe(1);
      expect(result.data?.title).toBe("Chapter 1");
      expect(result.data?.status).toBe("scheduled");
      expect(result.data?.schedule_type).toBe("specific_date");
      expect(result.data?.scheduled_for).toBe("2026-09-20T12:00:00.000Z");
    });

    it("rejects empty or insufficient chapter prose content", async () => {
      const { validateChapterPayload } = await import("@/lib/network/validation");
      const result = validateChapterPayload({
        chapter_number: 1,
        title: "Chapter 1",
        content: "too short",
      });

      expect(result.success).toBe(false);
      expect(result.errors?.content).toContain("at least 10 characters");
    });
  });
});
