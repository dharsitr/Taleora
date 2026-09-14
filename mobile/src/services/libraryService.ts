import { supabase } from "../config/supabase";
import { Book, ReadingProgress } from "../types";

export interface UserLibraryData {
  currentlyReading: ReadingProgress[];
  completed: ReadingProgress[];
  all: ReadingProgress[];
}

/**
 * Fetch all library items and reading progress for an authenticated user
 */
export async function getUserLibrary(userId: string): Promise<UserLibraryData> {
  try {
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
      .order("updated_at", { ascending: false });

    if (error || !data) {
      console.error("Error fetching user library:", error);
      return { currentlyReading: [], completed: [], all: [] };
    }

    const items: ReadingProgress[] = data
      .filter((item: any) => item.book && item.book.status === "published")
      .map((item: any) => {
        const genres = (item.book.book_genres || [])
          .map((bg: any) => bg.genre)
          .filter(Boolean);

        const transformedBook: Book = {
          ...item.book,
          author: item.book.author || {
            id: item.book.author_id,
            display_name: "Unknown Author",
          },
          genres,
        };

        return {
          id: item.id,
          user_id: item.user_id,
          book_id: item.book_id,
          current_chapter_id: item.current_chapter_id,
          progress_percentage: Number(item.progress_percentage) || 0,
          is_completed: Boolean(item.is_completed),
          updated_at: item.updated_at,
          book: transformedBook,
          current_chapter: item.current_chapter,
        };
      });

    const currentlyReading = items.filter(
      (item) => !item.is_completed && item.progress_percentage < 100
    );

    const completed = items.filter(
      (item) => item.is_completed || item.progress_percentage >= 100
    );

    return {
      currentlyReading,
      completed,
      all: items,
    };
  } catch (err) {
    console.error("Failed to load user library:", err);
    return { currentlyReading: [], completed: [], all: [] };
  }
}
