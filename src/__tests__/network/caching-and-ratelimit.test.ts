import { describe, it, expect, beforeEach } from "vitest";
import { storyCache } from "@/lib/network/cache";
import { apiRateLimiter } from "@/lib/network/rate-limiter";
import {
  validateStoryPayload,
  validateChapterPayload,
} from "@/lib/network/validation";

describe("Network Caching & ETag Engine", () => {
  beforeEach(() => {
    storyCache.flush();
  });

  it("should generate deterministic ETags for identical content", () => {
    const etag1 = storyCache.generateETag(JSON.stringify({ title: "My Story" }));
    const etag2 = storyCache.generateETag(JSON.stringify({ title: "My Story" }));
    const etag3 = storyCache.generateETag(JSON.stringify({ title: "Different Story" }));

    expect(etag1).toBe(etag2);
    expect(etag1).not.toBe(etag3);
    expect(etag1).toMatch(/^W\/"[a-f0-9]+-\d+"$/);
  });

  it("should store and retrieve data with ETags", () => {
    const data = { id: "story-1", title: "Cybernetics and Networks" };
    const { etag } = storyCache.set("story:story-1", data, 60);

    const retrieved = storyCache.get<typeof data>("story:story-1");
    expect(retrieved).not.toBeNull();
    expect(retrieved?.etag).toBe(etag);
    expect(retrieved?.data.title).toBe("Cybernetics and Networks");
  });

  it("should invalidate cache entries by key or prefix", () => {
    storyCache.set("story:detail:slug-1", { id: "1" });
    storyCache.set("story:detail:slug-2", { id: "2" });
    storyCache.set("story:list:all", { count: 2 });

    expect(storyCache.get("story:detail:slug-1")).not.toBeNull();
    storyCache.invalidate("story:detail:slug-1");
    expect(storyCache.get("story:detail:slug-1")).toBeNull();

    // Invalidate prefix
    storyCache.invalidate("story:detail");
    expect(storyCache.get("story:detail:slug-2")).toBeNull();
    expect(storyCache.get("story:list:all")).not.toBeNull();
  });
});

describe("API Rate Limiter", () => {
  const testKey = `test:ip:10.0.0.1-${Date.now()}`;

  it("should permit requests within rate limit", () => {
    const res1 = apiRateLimiter.check(testKey, 3, 5000);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = apiRateLimiter.check(testKey, 3, 5000);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = apiRateLimiter.check(testKey, 3, 5000);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("should throttle and reject requests that exceed limit", () => {
    const resBlocked = apiRateLimiter.check(testKey, 3, 5000);
    expect(resBlocked.success).toBe(false);
    expect(resBlocked.remaining).toBe(0);
    expect(resBlocked.resetSeconds).toBeGreaterThan(0);
  });
});

describe("Request Validation", () => {
  it("should validate and sanitize valid story payloads", () => {
    const valid = validateStoryPayload({
      title: "  The Digital Frontier  ",
      subtitle: "A story about protocols",
      description: "Exploring packet routing.",
      genreIds: ["sci-fi"],
      status: "published",
    });

    expect(valid.success).toBe(true);
    expect(valid.data?.title).toBe("The Digital Frontier");
    expect(valid.data?.status).toBe("published");
  });

  it("should reject stories with empty or missing titles", () => {
    const invalid = validateStoryPayload({
      title: "   ",
    });

    expect(invalid.success).toBe(false);
    expect(invalid.errors?.title).toBeDefined();
  });

  it("should validate chapter payloads with valid numbers and contents", () => {
    const valid = validateChapterPayload({
      chapter_number: 1,
      title: "Handshake Protocol",
      content: "The client sends a SYN packet to initiate the TCP three-way handshake.",
      status: "published",
    });

    expect(valid.success).toBe(true);
    expect(valid.data?.chapter_number).toBe(1);
    expect(valid.data?.content).toContain("SYN packet");
  });

  it("should reject chapters with negative numbers or empty content", () => {
    const invalid = validateChapterPayload({
      chapter_number: -1,
      title: "Test",
      content: "",
    });

    expect(invalid.success).toBe(false);
    expect(invalid.errors?.chapter_number).toBeDefined();
    expect(invalid.errors?.content).toBeDefined();
  });
});
