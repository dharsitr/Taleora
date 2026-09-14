import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  suspendBook,
  restoreBook,
  resolveReport,
  dismissReport,
  moderateReview,
} from "@/lib/admin/actions";
import { resetRateLimit } from "@/lib/security/rate-limit";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("Admin & Moderation Workflow Suite", () => {
  const mockCreateClient = vi.mocked(createClient);
  const MOD_USER_ID = "mod-user-999";

  let updateMock: any;
  let insertMock: any;
  let selectMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimit(`admin:${MOD_USER_ID}`);

    updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    insertMock = vi.fn().mockResolvedValue({ error: null });

    selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockImplementation(() => {
          return Promise.resolve({
            data: {
              id: "report-123",
              target_type: "review",
              reason: "harassment",
              target_id: "review-456",
            },
            error: null,
          });
        }),
      }),
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: MOD_USER_ID } },
          error: null,
        }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: MOD_USER_ID,
                    username: "moderator_dan",
                    role: "moderator",
                    is_suspended: false,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === "reports") {
          return {
            select: selectMock,
            update: updateMock,
          };
        }

        if (table === "books" || table === "book_reviews" || table === "comments") {
          return {
            update: updateMock,
          };
        }

        if (table === "admin_audit_logs") {
          return {
            insert: insertMock,
          };
        }

        return {
          select: selectMock,
          update: updateMock,
          insert: insertMock,
        };
      }),
    } as any);
  });

  describe("suspendBook & unsuspendBook", () => {
    it("suspends a book with sanitized reason and logs audit event", async () => {
      const result = await suspendBook(
        "book-42",
        "Violates terms of service <script>alert(1)</script>"
      );

      expect(result.success).toBe(true);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          is_suspended: true,
          suspension_reason: expect.not.stringContaining("<script>"),
          moderated_by: MOD_USER_ID,
        })
      );
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "suspend_book",
          actor_id: MOD_USER_ID,
          target_type: "book",
          target_id: "book-42",
        })
      );
    });

    it("restores a suspended book and logs audit event", async () => {
      const result = await restoreBook("book-42");

      expect(result.success).toBe(true);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          is_suspended: false,
          suspension_reason: null,
        })
      );
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "restore_book",
          target_id: "book-42",
        })
      );
    });
  });

  describe("resolveReport & dismissReport", () => {
    it("resolves a report with action taken and notes", async () => {
      const result = await resolveReport(
        "report-123",
        "removed_content",
        "Content violated community guidelines"
      );

      expect(result.success).toBe(true);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "actioned",
          resolved_by: MOD_USER_ID,
          action_taken: "removed_content",
          resolution_notes: "Content violated community guidelines",
        })
      );
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "resolve_report",
          target_id: "report-123",
        })
      );
    });

    it("dismisses a report as benign", async () => {
      const result = await dismissReport("report-123", "False report");

      expect(result.success).toBe(true);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "dismissed",
          resolved_by: MOD_USER_ID,
          action_taken: "dismissed",
          resolution_notes: "False report",
        })
      );
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "dismiss_report",
          target_id: "report-123",
        })
      );
    });
  });

  describe("moderateReview", () => {
    it("updates review moderation status and writes audit log", async () => {
      const result = await moderateReview("rev-999", "hidden", "Excessive profanity");

      expect(result.success).toBe(true);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          moderation_status: "hidden",
          moderation_note: "Excessive profanity",
          moderated_by: MOD_USER_ID,
        })
      );
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "moderate_review_hidden",
          target_id: "rev-999",
        })
      );
    });
  });
});
