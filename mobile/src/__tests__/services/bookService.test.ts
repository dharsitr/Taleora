import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBooks, getBookDetails } from "@/services/bookService";

vi.mock("@/config/supabase", () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

import { supabase } from "@/config/supabase";

describe("Mobile Book Service Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries published books and transforms author & genre joins", async () => {
    const rawBooks = [
      {
        id: "book-1",
        title: "The Odyssey",
        slug: "the-odyssey",
        status: "published",
        is_suspended: false,
        featured: true,
        trending: false,
        total_chapters: 24,
        average_rating: "4.8",
        ratings_count: 120,
        author: {
          id: "author-1",
          display_name: "Homer",
        },
        book_genres: [
          { genre: { id: "g-1", name: "Epic", slug: "epic" } },
          { genre: { id: "g-2", name: "Mythology", slug: "mythology" } },
        ],
      },
    ];

    const mockQueryBuilder: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((resolve) =>
        Promise.resolve({ data: rawBooks, error: null }).then(resolve)
      ),
    };

    (supabase.from as any).mockReturnValue(mockQueryBuilder);

    const books = await getBooks({ sortBy: "featured" });

    expect(books.length).toBe(1);
    expect(books[0].title).toBe("The Odyssey");
    expect(books[0].author.display_name).toBe("Homer");
    expect(books[0].genres.length).toBe(2);
    expect(books[0].genres[0].name).toBe("Epic");
    expect(books[0].average_rating).toBe(4.8);
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith("status", "published");
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith("is_suspended", false);
  });

  it("fetches book details and its published chapters", async () => {
    const mockBookData = {
      id: "b4559d0f-8f9b-4e78-b954-95fb5c092aae",
      title: "Crime and Punishment",
      slug: "crime-and-punishment",
      status: "published",
      is_suspended: false,
      author: { id: "a-1", display_name: "Fyodor Dostoevsky" },
      book_genres: [{ genre: { id: "g-1", name: "Classics", slug: "classics" } }],
    };

    const mockChapters = [
      {
        id: "ch-1",
        book_id: "b4559d0f-8f9b-4e78-b954-95fb5c092aae",
        chapter_number: 1,
        title: "Part One: Chapter I",
        slug: "part-one-chapter-i",
        word_count: 3200,
        estimated_read_minutes: 12,
        status: "published",
      },
    ];

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "books") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: mockBookData, error: null }),
        };
      }
      if (table === "chapters") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockChapters, error: null }),
        };
      }
      return {};
    });

    const detail = await getBookDetails("crime-and-punishment");

    expect(detail).toBeDefined();
    expect(detail?.title).toBe("Crime and Punishment");
    expect(detail?.chapters.length).toBe(1);
    expect(detail?.chapters[0].title).toBe("Part One: Chapter I");
  });
});
