import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/books/[slug]/offline/route";
import * as rateLimiterModule from "@/lib/network/rate-limiter";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => {
      if (table === "books") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "book-1",
                    slug: "offline-story",
                    title: "Offline Story",
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "chapters") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    { id: "chap-1", slug: "chap-1", content: "Sample chapter content." },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    }),
  })),
}));

vi.mock("@/lib/books/local-content", () => ({
  getLocalChapterContent: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/books/chapter-storage", () => ({
  fetchBookChaptersFromStorage: vi.fn().mockResolvedValue({}),
}));

describe("Offline Route Rate Limiting (PERF-01)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns standard rate-limit headers on successful offline hydration requests", async () => {
    const req = new NextRequest("http://localhost:3000/api/books/offline-story/offline");
    const res = await GET(req, { params: Promise.resolve({ slug: "offline-story" }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("RateLimit-Limit")).toBeDefined();
    expect(res.headers.get("RateLimit-Remaining")).toBeDefined();

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.book.slug).toBe("offline-story");
    expect(json.chapters).toHaveLength(1);
  });

  it("returns 429 Too Many Requests when offline rate limit is exceeded", async () => {
    const enforceSpy = vi.spyOn(rateLimiterModule, "enforceRateLimit").mockReturnValueOnce({
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again in 45 seconds.",
          retryAfter: 45,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "45",
            "RateLimit-Limit": "80",
            "RateLimit-Remaining": "0",
          },
        }
      ) as any,
    });

    const req = new NextRequest("http://localhost:3000/api/books/offline-story/offline");
    const res = await GET(req, { params: Promise.resolve({ slug: "offline-story" }) });

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("45");
    const json = await res.json();
    expect(json.error).toBe("Rate limit exceeded");

    enforceSpy.mockRestore();
  });
});
