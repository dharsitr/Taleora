import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAdminOrModerator, requireAdmin } from "@/lib/admin/actions";
import { resetRateLimit } from "@/lib/security/rate-limit";

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("Admin & Moderator Authorization Security (SEC-03 & PERF-02)", () => {
  const mockCreateClient = vi.mocked(createClient);

  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimit("admin:user-admin-1");
    resetRateLimit("admin:user-mod-1");
    resetRateLimit("admin:user-reader-1");
    resetRateLimit("admin:user-susp-1");
  });

  it("permits active administrators to access admin routes", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-admin-1" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "user-admin-1",
                role: "admin",
                is_suspended: false,
              },
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const adminCtx = await requireAdmin();
    expect(adminCtx.profile.role).toBe("admin");
    expect(adminCtx.profile.is_suspended).toBe(false);

    const modCtx = await requireAdminOrModerator();
    expect(modCtx.profile.role).toBe("admin");
  });

  it("permits active moderators to access moderation routes but not super-admin routes", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-mod-1" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "user-mod-1",
                role: "moderator",
                is_suspended: false,
              },
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const modCtx = await requireAdminOrModerator();
    expect(modCtx.profile.role).toBe("moderator");

    await expect(requireAdmin()).rejects.toThrow("Super-Administrator role required");
  });

  it("strictly denies suspended admins and moderators (fail closed)", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-susp-1" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "user-susp-1",
                role: "admin",
                is_suspended: true,
              },
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    await expect(requireAdminOrModerator()).rejects.toThrow("Account suspended");
    await expect(requireAdmin()).rejects.toThrow("Account suspended");
  });

  it("strictly denies standard readers from accessing admin/moderator functionality", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-reader-1" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "user-reader-1",
                role: "user",
                is_suspended: false,
              },
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    await expect(requireAdminOrModerator()).rejects.toThrow("Forbidden: Admin or Moderator role required");
    await expect(requireAdmin()).rejects.toThrow("Forbidden: Admin or Moderator role required");
  });
});
