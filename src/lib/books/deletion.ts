/**
 * Secure Deletion Service for Taleora.
 * Handles server-side authorization, storage file cleanup, cascade deletion,
 * orphaned reference pruning, and cache invalidation.
 */

import { createClient } from "@/lib/supabase/server";
import { storyCache } from "@/lib/network/cache";

export interface DeletionResult {
  success: boolean;
  error?: string;
  code?: number;
  message?: string;
}

/**
 * Extract storage object path from a Supabase public storage URL.
 * e.g., https://.../storage/v1/object/public/book-covers/userId/filename.jpg -> userId/filename.jpg
 */
export function extractStoragePath(url: string | null | undefined, bucketName: string): string | null {
  if (!url || typeof url !== "string") return null;
  const marker = `/${bucketName}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = url.slice(idx + marker.length).split("?")[0];
  return decodeURIComponent(path);
}

/**
 * Permanently delete an author's book, cascading to:
 * - All chapters
 * - Book genres
 * - Bookmarks, highlights, notes
 * - Reading progress & reading sessions
 * - Book reviews, review likes, comments
 * - Storage files (cover image in book-covers, JSON file in book-chapters)
 * - In-memory and conditional caches
 */
export async function deleteBookSecurely(
  userId: string,
  bookIdOrSlug: string
): Promise<DeletionResult> {
  const supabase = await createClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    bookIdOrSlug.trim()
  );

  // 1. Fetch book record and verify existence
  const query = supabase
    .from("books")
    .select("id, user_id, slug, title, cover_image_url")
    .eq(isUuid ? "id" : "slug", bookIdOrSlug.trim());

  const { data: book, error: fetchErr } = await query.maybeSingle();

  if (fetchErr || !book) {
    return {
      success: false,
      error: "Story not found.",
      code: 404,
    };
  }

  // 2. Strict Server-Side Authorization Check
  // Check if caller is book owner or an administrator
  let isAuthorized = book.user_id === userId;

  if (!isAuthorized) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.role === "admin") {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return {
      success: false,
      error: "Forbidden: You do not have permission to delete this story.",
      code: 403,
    };
  }

  // 3. Storage File Cleanup (Cover Image)
  if (book.cover_image_url) {
    const coverPath = extractStoragePath(book.cover_image_url, "book-covers");
    if (coverPath) {
      try {
        await supabase.storage.from("book-covers").remove([coverPath]);
      } catch (storageErr) {
        console.warn(`[Delete] Failed to delete cover image ${coverPath}:`, storageErr);
      }
    }
  }

  // 4. Storage File Cleanup (Chapters Bucket)
  try {
    await supabase.storage.from("book-chapters").remove([`${book.slug}.json`]);
  } catch (storageErr) {
    console.warn(`[Delete] Failed to delete chapter storage file ${book.slug}.json:`, storageErr);
  }

  // 5. Delete Book from Database (Foreign key constraints cascade to chapters,
  // bookmarks, highlights, progress, reviews, and comments)
  const { error: deleteErr } = await supabase
    .from("books")
    .delete()
    .eq("id", book.id);

  if (deleteErr) {
    console.error("[Delete] Database error deleting story:", deleteErr);
    return {
      success: false,
      error: "Failed to delete story from database.",
      code: 500,
    };
  }

  // 6. Cache Invalidation
  storyCache.invalidate(`story:detail:${book.slug}`);
  storyCache.invalidate(`story:detail:${book.id}`);
  storyCache.invalidate(`chapter:reader:${book.slug}`);
  storyCache.flush();

  return {
    success: true,
    message: `Story "${book.title}" and all associated chapters, covers, and reader data were permanently deleted.`,
    code: 200,
  };
}

/**
 * Permanently delete a chapter and recalculate parent story metrics:
 * - Removes chapter record from database
 * - Cascades chapter bookmarks and highlights
 * - Sets current_chapter_id in reading_progress to null
 * - Re-computes parent book total_chapters and estimated reading time
 * - Invalidates reader cache
 */
export async function deleteChapterSecurely(
  userId: string,
  bookIdOrSlug: string,
  chapterIdOrSlug: string
): Promise<DeletionResult> {
  const supabase = await createClient();

  const isBookUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    bookIdOrSlug.trim()
  );
  const isChapterUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    chapterIdOrSlug.trim()
  );

  // 1. Fetch parent book
  const { data: book, error: bookErr } = await supabase
    .from("books")
    .select("id, user_id, slug, total_chapters")
    .eq(isBookUuid ? "id" : "slug", bookIdOrSlug.trim())
    .maybeSingle();

  if (bookErr || !book) {
    return {
      success: false,
      error: "Parent story not found.",
      code: 404,
    };
  }

  // 2. Fetch chapter
  let chapterQuery = supabase
    .from("chapters")
    .select("id, book_id, user_id, title, chapter_number")
    .eq("book_id", book.id);

  if (isChapterUuid) {
    chapterQuery = chapterQuery.eq("id", chapterIdOrSlug.trim());
  } else {
    chapterQuery = chapterQuery.eq("slug", chapterIdOrSlug.trim());
  }

  const { data: chapter, error: chErr } = await chapterQuery.maybeSingle();

  if (chErr || !chapter) {
    return {
      success: false,
      error: "Chapter not found.",
      code: 404,
    };
  }

  // 3. Strict Server-Side Authorization Check
  let isAuthorized = book.user_id === userId || chapter.user_id === userId;

  if (!isAuthorized) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.role === "admin") {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return {
      success: false,
      error: "Forbidden: You do not have permission to delete this chapter.",
      code: 403,
    };
  }

  // 4. Delete Chapter from Database
  const { error: deleteErr } = await supabase
    .from("chapters")
    .delete()
    .eq("id", chapter.id);

  if (deleteErr) {
    console.error("[Delete] Error deleting chapter:", deleteErr);
    return {
      success: false,
      error: "Failed to delete chapter from database.",
      code: 500,
    };
  }

  // 5. Re-calculate Book Metrics (Total Chapters & Estimated Read Time)
  const { data: remainingChapters } = await supabase
    .from("chapters")
    .select("word_count, chapter_number")
    .eq("book_id", book.id)
    .order("chapter_number", { ascending: true });

  const count = remainingChapters?.length || 0;
  const totalWords = (remainingChapters || []).reduce(
    (acc, c) => acc + (c.word_count || 0),
    0
  );
  const estimatedReadMinutes = Math.max(0, Math.round(totalWords / 200));

  await supabase
    .from("books")
    .update({
      total_chapters: count,
      estimated_read_time_minutes: estimatedReadMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", book.id);

  // 6. Cache Invalidation
  storyCache.invalidate(`story:detail:${book.slug}`);
  storyCache.invalidate(`story:detail:${book.id}`);
  storyCache.invalidate(`chapter:reader:${book.slug}`);
  storyCache.flush();

  return {
    success: true,
    message: `Chapter "${chapter.title}" deleted successfully.`,
    code: 200,
  };
}
