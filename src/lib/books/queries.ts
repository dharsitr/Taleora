import { createClient as createBrowserClient } from "@/lib/supabase/client";
import {
  AuthorRow,
  AuthorStats,
  AuthorStoryWithCounts,
  BookDetail,
  BookFilterOptions,
  BookWithAuthorAndGenres,
  BookmarkRow,
  BookmarkWithDetails,
  ChapterReaderData,
  ChapterRow,
  CreateBookInput,
  CreateChapterInput,
  GenreRow,
  GenreWithCount,
  HighlightColor,
  HighlightRow,
  HighlightWithDetails,
  LibraryItem,
  UpdateBookInput,
  UpdateChapterInput,
} from "@/types/books";

/**
 * Transforms raw Supabase book join into typed BookWithAuthorAndGenres
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformBook(raw: any): BookWithAuthorAndGenres {
  const genres: GenreRow[] = (raw.book_genres || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((bg: any) => bg.genre)
    .filter(Boolean);

  return {
    ...raw,
    author: raw.author,
    genres,
  };
}

/**
 * Fetch all published books with authors and genres, supporting search, genre filter, rating filter, date range, tags, and sorting.
 */
export async function getBooks(
  options: BookFilterOptions = {}
): Promise<BookWithAuthorAndGenres[]> {
  const supabase = createBrowserClient();
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
    .eq("status", "published");

  // Min rating filter
  if (options.minRating && options.minRating > 0) {
    query = query.gte("average_rating", options.minRating);
  }

  // Publication date range filter
  if (options.dateRange === "month") {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("published_at", thirtyDaysAgo);
  } else if (options.dateRange === "year") {
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("published_at", yearAgo);
  }

  // Tag filter using Postgres array contains operator
  if (options.tag && options.tag.trim() !== "") {
    query = query.contains("tags", [options.tag.toLowerCase().trim()]);
  }

  // Sorting
  switch (options.sort) {
    case "rating":
      query = query
        .order("average_rating", { ascending: false })
        .order("ratings_count", { ascending: false });
      break;
    case "popular":
    case "popularity":
      query = query
        .order("ratings_count", { ascending: false })
        .order("average_rating", { ascending: false });
      break;
    case "newest":
      query = query.order("published_at", {
        ascending: false,
        nullsFirst: false,
      });
      break;
    case "updated":
      query = query.order("updated_at", { ascending: false });
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

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error("Error fetching books:", error);
    return [];
  }

  let books = data.map(transformBook);

  // Filter by Genre Slug if specified
  if (options.genreSlug && options.genreSlug !== "all") {
    books = books.filter((b) =>
      b.genres.some((g) => g.slug === options.genreSlug)
    );
  }

  // Text filter for search query across title, subtitle, author name, description, genre name/slug, and tags
  if (options.search && options.search.trim() !== "") {
    const q = options.search.toLowerCase().trim();
    books = books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.subtitle && b.subtitle.toLowerCase().includes(q)) ||
        (b.author?.name && b.author.name.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        b.genres.some(
          (g) =>
            g.name.toLowerCase().includes(q) ||
            g.slug.toLowerCase().includes(q)
        ) ||
        (Array.isArray(b.tags) &&
          b.tags.some((t: string) => t.toLowerCase().includes(q)))
    );
  }

  return books;
}

/**
 * Fetch top trending stories based on trending flag or high reader engagement.
 */
export async function getTrendingBooks(
  limit: number = 6
): Promise<BookWithAuthorAndGenres[]> {
  const supabase = createBrowserClient();
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
    .order("trending", { ascending: false })
    .order("ratings_count", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("Error fetching trending books:", error);
    return [];
  }

  return data.map(transformBook);
}

/**
 * Fetch featured spotlight stories with high ratings and editorial curation.
 */
export async function getFeaturedBooks(
  limit: number = 4
): Promise<BookWithAuthorAndGenres[]> {
  const supabase = createBrowserClient();
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
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !data) {
    console.error("Error fetching featured books:", error);
    return [];
  }

  return data.map(transformBook);
}

/**
 * Fetch all genres with the count of published books in each category.
 */
export async function getGenreStats(): Promise<GenreWithCount[]> {
  const supabase = createBrowserClient();

  const { data: genresData, error: genresErr } = await supabase
    .from("genres")
    .select("*")
    .order("name", { ascending: true });

  if (genresErr || !genresData) {
    console.error("Error fetching genres:", genresErr);
    return [];
  }

  const { data: bgData, error: bgErr } = await supabase
    .from("book_genres")
    .select(
      `
      genre_id,
      book:books!inner(status)
    `
    )
    .eq("book.status", "published");

  if (bgErr || !bgData) {
    console.error("Error fetching book-genre relations:", bgErr);
    return genresData.map((g) => ({ ...g, bookCount: 0 }));
  }

  const countsByGenre: Record<string, number> = {};
  for (const item of bgData) {
    countsByGenre[item.genre_id] = (countsByGenre[item.genre_id] || 0) + 1;
  }

  return genresData.map((g) => ({
    ...g,
    bookCount: countsByGenre[g.id] || 0,
  }));
}

/**
 * Fetch personalized recommendations for a user based on their library and reading history.
 * If user has no history or is unauthenticated, returns top-rated curated books.
 */
export async function getPersonalizedRecommendations(
  userId?: string,
  limit: number = 6
): Promise<{ books: BookWithAuthorAndGenres[]; reason: string }> {
  const supabase = createBrowserClient();

  if (userId) {
    try {
      const { data: userProgress } = await supabase
        .from("reading_progress")
        .select(
          `
          book_id,
          book:books(
            author_id,
            book_genres(genre_id)
          )
        `
        )
        .eq("user_id", userId);

      if (userProgress && userProgress.length > 0) {
        const readBookIds = new Set<string>();
        const preferredAuthorIds = new Set<string>();
        const preferredGenreIds = new Set<string>();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userProgress.forEach((p: any) => {
          if (p.book_id) readBookIds.add(p.book_id);
          if (p.book?.author_id) preferredAuthorIds.add(p.book.author_id);
          if (p.book?.book_genres) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            p.book.book_genres.forEach((bg: any) => {
              if (bg.genre_id) preferredGenreIds.add(bg.genre_id);
            });
          }
        });

        const { data: allPublished } = await supabase
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
          .eq("status", "published");

        if (allPublished && allPublished.length > 0) {
          const transformed = allPublished.map(transformBook);
          const unread = transformed.filter((b) => !readBookIds.has(b.id));

          if (unread.length > 0) {
            const scored = unread.map((b) => {
              let score = Number(b.average_rating) || 0;
              if (preferredAuthorIds.has(b.author_id)) score += 3.0;
              const sharedGenres = b.genres.filter((g) =>
                preferredGenreIds.has(g.id)
              ).length;
              score += sharedGenres * 2.0;
              return { book: b, score, sharedGenres };
            });

            scored.sort((a, b) => b.score - a.score);
            const recommended = scored.slice(0, limit).map((s) => s.book);

            if (recommended.length > 0) {
              return {
                books: recommended,
                reason: "Curated based on your library shelves & reading taste",
              };
            }
          }
        }
      }
    } catch (err) {
      console.error("Error computing personalized recommendations:", err);
    }
  }

  // Fallback for guests or readers without history
  const fallback = await getBooks({
    sort: "rating",
    limit,
  });

  return {
    books: fallback,
    reason: "Curated staff favorites & highest community ratings",
  };
}

/**
 * Fetch a single book by slug or ID with author, genres, and published chapters.
 */
export async function getBookBySlug(slugOrId: string): Promise<BookDetail | null> {
  const supabase = createBrowserClient();

  // Try finding by slug first, otherwise by UUID id
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      slugOrId
    );

  let query = supabase
    .from("books")
    .select(
      `
      *,
      author:authors(*),
      book_genres(
        genre:genres(*)
      ),
      chapters(
        *
      )
    `
    )
    .eq("status", "published");

  if (isUuid) {
    query = query.eq("id", slugOrId);
  } else {
    query = query.eq("slug", slugOrId);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    console.error("Error fetching book details:", error);
    return null;
  }

  const genres: GenreRow[] = (data.book_genres || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((bg: any) => bg.genre)
    .filter(Boolean);

  // Filter published chapters and sort by chapter_number
  const chapters = (data.chapters || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((ch: any) => ch.status === "published")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.chapter_number - b.chapter_number);

  return {
    ...data,
    author: data.author,
    genres,
    chapters,
  };
}

/**
 * Fetch all available genres.
 */
export async function getGenres(): Promise<GenreRow[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("genres")
    .select("*")
    .order("name", { ascending: true });

  if (error || !data) {
    console.error("Error fetching genres:", error);
    return [];
  }
  return data;
}

/**
 * Fetch all books currently in the authenticated user's library (reading_progress).
 */
export async function getUserLibrary(userId: string): Promise<LibraryItem[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("reading_progress")
    .select(
      `
      *,
      book:books(
        *,
        author:authors(*),
        book_genres(
          genre:genres(*)
        )
      ),
      current_chapter:chapters(*)
    `
    )
    .eq("user_id", userId)
    .order("last_read_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching user library:", error);
    return [];
  }

  return data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((item: any) => item.book)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any) => ({
      ...item,
      book: transformBook(item.book),
    }));
}

/**
 * Check if a book is present in the user's library.
 */
export async function isInLibrary(
  userId: string,
  bookId: string
): Promise<boolean> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("reading_progress")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();

  if (error) {
    console.error("Error checking library status:", error);
    return false;
  }
  return !!data;
}

/**
 * Add a book to user's library.
 */
export async function addToLibrary(
  userId: string,
  bookId: string
): Promise<boolean> {
  const supabase = createBrowserClient();
  const { error } = await supabase.from("reading_progress").upsert(
    {
      user_id: userId,
      book_id: bookId,
      progress_percentage: 0,
      is_completed: false,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "user_id,book_id" }
  );

  if (error) {
    console.error("Error adding to library:", error);
    return false;
  }
  return true;
}

/**
 * Remove a book from user's library.
 */
export async function removeFromLibrary(
  userId: string,
  bookId: string
): Promise<boolean> {
  const supabase = createBrowserClient();
  const { error } = await supabase
    .from("reading_progress")
    .delete()
    .eq("user_id", userId)
    .eq("book_id", bookId);

  if (error) {
    console.error("Error removing from library:", error);
    return false;
  }
  return true;
}

/**
 * Fetch chapter reader data: current chapter, adjacent chapters, all chapters, and book metadata.
 */
export async function getChapterReaderData(
  bookSlug: string,
  chapterSlug?: string
): Promise<ChapterReaderData | null> {
  const supabase = createBrowserClient();

  // 1. Fetch book with author and genres
  const { data: bookData, error: bookErr } = await supabase
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
    .eq("slug", bookSlug)
    .eq("status", "published")
    .maybeSingle();

  if (bookErr || !bookData) {
    console.error("Error fetching book for reader:", bookErr);
    return null;
  }

  const book = transformBook(bookData);

  // 2. Fetch all published chapters for this book
  const { data: chaptersData, error: chaptersErr } = await supabase
    .from("chapters")
    .select("*")
    .eq("book_id", book.id)
    .eq("status", "published")
    .order("chapter_number", { ascending: true });

  if (chaptersErr || !chaptersData || chaptersData.length === 0) {
    console.error("Error fetching chapters for reader:", chaptersErr);
    return null;
  }

  const allChapters = chaptersData;

  // 3. Resolve target chapter: by slug or fallback to first chapter
  let currentIdx = -1;
  if (chapterSlug) {
    currentIdx = allChapters.findIndex((ch) => ch.slug === chapterSlug);
    if (currentIdx === -1) {
      // Specified chapter slug was not found
      return null;
    }
  } else {
    currentIdx = 0; // Default to first chapter
  }

  const currentChapter = allChapters[currentIdx];
  const prevChapter = currentIdx > 0 ? allChapters[currentIdx - 1] : null;
  const nextChapter =
    currentIdx < allChapters.length - 1 ? allChapters[currentIdx + 1] : null;

  return {
    book,
    currentChapter,
    allChapters,
    prevChapter,
    nextChapter,
  };
}

/**
 * Save user reading progress securely in Supabase under RLS.
 */
export async function saveReadingProgress(
  userId: string,
  bookId: string,
  chapterId: string,
  progressPercentage: number,
  isCompleted: boolean = false
): Promise<boolean> {
  const supabase = createBrowserClient();

  const roundedProgress = Math.min(
    100,
    Math.max(0, parseFloat(progressPercentage.toFixed(2)))
  );

  const payload = {
    user_id: userId,
    book_id: bookId,
    current_chapter_id: chapterId,
    progress_percentage: roundedProgress,
    is_completed: isCompleted || roundedProgress >= 100,
    completed_at: isCompleted || roundedProgress >= 100 ? new Date().toISOString() : null,
    last_read_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("reading_progress")
    .upsert(payload, { onConflict: "user_id,book_id" });

  if (error) {
    console.error("Error saving reading progress:", error);
    return false;
  }

  return true;
}

/**
 * Get user's saved reading position for a book to resume.
 */
export async function getUserChapterProgress(
  userId: string,
  bookId: string
): Promise<{
  current_chapter_id: string | null;
  progress_percentage: number;
  is_completed: boolean;
} | null> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("reading_progress")
    .select("current_chapter_id, progress_percentage, is_completed")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Create a new bookmark at a specific paragraph and scroll position.
 */
export async function createBookmark(
  userId: string,
  bookId: string,
  chapterId: string,
  paragraphIndex: number,
  progressPercentage: number,
  snippet?: string,
  label?: string
): Promise<BookmarkRow | null> {
  const supabase = createBrowserClient();
  const roundedProgress = Math.min(
    100,
    Math.max(0, parseFloat(progressPercentage.toFixed(2)))
  );

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: userId,
      book_id: bookId,
      chapter_id: chapterId,
      paragraph_index: paragraphIndex,
      progress_percentage: roundedProgress,
      snippet: snippet?.slice(0, 300) || null,
      label: label?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating bookmark:", error);
    return null;
  }

  return data;
}

/**
 * Delete a user's bookmark.
 */
export async function deleteBookmark(
  bookmarkId: string,
  userId: string
): Promise<boolean> {
  const supabase = createBrowserClient();
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting bookmark:", error);
    return false;
  }
  return true;
}

/**
 * Get all bookmarks for a user, optionally filtered by book.
 */
export async function getUserBookmarks(
  userId: string,
  bookId?: string
): Promise<BookmarkWithDetails[]> {
  const supabase = createBrowserClient();
  let query = supabase
    .from("bookmarks")
    .select(
      `
      *,
      book:books(
        *,
        author:authors(*),
        book_genres(
          genre:genres(*)
        )
      ),
      chapter:chapters(*)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (bookId) {
    query = query.eq("book_id", bookId);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error("Error fetching bookmarks:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((item: any) => ({
    ...item,
    book: transformBook(item.book),
    chapter: item.chapter,
  }));
}

/**
 * Create a text highlight in a chapter.
 */
export async function createHighlight(
  userId: string,
  bookId: string,
  chapterId: string,
  paragraphIndex: number,
  startOffset: number,
  endOffset: number,
  selectedText: string,
  color: HighlightColor = "amber",
  note?: string
): Promise<HighlightRow | null> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("highlights")
    .insert({
      user_id: userId,
      book_id: bookId,
      chapter_id: chapterId,
      paragraph_index: paragraphIndex,
      start_offset: startOffset,
      end_offset: endOffset,
      selected_text: selectedText,
      color,
      note: note?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating highlight:", error);
    return null;
  }

  return data;
}

/**
 * Update a highlight note and/or color.
 */
export async function updateHighlightNote(
  highlightId: string,
  userId: string,
  note: string | null,
  color?: HighlightColor
): Promise<HighlightRow | null> {
  const supabase = createBrowserClient();
  const updatePayload: {
    note?: string | null;
    updated_at?: string;
    color?: HighlightColor;
  } = {
    note: note?.trim() || null,
    updated_at: new Date().toISOString(),
  };
  if (color) {
    updatePayload.color = color;
  }

  const { data, error } = await supabase
    .from("highlights")
    .update(updatePayload)
    .eq("id", highlightId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating highlight note:", error);
    return null;
  }

  return data;
}

/**
 * Delete a user's highlight.
 */
export async function deleteHighlight(
  highlightId: string,
  userId: string
): Promise<boolean> {
  const supabase = createBrowserClient();
  const { error } = await supabase
    .from("highlights")
    .delete()
    .eq("id", highlightId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting highlight:", error);
    return false;
  }
  return true;
}

/**
 * Fetch all highlights for a specific chapter and user.
 */
export async function getChapterHighlights(
  userId: string,
  chapterId: string
): Promise<HighlightRow[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("highlights")
    .select("*")
    .eq("user_id", userId)
    .eq("chapter_id", chapterId)
    .order("paragraph_index", { ascending: true })
    .order("start_offset", { ascending: true });

  if (error || !data) {
    console.error("Error fetching chapter highlights:", error);
    return [];
  }

  return data;
}

/**
 * Fetch all highlights with book and chapter details for a user.
 */
export async function getUserHighlights(
  userId: string,
  bookId?: string
): Promise<HighlightWithDetails[]> {
  const supabase = createBrowserClient();
  let query = supabase
    .from("highlights")
    .select(
      `
      *,
      book:books(
        *,
        author:authors(*),
        book_genres(
          genre:genres(*)
        )
      ),
      chapter:chapters(*)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (bookId) {
    query = query.eq("book_id", bookId);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error("Error fetching user highlights:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((item: any) => ({
    ...item,
    book: transformBook(item.book),
    chapter: item.chapter,
  }));
}

/**
 * Slugify a string for clean URL paths
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Trigger publication of any scheduled chapters whose scheduled_for time has passed.
 */
export async function publishScheduledChapters(): Promise<number> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc("publish_scheduled_chapters");
  if (error) {
    console.error("Error publishing scheduled chapters:", error);
    return 0;
  }
  return (data as number) || 0;
}

// Deduplicate concurrent in-flight requests for the same userId (e.g. React StrictMode or concurrent page mounts)
const pendingAuthorRequests = new Map<string, Promise<AuthorRow | null>>();

/**
 * Fetch or automatically initialize an author profile for a registered user.
 */
export async function getOrCreateAuthorProfile(
  userId: string,
  defaultName: string = "Author"
): Promise<AuthorRow | null> {
  if (!userId) return null;

  if (pendingAuthorRequests.has(userId)) {
    return pendingAuthorRequests.get(userId)!;
  }

  const requestPromise = (async (): Promise<AuthorRow | null> => {
    const supabase = createBrowserClient();

    // 1. Check if author profile already exists
    const { data: existing, error: fetchError } = await supabase
      .from("authors")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    if (fetchError) {
      console.warn("Notice: Fetching author profile returned:", fetchError.message || fetchError);
    }

    // 2. Ensure user profile exists in public.profiles (foreign key constraint)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      const cleanName = defaultName.trim() || "Author";
      await supabase.from("profiles").upsert(
        {
          id: userId,
          username: `author_${userId.slice(0, 8)}`,
          full_name: cleanName,
        },
        { onConflict: "id" }
      );
    }

    // 3. Create default author profile for this user
    const baseSlug = slugify(defaultName) || "author";
    const uniqueSlug = `${baseSlug}-${userId.slice(0, 6)}`;

    const { data: created, error: createError } = await supabase
      .from("authors")
      .insert({
        user_id: userId,
        name: defaultName.trim() || "Author",
        slug: uniqueSlug,
      })
      .select()
      .maybeSingle();

    if (createError) {
      // If unique constraint violation (e.g. concurrent creation on user_id or slug from another tab/render),
      // re-fetch the existing author row that was just created!
      if (
        createError.code === "23505" ||
        createError.message?.includes("unique") ||
        createError.message?.includes("duplicate") ||
        createError.message?.includes("authors_user_id_key")
      ) {
        const { data: fallback } = await supabase
          .from("authors")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (fallback) {
          return fallback;
        }

        // If slug collided with another author's slug, retry with randomized suffix
        if (createError.message?.includes("authors_slug_key")) {
          const randomizedSlug = `${baseSlug}-${userId.slice(0, 4)}-${Math.random().toString(36).slice(2, 6)}`;
          const { data: retryCreated } = await supabase
            .from("authors")
            .insert({
              user_id: userId,
              name: defaultName.trim() || "Author",
              slug: randomizedSlug,
            })
            .select()
            .maybeSingle();

          if (retryCreated) return retryCreated;
        }
      }

      console.error(
        "Error creating author profile:",
        createError.message || createError.details || JSON.stringify(createError)
      );
      return null;
    }

    return created;
  })();

  pendingAuthorRequests.set(userId, requestPromise);
  try {
    return await requestPromise;
  } finally {
    pendingAuthorRequests.delete(userId);
  }
}

/**
 * Update an author's profile details.
 */
export async function updateAuthorProfile(
  userId: string,
  data: {
    name?: string;
    bio?: string | null;
    website?: string | null;
    avatar_url?: string | null;
  }
): Promise<AuthorRow | null> {
  const supabase = createBrowserClient();

  const updateData: {
    name?: string;
    bio?: string | null;
    website?: string | null;
    avatar_url?: string | null;
    updated_at: string;
  } = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from("authors")
    .update(updateData)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating author profile:", error);
    return null;
  }

  return updated;
}

/**
 * Fetch author dashboard statistics (total stories, chapters, words, etc.)
 */
export async function getAuthorStats(userId: string): Promise<AuthorStats> {
  const supabase = createBrowserClient();

  // Run scheduled chapters check
  await publishScheduledChapters();

  const [booksRes, chaptersRes] = await Promise.all([
    supabase.from("books").select("id").eq("user_id", userId),
    supabase
      .from("chapters")
      .select("id, status, word_count")
      .eq("user_id", userId),
  ]);

  const totalStories = booksRes.data?.length || 0;
  const chapters = chaptersRes.data || [];

  let publishedChapters = 0;
  let scheduledChapters = 0;
  let draftChapters = 0;
  let totalWords = 0;

  for (const c of chapters) {
    totalWords += c.word_count || 0;
    if (c.status === "published") publishedChapters++;
    else if (c.status === "scheduled") scheduledChapters++;
    else if (c.status === "draft") draftChapters++;
  }

  return {
    totalStories,
    publishedChapters,
    scheduledChapters,
    draftChapters,
    totalWords,
  };
}

/**
 * Fetch all stories created by an author with detailed chapter counts.
 */
export async function getAuthorStories(
  userId: string
): Promise<AuthorStoryWithCounts[]> {
  const supabase = createBrowserClient();

  // Ensure scheduled chapters are published
  await publishScheduledChapters();

  const { data: books, error } = await supabase
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
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !books) {
    console.error("Error fetching author stories:", error);
    return [];
  }

  // Fetch all chapters for this author to compute counts
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, book_id, status, word_count")
    .eq("user_id", userId);

  const chaptersByBook: Record<
    string,
    {
      total: number;
      published: number;
      scheduled: number;
      draft: number;
      words: number;
    }
  > = {};

  for (const c of chapters || []) {
    if (!chaptersByBook[c.book_id]) {
      chaptersByBook[c.book_id] = {
        total: 0,
        published: 0,
        scheduled: 0,
        draft: 0,
        words: 0,
      };
    }
    const b = chaptersByBook[c.book_id];
    b.total++;
    b.words += c.word_count || 0;
    if (c.status === "published") b.published++;
    else if (c.status === "scheduled") b.scheduled++;
    else if (c.status === "draft") b.draft++;
  }

  return books.map((raw) => {
    const transformed = transformBook(raw);
    const stats = chaptersByBook[transformed.id] || {
      total: 0,
      published: 0,
      scheduled: 0,
      draft: 0,
      words: 0,
    };

    return {
      ...transformed,
      chaptersCount: stats.total,
      publishedChaptersCount: stats.published,
      scheduledChaptersCount: stats.scheduled,
      draftChaptersCount: stats.draft,
      totalWords: stats.words,
    };
  });
}

/**
 * Fetch a single story for an author to edit.
 */
export async function getAuthorStory(
  userId: string,
  bookId: string
): Promise<BookDetail | null> {
  const supabase = createBrowserClient();

  const { data: book, error } = await supabase
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
    .eq("id", bookId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !book) {
    console.error("Error fetching author story:", error);
    return null;
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("book_id", bookId)
    .order("chapter_number", { ascending: true });

  const transformed = transformBook(book);

  return {
    ...transformed,
    chapters: chapters || [],
  };
}

/**
 * Create a new story for an author.
 */
export async function createStory(
  userId: string,
  input: CreateBookInput
): Promise<BookWithAuthorAndGenres | null> {
  const supabase = createBrowserClient();

  // 1. Ensure author profile exists
  const author = await getOrCreateAuthorProfile(userId);
  if (!author) {
    throw new Error("Unable to locate or create author profile.");
  }

  // 2. Generate unique slug
  const baseSlug = slugify(input.title) || "untitled-story";
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  // 3. Insert Book
  const { data: book, error: bookError } = await supabase
    .from("books")
    .insert({
      user_id: userId,
      author_id: author.id,
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || null,
      slug: input.slug?.trim() || uniqueSlug,
      description: input.description?.trim() || null,
      cover_gradient:
        input.cover_gradient || "from-amber-700 via-stone-800 to-zinc-950",
      cover_accent: input.cover_accent || "#E28743",
      cover_image_url: input.cover_image_url || null,
      status: input.status || "draft",
      release_schedule: input.release_schedule || "immediate",
      published_at: input.status === "published" ? new Date().toISOString() : null,
    })
    .select(
      `
      *,
      author:authors(*),
      book_genres(
        genre:genres(*)
      )
    `
    )
    .single();

  if (bookError || !book) {
    console.error("Error creating book:", bookError);
    return null;
  }

  // 4. Insert Book Genres if provided
  if (input.genreIds && input.genreIds.length > 0) {
    const genreInserts = input.genreIds.map((genre_id) => ({
      book_id: book.id,
      genre_id,
    }));
    await supabase.from("book_genres").insert(genreInserts);
  }

  return transformBook(book);
}

/**
 * Update an existing story's details, status, or genres.
 */
export async function updateStory(
  userId: string,
  bookId: string,
  input: UpdateBookInput
): Promise<BookWithAuthorAndGenres | null> {
  const supabase = createBrowserClient();

  const updateData: {
    title?: string;
    subtitle?: string | null;
    slug?: string;
    description?: string | null;
    cover_image_url?: string | null;
    cover_gradient?: string | null;
    cover_accent?: string | null;
    status?: "draft" | "published" | "archived";
    release_schedule?: "immediate" | "manual" | "weekly" | "biweekly" | "monthly" | "custom";
    published_at?: string | null;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.subtitle !== undefined) updateData.subtitle = input.subtitle?.trim() || null;
  if (input.slug !== undefined) updateData.slug = input.slug.trim();
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.cover_image_url !== undefined) updateData.cover_image_url = input.cover_image_url;
  if (input.cover_gradient !== undefined) updateData.cover_gradient = input.cover_gradient;
  if (input.cover_accent !== undefined) updateData.cover_accent = input.cover_accent;
  if (input.release_schedule !== undefined) updateData.release_schedule = input.release_schedule;
  if (input.status !== undefined) {
    updateData.status = input.status;
    if (input.status === "published") {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { data: updatedBook, error: updateError } = await supabase
    .from("books")
    .update(updateData)
    .eq("id", bookId)
    .eq("user_id", userId)
    .select(
      `
      *,
      author:authors(*),
      book_genres(
        genre:genres(*)
      )
    `
    )
    .single();

  if (updateError || !updatedBook) {
    console.error("Error updating book:", updateError);
    return null;
  }

  // Sync genres if provided
  if (input.genreIds !== undefined) {
    // Delete existing
    await supabase.from("book_genres").delete().eq("book_id", bookId);
    // Insert new
    if (input.genreIds.length > 0) {
      const inserts = input.genreIds.map((genre_id) => ({
        book_id: bookId,
        genre_id,
      }));
      await supabase.from("book_genres").insert(inserts);
    }
  }

  return transformBook(updatedBook);
}

/**
 * Delete an author's story and its associated chapters (cascade).
 */
export async function deleteStory(
  userId: string,
  bookId: string
): Promise<boolean> {
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from("books")
    .delete()
    .eq("id", bookId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting story:", error);
    return false;
  }

  return true;
}

/**
 * Get all chapters for a book in author view (all statuses included).
 */
export async function getStoryChaptersForAuthor(
  userId: string,
  bookId: string
): Promise<ChapterRow[]> {
  const supabase = createBrowserClient();

  // Run scheduled chapters check
  await publishScheduledChapters();

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("book_id", bookId)
    .eq("user_id", userId)
    .order("chapter_number", { ascending: true });

  if (error || !data) {
    console.error("Error fetching chapters for author:", error);
    return [];
  }

  return data;
}

/**
 * Fetch a specific chapter for an author to edit.
 */
export async function getAuthorChapter(
  userId: string,
  chapterId: string
): Promise<ChapterRow | null> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("id", chapterId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    console.error("Error fetching chapter:", error);
    return null;
  }

  return data;
}

/**
 * Create a chapter with scheduling options.
 */
export async function createChapter(
  userId: string,
  bookId: string,
  input: CreateChapterInput
): Promise<ChapterRow | null> {
  const supabase = createBrowserClient();

  // 1. Determine chapter number if not provided
  let chapterNumber = input.chapter_number;
  if (!chapterNumber) {
    const { data: maxChapter } = await supabase
      .from("chapters")
      .select("chapter_number")
      .eq("book_id", bookId)
      .order("chapter_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    chapterNumber = (maxChapter?.chapter_number || 0) + 1;
  }

  // 2. Generate slug
  const baseSlug = slugify(input.title) || `chapter-${chapterNumber}`;
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  // 3. Word count & read time calculations
  const cleanContent = input.content.trim();
  const wordCount = cleanContent.split(/\s+/).filter(Boolean).length;
  const estimatedReadMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // 4. Release schedule and publish timestamp
  let publishedAt: string | null = null;
  if (input.status === "published") {
    publishedAt = new Date().toISOString();
  }

  const { data: chapter, error } = await supabase
    .from("chapters")
    .insert({
      user_id: userId,
      book_id: bookId,
      chapter_number: chapterNumber,
      title: input.title.trim(),
      slug: input.slug?.trim() || uniqueSlug,
      content: cleanContent,
      word_count: wordCount,
      estimated_read_minutes: estimatedReadMinutes,
      status: input.status,
      schedule_type: input.schedule_type || "immediate",
      scheduled_for: input.status === "scheduled" ? input.scheduled_for : null,
      published_at: publishedAt,
    })
    .select()
    .single();

  if (error || !chapter) {
    console.error("Error creating chapter:", error);
    return null;
  }

  // Refresh book chapter totals
  await refreshBookTotals(bookId);

  return chapter;
}

/**
 * Update a chapter and its release schedule.
 */
export async function updateChapter(
  userId: string,
  chapterId: string,
  input: UpdateChapterInput
): Promise<ChapterRow | null> {
  const supabase = createBrowserClient();

  const updateData: {
    title?: string;
    slug?: string;
    content?: string;
    chapter_number?: number;
    word_count?: number;
    estimated_read_minutes?: number;
    status?: "draft" | "published" | "scheduled" | "archived";
    schedule_type?: "immediate" | "specific_date" | "weekly" | "biweekly" | "monthly" | "custom";
    scheduled_for?: string | null;
    published_at?: string | null;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.slug !== undefined) updateData.slug = input.slug.trim();
  if (input.chapter_number !== undefined) updateData.chapter_number = input.chapter_number;

  if (input.content !== undefined) {
    const cleanContent = input.content.trim();
    const wordCount = cleanContent.split(/\s+/).filter(Boolean).length;
    updateData.content = cleanContent;
    updateData.word_count = wordCount;
    updateData.estimated_read_minutes = Math.max(1, Math.ceil(wordCount / 200));
  }

  if (input.status !== undefined) {
    updateData.status = input.status;
    if (input.status === "published") {
      updateData.published_at = new Date().toISOString();
      updateData.scheduled_for = null;
    } else if (input.status === "scheduled") {
      updateData.scheduled_for = input.scheduled_for || null;
      updateData.published_at = null;
    } else {
      updateData.scheduled_for = null;
      updateData.published_at = null;
    }
  }

  if (input.schedule_type !== undefined) {
    updateData.schedule_type = input.schedule_type;
  }
  if (input.scheduled_for !== undefined && input.status === "scheduled") {
    updateData.scheduled_for = input.scheduled_for;
  }

  const { data: updated, error } = await supabase
    .from("chapters")
    .update(updateData)
    .eq("id", chapterId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !updated) {
    console.error("Error updating chapter:", error);
    return null;
  }

  await refreshBookTotals(updated.book_id);

  return updated;
}

/**
 * Delete a chapter and re-sync book metrics.
 */
export async function deleteChapter(
  userId: string,
  chapterId: string
): Promise<boolean> {
  const supabase = createBrowserClient();

  // Get book_id first
  const { data: existing } = await supabase
    .from("chapters")
    .select("book_id")
    .eq("id", chapterId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) return false;

  const { error } = await supabase
    .from("chapters")
    .delete()
    .eq("id", chapterId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting chapter:", error);
    return false;
  }

  await refreshBookTotals(existing.book_id);
  return true;
}

/**
 * Reorder chapters atomically using stored procedure.
 */
export async function reorderChapters(
  bookId: string,
  chapterIds: string[]
): Promise<boolean> {
  const supabase = createBrowserClient();

  const { error } = await supabase.rpc("reorder_chapters", {
    p_book_id: bookId,
    p_chapter_ids: chapterIds,
  });

  if (error) {
    console.error("Error reordering chapters:", error);
    return false;
  }

  return true;
}

import { validateImageUpload } from "@/lib/security/validation";

/**
 * Upload a story cover image to the Supabase storage bucket 'book-covers'.
 * Strictly validates image size, MIME type, extension, and user folder ownership.
 */
export async function uploadCoverImage(
  userId: string,
  file: File
): Promise<string | null> {
  const supabase = createBrowserClient();

  // 1. Strict image format and size validation
  const { safeExtension, mimeType } = validateImageUpload(file);

  // 2. Randomized collision-resistant path under user ID folder
  const randomSuffix = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).substring(2, 10);

  const filePath = `${userId}/${Date.now()}-${randomSuffix}.${safeExtension}`;

  const { error: uploadError } = await supabase.storage
    .from("book-covers")
    .upload(filePath, file, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Error uploading cover image:", uploadError);
    return null;
  }

  const { data } = supabase.storage
    .from("book-covers")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Helper to update book's total_chapters and read time based on published chapters.
 */
async function refreshBookTotals(bookId: string): Promise<void> {
  const supabase = createBrowserClient();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("estimated_read_minutes, status")
    .eq("book_id", bookId);

  const total = chapters?.length || 0;
  const publishedChapters = chapters?.filter((c) => c.status === "published") || [];
  const readTime = publishedChapters.reduce(
    (sum, c) => sum + (c.estimated_read_minutes || 0),
    0
  );

  await supabase
    .from("books")
    .update({
      total_chapters: total,
      estimated_read_time_minutes: readTime,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookId);
}

