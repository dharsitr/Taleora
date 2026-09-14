import { supabase } from "../config/supabase";
import { Chapter, ChapterReaderData } from "../types";
import { getBookDetails } from "./bookService";

/**
 * Fetch chapter reader data: current chapter, adjacent chapters, all published chapters, and book metadata.
 * Ensures drafts and scheduled chapters are never served to readers before publication.
 */
export async function getChapterReaderData(
  bookSlug: string,
  chapterSlug?: string
): Promise<ChapterReaderData | null> {
  try {
    const bookDetail = await getBookDetails(bookSlug);
    if (!bookDetail || !bookDetail.chapters || bookDetail.chapters.length === 0) {
      return null;
    }

    const allChapters = bookDetail.chapters;
    let currentIdx = -1;

    if (chapterSlug) {
      currentIdx = allChapters.findIndex((ch) => ch.slug === chapterSlug);
      if (currentIdx === -1) {
        // Fallback to chapter by ID if slug did not match
        currentIdx = allChapters.findIndex((ch) => ch.id === chapterSlug);
      }
    }

    if (currentIdx === -1) {
      currentIdx = 0; // Default to first chapter
    }

    const currentChapter = allChapters[currentIdx];
    const prevChapter = currentIdx > 0 ? allChapters[currentIdx - 1] : null;
    const nextChapter =
      currentIdx < allChapters.length - 1 ? allChapters[currentIdx + 1] : null;

    return {
      book: bookDetail,
      currentChapter,
      allChapters,
      prevChapter,
      nextChapter,
    };
  } catch (err) {
    console.error("Error loading chapter reader data:", err);
    return null;
  }
}

/**
 * Synchronize user reading progress to Supabase under RLS.
 */
export async function syncReadingProgress(
  userId: string,
  bookId: string,
  chapterId: string,
  progressPercentage: number,
  isCompleted: boolean = false
): Promise<boolean> {
  try {
    const roundedProgress = Math.min(
      100,
      Math.max(0, parseFloat(progressPercentage.toFixed(2)))
    );

    const { error } = await supabase.from("reading_progress").upsert(
      {
        user_id: userId,
        book_id: bookId,
        current_chapter_id: chapterId,
        progress_percentage: roundedProgress,
        is_completed: isCompleted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,book_id" }
    );

    if (error) {
      console.error("Error syncing reading progress:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to sync reading progress:", err);
    return false;
  }
}

/**
 * Log reading session to maintain streaks and stats.
 */
export async function logReadingSession(
  userId: string,
  bookId: string,
  chapterId: string | null,
  durationSeconds: number,
  pagesRead: number = 1
): Promise<boolean> {
  if (durationSeconds < 10) return false; // Ignore trivial accidental taps

  try {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();
    const startedAt = new Date(Date.now() - durationSeconds * 1000).toISOString();

    const { error } = await supabase.from("reading_sessions").insert({
      user_id: userId,
      book_id: bookId,
      chapter_id: chapterId,
      session_date: today,
      duration_seconds: durationSeconds,
      pages_read: pagesRead,
      started_at: startedAt,
      ended_at: now,
    });

    if (error) {
      console.error("Error logging reading session:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to log reading session:", err);
    return false;
  }
}

/**
 * Fetch reading progress for a specific book.
 */
export async function getBookReadingProgress(
  userId: string,
  bookId: string
): Promise<{ current_chapter_id: string | null; progress_percentage: number; is_completed: boolean } | null> {
  try {
    const { data, error } = await supabase
      .from("reading_progress")
      .select("current_chapter_id, progress_percentage, is_completed")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}
