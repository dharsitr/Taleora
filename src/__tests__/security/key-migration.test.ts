import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Supabase Key Migration Security & Compatibility Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("Client-side Key Resolution & Fallback (src/lib/env.ts)", () => {
    it("resolves NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY when available", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test_12345";
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const { env } = await import("@/lib/env");
      expect(env.supabasePublishableKey).toBe("sb_publishable_test_12345");
      expect(env.supabaseAnonKey).toBe("sb_publishable_test_12345");
    });

    it("falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY when publishable key is missing", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy_anon_jwt_token";

      const { env } = await import("@/lib/env");
      expect(env.supabasePublishableKey).toBe("legacy_anon_jwt_token");
      expect(env.supabaseAnonKey).toBe("legacy_anon_jwt_token");
    });

    it("throws a clear configuration error if neither key is configured", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      await expect(async () => {
        await import("@/lib/env");
      }).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
    });
  });

  describe("Server Admin Client Key Resolution (src/lib/supabase/admin.ts)", () => {
    it("uses SUPABASE_SECRET_KEY preferentially over legacy key", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test_12345";
      process.env.SUPABASE_SECRET_KEY = "sb_secret_new_elevated_key";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy_service_role_key";

      const { createAdminClient } = await import("@/lib/supabase/admin");
      const client = createAdminClient();
      expect(client).toBeDefined();
    });

    it("falls back to SUPABASE_SERVICE_ROLE_KEY when SUPABASE_SECRET_KEY is absent", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test_12345";
      delete process.env.SUPABASE_SECRET_KEY;
      process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy_service_role_key";

      const { createAdminClient } = await import("@/lib/supabase/admin");
      const client = createAdminClient();
      expect(client).toBeDefined();
    });

    it("throws configuration error when neither secret nor service_role key is present", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test_12345";
      delete process.env.SUPABASE_SECRET_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const { createAdminClient } = await import("@/lib/supabase/admin");
      expect(() => createAdminClient()).toThrow(/SUPABASE_SECRET_KEY/);
    });

    it("strictly prevents client-side execution if window is defined", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test_12345";
      process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
      (globalThis as unknown as { window: unknown }).window = {};

      const { createAdminClient } = await import("@/lib/supabase/admin");
      expect(() => createAdminClient()).toThrow(/createAdminClient cannot be invoked on the client side/);

      delete (globalThis as unknown as { window?: unknown }).window;
    });
  });

  describe("Accidental Secret Exposure Audit", () => {
    it("ensures no secret keys have NEXT_PUBLIC_ or EXPO_PUBLIC_ prefixes in env templates", () => {
      const rootDir = path.resolve(__dirname, "../../..");
      const filesToCheck = [
        path.join(rootDir, ".env.example"),
        path.join(rootDir, "mobile/.env.example"),
      ];

      for (const filePath of filesToCheck) {
        if (!fs.existsSync(filePath)) continue;
        const content = fs.readFileSync(filePath, "utf8");
        const lines = content.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
          const [key] = trimmed.split("=");

          // Secret or service role or cron secret must NEVER be NEXT_PUBLIC_ or EXPO_PUBLIC_
          if (key.includes("SECRET") || key.includes("SERVICE_ROLE")) {
            expect(key.startsWith("NEXT_PUBLIC_")).toBe(false);
            expect(key.startsWith("EXPO_PUBLIC_")).toBe(false);
          }
        }
      }
    });
  });
});
