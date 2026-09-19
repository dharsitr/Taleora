import { describe, it, expect, vi } from "vitest";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test_key";
});

import { timingSafeEqual } from "crypto";
import { createSecurityNotification } from "@/lib/security/notifications";
import { GET as getSecurityTxt } from "@/app/.well-known/security.txt/route";
import { GET as getCronPublish } from "@/app/api/cron/publish-chapters/route";
import { NextRequest } from "next/server";

// Helper mirroring timing-safe equality in cron route
function safeCompare(input: string | null, expected: string): boolean {
  if (!input) return false;
  const inputBuffer = Buffer.from(input, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (inputBuffer.length !== expectedBuffer.length) {
    timingSafeEqual(expectedBuffer, expectedBuffer);
    return false;
  }
  return timingSafeEqual(inputBuffer, expectedBuffer);
}

describe("Security Hardening Suite", () => {
  describe("Task 6: Timing-Safe Comparison & Cron Guard", () => {
    it("correctly matches identical secrets without throwing", () => {
      const secret = "a-very-secure-256-bit-cron-secret-token";
      expect(safeCompare(secret, secret)).toBe(true);
      expect(safeCompare(`Bearer ${secret}`, `Bearer ${secret}`)).toBe(true);
    });

    it("safely rejects mismatched secrets of identical length", () => {
      const secretA = "secret-token-123456789";
      const secretB = "secret-token-123456780";
      expect(safeCompare(secretA, secretB)).toBe(false);
    });

    it("safely rejects secrets of different lengths without throwing RangeError", () => {
      const secretA = "short";
      const secretB = "much-longer-secret-token";
      expect(safeCompare(secretA, secretB)).toBe(false);
      expect(safeCompare("", secretB)).toBe(false);
      expect(safeCompare(null, secretB)).toBe(false);
    });

    it("cron endpoint returns 401 for invalid timing-safe token", async () => {
      process.env.CRON_SECRET = "production-cron-secret-sample";
      const req = new NextRequest("http://localhost:3000/api/cron/publish-chapters", {
        headers: {
          authorization: "Bearer wrong-token-attempt",
        },
      });

      const res = await getCronPublish(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toMatch(/Unauthorized/);
    });
  });

  describe("Task 5: RFC 9116 Security.txt Route", () => {
    it("serves standard RFC 9116 directives", async () => {
      const res = await getSecurityTxt();
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");

      const body = await res.text();
      expect(body).toContain("Contact: mailto:");
      expect(body).toContain("Expires:");
      expect(body).toContain("Preferred-Languages: en");
      expect(body).toContain("Canonical:");
      expect(body).toContain("Policy:");
    });
  });

  describe("Task 4: Security Notifications Helper", () => {
    it("formats privacy-safe security notifications without exposing sensitive tokens", async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: insertMock,
        }),
      };

      const success = await createSecurityNotification(
        mockSupabase as any,
        "user-uuid-123",
        "mfa_enrolled"
      );

      expect(success).toBe(true);
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-uuid-123",
          type: "security_mfa_enrolled",
          title: expect.stringContaining("Two-Factor Authentication Enabled"),
          message: expect.not.stringMatching(/token|secret|password|key/i),
          link: "/settings",
          actor_id: null,
        })
      );
    });

    it("handles password change notification safely", async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: insertMock,
        }),
      };

      const success = await createSecurityNotification(
        mockSupabase as any,
        "user-uuid-456",
        "password_changed"
      );

      expect(success).toBe(true);
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-uuid-456",
          type: "security_password_changed",
          title: expect.stringContaining("Password Changed"),
        })
      );
    });
  });

  describe("Task 1: Supabase TOTP MFA Helpers", () => {
    it("getMfaStatus properly evaluates enrolled factors and AAL levels", async () => {
      const { getMfaStatus } = await import("@/lib/auth/mfa");

      const mockSupabase = {
        auth: {
          mfa: {
            getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
              data: { currentLevel: "aal1", nextLevel: "aal2" },
              error: null,
            }),
            listFactors: vi.fn().mockResolvedValue({
              data: {
                all: [
                  {
                    id: "factor-123",
                    friendly_name: "Admin Phone",
                    factor_type: "totp",
                    status: "verified",
                    created_at: "2026-09-19T00:00:00Z",
                  },
                ],
              },
              error: null,
            }),
          },
        },
      };

      const status = await getMfaStatus(mockSupabase as any);
      expect(status.currentLevel).toBe("aal1");
      expect(status.nextLevel).toBe("aal2");
      expect(status.hasEnrolledMfa).toBe(true);
      expect(status.factors).toHaveLength(1);
      expect(status.factors[0].friendlyName).toBe("Admin Phone");
    });

    it("enrollTotpFactor handles Supabase TOTP initialization", async () => {
      const { enrollTotpFactor } = await import("@/lib/auth/mfa");

      const mockSupabase = {
        auth: {
          mfa: {
            enroll: vi.fn().mockResolvedValue({
              data: {
                id: "factor-xyz",
                type: "totp",
                totp: {
                  qr_code: "data:image/svg+xml;base64,mockqr",
                  secret: "JBSWY3DPEHPK3PXP",
                  uri: "otpauth://totp/Taleora:user?secret=JBSWY3DPEHPK3PXP",
                },
              },
              error: null,
            }),
          },
        },
      };

      const res = await enrollTotpFactor(mockSupabase as any, "Test Device");
      expect(res.error).toBeNull();
      expect(res.data?.factorId).toBe("factor-xyz");
      expect(res.data?.secret).toBe("JBSWY3DPEHPK3PXP");
    });
  });
});
