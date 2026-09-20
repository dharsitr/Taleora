import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/env", () => ({
  env: {
    supabaseUrl: "https://mock.supabase.co",
    supabasePublishableKey: "mock-anon-key",
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";

describe("Goals Route Protection & Auth Suite", () => {
  const mockCreateServerClient = vi.mocked(createServerClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users from /goals to /login with notice", async () => {
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("No session"),
        }),
      },
    } as any);

    const req = new NextRequest("http://localhost:3000/goals");
    const response = await updateSession(req);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("next=%2Fgoals");
    expect(location).toContain("notice=Sign+in+to+view+your+reading+goals");
  });

  it("permits authenticated users to access /goals without redirect", async () => {
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-reader-1", email: "reader@taleora.com" } },
          error: null,
        }),
      },
    } as any);

    const req = new NextRequest("http://localhost:3000/goals");
    const response = await updateSession(req);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
