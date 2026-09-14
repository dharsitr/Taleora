import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAdminOrModerator, requireAdmin } from "@/lib/admin/actions";
import { resetRateLimit } from "@/lib/security/rate-limit";

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("Server-Side Authorization & RBAC Suite", () => {
  const mockCreateClient = vi.mocked(createClient);

  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimit("admin:user-admin-1");
    resetRateLimit("admin:user-mod-1");
    resetRateLimit("admin:user-norm-1");
    resetRateLimit("admin:user-susp-1");
  });

  it("throws authentication error when user session is absent", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("No session") }),
      },
    } as any);

    await expect(requireAdminOrModerator()).rejects.toThrow("Authentication required");
  });

  it("throws error when user profile does not exist", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-unknown" } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error("Profile not found") }),
          }),
        }),
      }),
    } as any);

    await expect(requireAdminOrModerator()).rejects.toThrow("User profile not found");
  });

  it("rejects suspended users even if they have administrative roles", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-susp-1" } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "user-susp-1",
                username: "suspended_mod",
                role: "moderator",
                is_suspended: true,
              },
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    await expect(requireAdminOrModerator()).rejects.toThrow("Account suspended");
  });

  it("rejects standard 'user' role from administrative actions", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-norm-1" } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "user-norm-1",
                username: "regular_reader",
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
  });

  it("permits moderator role for requireAdminOrModerator, but blocks from requireAdmin", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-mod-1" } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "user-mod-1",
                username: "content_moderator",
                role: "moderator",
                is_suspended: false,
              },
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    // Should succeed for requireAdminOrModerator
    const modContext = await requireAdminOrModerator();
    expect(modContext.profile.role).toBe("moderator");

    // Should fail for requireAdmin
    await expect(requireAdmin()).rejects.toThrow("Super-Administrator role required");
  });

  it("permits admin role for both requireAdminOrModerator and requireAdmin", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-admin-1" } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "user-admin-1",
                username: "super_admin",
                role: "admin",
                is_suspended: false,
              },
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const context = await requireAdmin();
    expect(context.profile.role).toBe("admin");
    expect(context.user.id).toBe("user-admin-1");
  });
});
