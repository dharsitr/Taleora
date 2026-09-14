import { supabase } from "../config/supabase";
import { Bookmark, Highlight, HighlightColor } from "../types";

/**
 * Fetch all bookmarks for a user, optionally filtered by book.
 */
export async function getUserBookmarks(
  userId: string,
  bookId?: string
): Promise<Bookmark[]> {
  try {
    let query = supabase
      .from("bookmarks")
      .select(
        `
        *,
        chapter:chapters(id, chapter_number, title, slug),
        book:books(id, title, slug, cover_image_url)
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

    return data as Bookmark[];
  } catch {
    return [];
  }
}

/**
 * Create a bookmark at a specific paragraph / progress position.
 */
export async function createBookmark(
  userId: string,
  bookId: string,
  chapterId: string,
  paragraphIndex: number,
  progressPercentage: number,
  snippet?: string,
  label?: string
): Promise<Bookmark | null> {
  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        user_id: userId,
        book_id: bookId,
        chapter_id: chapterId,
        paragraph_index: paragraphIndex,
        progress_percentage: Math.min(100, Math.max(0, progressPercentage)),
        snippet: snippet?.slice(0, 250) || null,
        label: label?.trim() || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating bookmark:", error);
      return null;
    }
    return data as Bookmark;
  } catch {
    return null;
  }
}

/**
 * Delete a user's bookmark.
 */
export async function deleteBookmark(
  bookmarkId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", bookmarkId)
      .eq("user_id", userId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetch all highlights for a user, optionally filtered by book.
 */
export async function getUserHighlights(
  userId: string,
  bookId?: string
): Promise<Highlight[]> {
  try {
    let query = supabase
      .from("highlights")
      .select(
        `
        *,
        chapter:chapters(id, chapter_number, title, slug),
        book:books(id, title, slug, cover_image_url)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (bookId) {
      query = query.eq("book_id", bookId);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.error("Error fetching highlights:", error);
      return [];
    }

    return data as Highlight[];
  } catch {
    return [];
  }
}

/**
 * Create a highlight on reader text.
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
): Promise<Highlight | null> {
  try {
    const { data, error } = await supabase
      .from("highlights")
      .insert({
        user_id: userId,
        book_id: bookId,
        chapter_id: chapterId,
        paragraph_index: paragraphIndex,
        start_offset: startOffset,
        end_offset: endOffset,
        selected_text: selectedText.slice(0, 1000),
        color,
        note: note?.trim() || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating highlight:", error);
      return null;
    }
    return data as Highlight;
  } catch {
    return null;
  }
}

/**
 * Delete a user's highlight.
 */
export async function deleteHighlight(
  highlightId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("highlights")
      .delete()
      .eq("id", highlightId)
      .eq("user_id", userId);

    return !error;
  } catch {
    return false;
  }
}
