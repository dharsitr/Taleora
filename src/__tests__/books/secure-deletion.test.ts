import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractStoragePath,
  deleteBookSecurely,
  deleteChapterSecurely,
} from "@/lib/books/deletion";

// Mock Supabase client
const mockRemove = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});

let mockBookResult: any = null;
let mockChapterResult: any = null;
let mockProfileResult: any = null;
let mockRemainingChapters: any[] = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => {
      if (table === "books") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockImplementation(async () => ({
                data: mockBookResult,
                error: null,
              })),
            }),
          }),
          delete: mockDelete,
          update: mockUpdate,
        };
      }
      if (table === "chapters") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((_col: string, _val: string) => ({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockImplementation(async () => ({
                  data: mockChapterResult,
                  error: null,
                })),
              }),
              order: vi.fn().mockImplementation(async () => ({
                data: mockRemainingChapters,
                error: null,
              })),
            })),
          }),
          delete: mockDelete,
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockImplementation(async () => ({
                data: mockProfileResult,
                error: null,
              })),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        remove: mockRemove,
      }),
    },
  })),
}));

describe("Secure Deletion Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBookResult = null;
    mockChapterResult = null;
    mockProfileResult = null;
    mockRemainingChapters = [];
  });

  describe("extractStoragePath", () => {
    it("should accurately extract file paths from storage URLs", () => {
      const url =
        "https://tqcxnzmfcgortjkjlisu.supabase.co/storage/v1/object/public/book-covers/author-1/cover-123.webp";
      const path = extractStoragePath(url, "book-covers");
      expect(path).toBe("author-1/cover-123.webp");
    });

    it("should handle query parameters safely", () => {
      const url =
        "https://tqcxnzmfcgortjkjlisu.supabase.co/storage/v1/object/public/book-covers/author-1/cover-123.webp?t=2026-09-15";
      const path = extractStoragePath(url, "book-covers");
      expect(path).toBe("author-1/cover-123.webp");
    });

    it("should return null for invalid or null URLs", () => {
      expect(extractStoragePath(null, "book-covers")).toBeNull();
      expect(extractStoragePath("", "book-covers")).toBeNull();
      expect(extractStoragePath("https://external-cdn.com/image.png", "book-covers")).toBeNull();
    });
  });

  describe("deleteBookSecurely Authorization & Cascade Cleanup", () => {
    it("should reject deletion of another author's story with 403 Forbidden", async () => {
      mockBookResult = {
        id: "book-1",
        user_id: "author-owner-id",
        slug: "epic-tale",
        title: "Epic Tale",
        cover_image_url: null,
      };
      mockProfileResult = { role: "user" };

      const attackerId = "malicious-user-id";
      const result = await deleteBookSecurely(attackerId, "book-1");

      expect(result.success).toBe(false);
      expect(result.code).toBe(403);
      expect(result.error).toContain("Forbidden");
      expect(mockDelete).not.toHaveBeenCalled();
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it("should return 404 Not Found if story does not exist", async () => {
      mockBookResult = null;
      const result = await deleteBookSecurely("author-owner-id", "non-existent-book");

      expect(result.success).toBe(false);
      expect(result.code).toBe(404);
      expect(result.error).toContain("not found");
    });

    it("should allow book owner to delete story and clean up storage files", async () => {
      const ownerId = "author-owner-id";
      mockBookResult = {
        id: "book-1",
        user_id: ownerId,
        slug: "epic-tale",
        title: "Epic Tale",
        cover_image_url:
          "https://tqcxnzmfcgortjkjlisu.supabase.co/storage/v1/object/public/book-covers/author-owner-id/cover.png",
      };

      const result = await deleteBookSecurely(ownerId, "book-1");

      expect(result.success).toBe(true);
      expect(result.code).toBe(200);
      expect(mockRemove).toHaveBeenCalledWith(["author-owner-id/cover.png"]);
      expect(mockRemove).toHaveBeenCalledWith(["epic-tale.json"]);
      expect(mockDelete).toHaveBeenCalled();
    });

    it("should allow administrator to delete any story", async () => {
      const adminId = "admin-id";
      mockBookResult = {
        id: "book-1",
        user_id: "different-author-id",
        slug: "reported-story",
        title: "Reported Story",
        cover_image_url: null,
      };
      mockProfileResult = { role: "admin" };

      const result = await deleteBookSecurely(adminId, "book-1");

      expect(result.success).toBe(true);
      expect(result.code).toBe(200);
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("deleteChapterSecurely Authorization & Recalculation", () => {
    it("should reject deletion of another author's chapter with 403 Forbidden", async () => {
      mockBookResult = {
        id: "book-1",
        user_id: "author-owner-id",
        slug: "epic-tale",
        total_chapters: 5,
      };
      mockChapterResult = {
        id: "chapter-1",
        book_id: "book-1",
        user_id: "author-owner-id",
        title: "Chapter 1",
        chapter_number: 1,
      };
      mockProfileResult = { role: "user" };

      const attackerId = "malicious-user-id";
      const result = await deleteChapterSecurely(attackerId, "book-1", "chapter-1");

      expect(result.success).toBe(false);
      expect(result.code).toBe(403);
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it("should allow owner to delete chapter and update parent book totals", async () => {
      const ownerId = "author-owner-id";
      mockBookResult = {
        id: "book-1",
        user_id: ownerId,
        slug: "epic-tale",
        total_chapters: 3,
      };
      mockChapterResult = {
        id: "chapter-1",
        book_id: "book-1",
        user_id: ownerId,
        title: "Chapter 1",
        chapter_number: 1,
      };
      mockRemainingChapters = [
        { word_count: 500, chapter_number: 1 },
        { word_count: 700, chapter_number: 2 },
      ];

      const result = await deleteChapterSecurely(ownerId, "book-1", "chapter-1");

      expect(result.success).toBe(true);
      expect(result.code).toBe(200);
      expect(mockDelete).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          total_chapters: 2,
          estimated_read_time_minutes: 6, // (500 + 700) / 200 = 6
        })
      );
    });
  });
});
