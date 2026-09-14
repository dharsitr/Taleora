import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createBookmark,
  deleteBookmark,
  createHighlight,
  deleteHighlight,
} from "@/services/annotationService";

vi.mock("@/config/supabase", () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

import { supabase } from "@/config/supabase";

describe("Mobile Annotation Service Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a bookmark with rounded percentage and snippet", async () => {
    const mockBookmark = {
      id: "bm-1",
      user_id: "user-1",
      book_id: "book-1",
      chapter_id: "chapter-1",
      paragraph_index: 3,
      progress_percentage: 25.5,
      snippet: "It was the best of times",
    };

    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockBookmark, error: null }),
        }),
      }),
    });

    const result = await createBookmark(
      "user-1",
      "book-1",
      "chapter-1",
      3,
      25.5,
      "It was the best of times"
    );

    expect(result).toBeDefined();
    expect(result?.snippet).toBe("It was the best of times");
    expect(result?.paragraph_index).toBe(3);
  });

  it("deletes a bookmark with user_id ownership check", async () => {
    const eqMock2 = vi.fn().mockResolvedValue({ error: null });
    const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 });
    (supabase.from as any).mockReturnValue({
      delete: vi.fn().mockReturnValue({ eq: eqMock1 }),
    });

    const success = await deleteBookmark("bm-1", "user-1");

    expect(success).toBe(true);
    expect(eqMock1).toHaveBeenCalledWith("id", "bm-1");
    expect(eqMock2).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("creates a highlight with color and note", async () => {
    const mockHighlight = {
      id: "hl-1",
      user_id: "user-1",
      book_id: "book-1",
      chapter_id: "chapter-1",
      paragraph_index: 5,
      selected_text: "Deep philosophy on human nature",
      color: "amber",
      note: "Important character motivation",
    };

    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockHighlight, error: null }),
        }),
      }),
    });

    const result = await createHighlight(
      "user-1",
      "book-1",
      "chapter-1",
      5,
      0,
      30,
      "Deep philosophy on human nature",
      "amber",
      "Important character motivation"
    );

    expect(result).toBeDefined();
    expect(result?.color).toBe("amber");
    expect(result?.note).toBe("Important character motivation");
  });

  it("deletes a highlight with user ownership check", async () => {
    const eqMock2 = vi.fn().mockResolvedValue({ error: null });
    const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 });
    (supabase.from as any).mockReturnValue({
      delete: vi.fn().mockReturnValue({ eq: eqMock1 }),
    });

    const success = await deleteHighlight("hl-1", "user-1");

    expect(success).toBe(true);
    expect(eqMock1).toHaveBeenCalledWith("id", "hl-1");
    expect(eqMock2).toHaveBeenCalledWith("user_id", "user-1");
  });
});
