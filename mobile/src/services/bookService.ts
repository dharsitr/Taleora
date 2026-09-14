import { supabase } from "../config/supabase";
import { Book, BookDetail, Genre } from "../types";

/**
 * Transform Supabase joined raw book response into typed Book
 */
function transformBook(raw: any): Book {
  const genres: Genre[] = (raw.book_genres || [])
    .map((bg: any) => bg.genre)
    .filter(Boolean);

  return {
    ...raw,
    author: raw.author || {
      id: raw.author_id,
      display_name: "Unknown Author",
    },
    genres,
    average_rating: Number(raw.average_rating) || 0,
    ratings_count: Number(raw.ratings_count) || 0,
  };
}

export interface BookFilterParams {
  search?: string;
  genreSlug?: string;
  minRating?: number;
  sortBy?: "featured" | "rating" | "popular" | "newest" | "title";
  limit?: number;
}

/**
 * Fetch published books with author and genre relations
 */
export async function getBooks(filters: BookFilterParams = {}): Promise<Book[]> {
  try {
    let query = supabase
      .from("books")
      .select(
        `
        *,
        author:authors(*),
        book_genres(
          genre:genres(*)
        )
      `
      )
      .eq("status", "published")
      .eq("is_suspended", false);

    if (filters.minRating && filters.minRating > 0) {
      query = query.gte("average_rating", filters.minRating);
    }

    if (filters.search && filters.search.trim()) {
      query = query.ilike("title", `%${filters.search.trim()}%`);
    }

    switch (filters.sortBy) {
      case "rating":
        query = query.order("average_rating", { ascending: false });
        break;
      case "popular":
        query = query.order("ratings_count", { ascending: false });
        break;
      case "newest":
        query = query.order("published_at", { ascending: false, nullsFirst: false });
        break;
      case "title":
        query = query.order("title", { ascending: true });
        break;
      case "featured":
      default:
        query = query
          .order("featured", { ascending: false })
          .order("average_rating", { ascending: false });
        break;
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.error("Error fetching books:", error);
      return [];
    }

    let books = data.map(transformBook);

    // If filtered by genre slug
    if (filters.genreSlug && filters.genreSlug !== "all") {
      books = books.filter((b) =>
        b.genres.some((g) => g.slug === filters.genreSlug)
      );
    }

    return books;
  } catch (err) {
    console.error("Failed to query books:", err);
    return [];
  }
}

/**
 * Fetch featured books for home hero & banner
 */
export async function getFeaturedBooks(limit = 6): Promise<Book[]> {
  return getBooks({ sortBy: "featured", limit });
}

/**
 * Fetch trending books for discovery
 */
export async function getTrendingBooks(limit = 8): Promise<Book[]> {
  try {
    const { data, error } = await supabase
      .from("books")
      .select(
        `
        *,
        author:authors(*),
        book_genres(
          genre:genres(*)
        )
      `
      )
      .eq("status", "published")
      .eq("is_suspended", false)
      .eq("trending", true)
      .order("average_rating", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      return getBooks({ sortBy: "popular", limit });
    }

    return data.map(transformBook);
  } catch {
    return [];
  }
}

/**
 * Fetch complete book details and only its published chapters
 */
export async function getBookDetails(slugOrId: string): Promise<BookDetail | null> {
  try {
    // 1. Fetch book with author and genres
    let query = supabase
      .from("books")
      .select(
        `
        *,
        author:authors(*),
        book_genres(
          genre:genres(*)
        )
      `
      )
      .eq("status", "published")
      .eq("is_suspended", false);

    // Determine if UUID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      slugOrId
    );

    if (isUuid) {
      query = query.eq("id", slugOrId);
    } else {
      query = query.eq("slug", slugOrId);
    }

    const { data: bookData, error: bookError } = await query.maybeSingle();
    if (bookError || !bookData) {
      console.error("Error fetching book detail:", bookError);
      return null;
    }

    const book = transformBook(bookData);

    // 2. Fetch all published chapters for this book (drafts & scheduled are locked)
    const { data: chaptersData, error: chaptersError } = await supabase
      .from("chapters")
      .select("*")
      .eq("book_id", book.id)
      .eq("status", "published")
      .eq("is_suspended", false)
      .order("chapter_number", { ascending: true });

    if (chaptersError) {
      console.error("Error fetching chapters:", chaptersError);
      return { ...book, chapters: [] };
    }

    return {
      ...book,
      chapters: chaptersData || [],
    };
  } catch (err) {
    console.error("Failed to load book details:", err);
    return null;
  }
}

/**
 * Fetch all available genres
 */
export async function getGenres(): Promise<Genre[]> {
  try {
    const { data, error } = await supabase
      .from("genres")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
