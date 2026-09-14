import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  syncReadingProgress,
  logReadingSession,
  getChapterReaderData,
} from "@/services/readerService";

vi.mock("@/config/supabase", () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

vi.mock("@/services/bookService", () => {
  return {
    getBookDetails: vi.fn(),
  };
});

import { supabase } from "@/config/supabase";
import { getBookDetails } from "@/services/bookService";

describe("Mobile Reader Service Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("syncs reading progress to Supabase reading_progress table", async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({
      upsert: upsertMock,
    });

    const success = await syncReadingProgress(
      "user-1",
      "book-1",
      "chapter-2",
      45.5,
      false
    );

    expect(success).toBe(true);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        book_id: "book-1",
        current_chapter_id: "chapter-2",
        progress_percentage: 45.5,
        is_completed: false,
      }),
      { onConflict: "user_id,book_id" }
    );
  });

  it("logs reading sessions to maintain user reading streaks", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({
      insert: insertMock,
    });

    const success = await logReadingSession(
      "user-1",
      "book-1",
      "chapter-2",
      120, // 2 minutes
      2 // pages
    );

    expect(success).toBe(true);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        book_id: "book-1",
        chapter_id: "chapter-2",
        duration_seconds: 120,
        pages_read: 2,
      })
    );
  });

  it("ignores sessions shorter than 10 seconds to avoid accidental clutter", async () => {
    const insertMock = vi.fn();
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    const success = await logReadingSession("user-1", "book-1", "chapter-1", 5);
    expect(success).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("resolves current, previous, and next chapters properly in getChapterReaderData", async () => {
    const mockChapters = [
      { id: "ch-1", slug: "ch-1", chapter_number: 1, title: "Ch 1" },
      { id: "ch-2", slug: "ch-2", chapter_number: 2, title: "Ch 2" },
      { id: "ch-3", slug: "ch-3", chapter_number: 3, title: "Ch 3" },
    ];

    (getBookDetails as any).mockResolvedValue({
      id: "b-1",
      title: "Great Book",
      slug: "great-book",
      chapters: mockChapters,
    });

    const data = await getChapterReaderData("great-book", "ch-2");

    expect(data).toBeDefined();
    expect(data?.currentChapter.slug).toBe("ch-2");
    expect(data?.prevChapter?.slug).toBe("ch-1");
    expect(data?.nextChapter?.slug).toBe("ch-3");
  });
});
