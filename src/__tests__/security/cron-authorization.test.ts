import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/cron/publish-chapters/route";

vi.mock("@/lib/books/queries", () => ({
  publishScheduledChapters: vi.fn().mockResolvedValue(3),
}));

describe("Cron Publishing Authorization Guard (SEC-02)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("fails closed with 500 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;

    const req = new NextRequest("http://localhost:3000/api/cron/publish-chapters");
    const res = await GET(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("CRON_SECRET is not configured");
  });

  it("rejects unauthenticated requests with 401 when CRON_SECRET is configured", async () => {
    process.env.CRON_SECRET = "production-super-secret-12345";

    const req = new NextRequest("http://localhost:3000/api/cron/publish-chapters");
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Unauthorized");
  });

  it("rejects requests with invalid bearer token with 401", async () => {
    process.env.CRON_SECRET = "production-super-secret-12345";

    const req = new NextRequest("http://localhost:3000/api/cron/publish-chapters", {
      headers: {
        authorization: "Bearer wrong-secret-token",
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it("allows requests with valid Authorization Bearer header", async () => {
    process.env.CRON_SECRET = "production-super-secret-12345";

    const req = new NextRequest("http://localhost:3000/api/cron/publish-chapters", {
      headers: {
        authorization: "Bearer production-super-secret-12345",
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.publishedCount).toBe(3);
  });

  it("allows requests with valid x-cron-secret header", async () => {
    process.env.CRON_SECRET = "production-super-secret-12345";

    const req = new NextRequest("http://localhost:3000/api/cron/publish-chapters", {
      headers: {
        "x-cron-secret": "production-super-secret-12345",
      },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.publishedCount).toBe(3);
  });
});
