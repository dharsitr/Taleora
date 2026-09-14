// Taleora Phase 11: Offline Progress & Background Sync Engine
import { createClient } from "@/lib/supabase/client";
import {
  saveOfflineBook,
  saveOfflineProgress,
  addToSyncQueue,
  getSyncQueue,
  removeSyncQueueItem,
} from "./db";
import {
  OfflineBook,
  OfflineChapter,
  OfflineDownloadProgress,
  SyncProgressPayload,
  SyncSessionPayload,
} from "@/types/offline";
import { saveReadingProgress } from "@/lib/books/queries";
import { recordReadingSession } from "@/lib/stats/queries";

/**
 * Download a book and all published chapters for offline reading.
 */
export async function downloadBookForOffline(
  bookId: string,
  onProgress?: (p: OfflineDownloadProgress) => void
): Promise<boolean> {
  const updateProgress = (
    status: OfflineDownloadProgress["status"],
    progress: number,
    message: string,
    error?: string
  ) => {
    if (onProgress) {
      onProgress({ bookId, status, progress, message, error });
    }
  };

  try {
    updateProgress("downloading", 10, "Fetching book details...");
    let bookData: any = null;
    let chaptersData: any[] = [];

    // Attempt to fetch fully hydrated book & chapters via internal offline route
    try {
      const res = await fetch(`/api/books/${bookId}/offline`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.book && json.chapters?.length > 0) {
          bookData = json.book;
          chaptersData = json.chapters;
        }
      }
    } catch {
      // Fallback to direct client query below
    }

    if (!bookData || chaptersData.length === 0) {
      const supabase = createClient();

      // 1. Fetch Book Details with Author and Genres
      const { data: bData, error: bookErr } = await supabase
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
        .single();

      if (bookErr || !bData) {
        throw new Error(bookErr?.message || "Book metadata could not be fetched.");
      }
      bookData = bData;

      updateProgress("downloading", 35, "Fetching all published chapters...");

      // 2. Fetch all published chapters
      const { data: cData, error: chaptersErr } = await supabase
        .from("chapters")
        .select("*")
        .eq("book_id", bookId)
        .eq("status", "published")
        .order("chapter_number", { ascending: true });

      if (chaptersErr || !cData || cData.length === 0) {
        throw new Error(chaptersErr?.message || "No published chapters found for this story.");
      }
      chaptersData = cData;
    }

    updateProgress("downloading", 70, "Caching book cover and formatting data...");

    // 3. Cache Cover Image as Data URL or Blob
    let coverDataUrl: string | null = null;
    let coverSize = 0;
    if (bookData.cover_image_url) {
      try {
        const imgRes = await fetch(bookData.cover_image_url);
        if (imgRes.ok) {
          const blob = await imgRes.blob();
          coverSize = blob.size;
          // Convert to base64 Data URL for persistent offline image rendering
          coverDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(bookData.cover_image_url || "");
            reader.readAsDataURL(blob);
          });
        }
      } catch (err) {
        console.warn("Could not cache cover image blob, falling back to URL:", err);
      }
    }

    // 4. Calculate approximate size in bytes
    const chaptersText = chaptersData.map((c) => c.content || "").join("");
    const approximateBytes =
      new Blob([chaptersText]).size + coverSize + JSON.stringify(bookData).length;

    // 5. Structure Offline Book record
    const offlineBook: OfflineBook = {
      id: bookData.id,
      title: bookData.title,
      slug: bookData.slug,
      subtitle: bookData.subtitle,
      description: bookData.description,
      cover_image_url: bookData.cover_image_url,
      cover_gradient: bookData.cover_gradient,
      cover_data_url: coverDataUrl,
      author: bookData.author
        ? {
            id: bookData.author.id,
            name: bookData.author.name,
            slug: bookData.author.slug,
            avatar_url: bookData.author.avatar_url,
          }
        : null,
      genres: Array.isArray(bookData.book_genres)
        ? bookData.book_genres
            .map((bg: { genre: { id: string; name: string; slug: string } | null }) => bg.genre)
            .filter((g: { id: string; name: string; slug: string } | null): g is { id: string; name: string; slug: string } => Boolean(g))
        : [],
      total_chapters: chaptersData.length,
      downloaded_at: new Date().toISOString(),
      size_bytes: approximateBytes,
      status: "ready",
    };

    // 6. Structure Offline Chapters
    const offlineChapters: OfflineChapter[] = chaptersData.map((c) => ({
      id: c.id,
      book_id: c.book_id,
      chapter_number: c.chapter_number,
      title: c.title,
      slug: c.slug,
      content: c.content || "",
      word_count: c.word_count || 0,
      estimated_read_minutes: c.estimated_read_minutes || 5,
    }));

    updateProgress("downloading", 90, "Saving to local device storage...");

    // 7. Save to IndexedDB
    await saveOfflineBook(offlineBook, offlineChapters);

    updateProgress("completed", 100, "Book saved for offline reading!");
    return true;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to download book.";
    console.error("Error downloading offline book:", err);
    updateProgress("error", 0, "Download failed.", errorMsg);
    return false;
  }
}

/**
 * Hybrid reading progress saver:
 * If online -> pushes to Supabase and saves local IndexedDB copy.
 * If offline -> saves local IndexedDB copy and enqueues to sync_queue for cloud sync.
 */
export async function saveHybridReadingProgress(
  userId: string,
  bookId: string,
  chapterId: string,
  progressPercentage: number,
  isCompleted: boolean = false,
  currentPage: number = 1
): Promise<boolean> {
  const timestamp = new Date().toISOString();

  // 1. Always update local IndexedDB progress immediately
  try {
    await saveOfflineProgress({
      book_id: bookId,
      user_id: userId,
      current_chapter_id: chapterId,
      current_page: currentPage,
      progress_percentage: progressPercentage,
      is_completed: isCompleted,
      updated_at: timestamp,
    });
  } catch (err) {
    console.warn("Could not write offline progress to IndexedDB:", err);
  }

  // 2. If online, attempt direct Supabase sync
  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const success = await saveReadingProgress(
        userId,
        bookId,
        chapterId,
        progressPercentage,
        isCompleted
      );
      if (success) {
        return true;
      }
    } catch {
      // Network failed despite onLine flag
    }
  }

  // 3. If offline or network failed, enqueue into sync_queue
  try {
    const payload: SyncProgressPayload = {
      userId,
      bookId,
      chapterId,
      progressPercentage,
      isCompleted,
      timestamp,
    };
    await addToSyncQueue({
      type: "progress",
      user_id: userId,
      payload,
      created_at: timestamp,
      retries: 0,
    });
  } catch (err) {
    console.error("Could not enqueue progress to sync_queue:", err);
  }

  return true;
}

/**
 * Hybrid reading session recorder:
 * If online -> records to Supabase.
 * If offline -> queues to sync_queue for later playback.
 */
export async function recordHybridReadingSession(
  userId: string,
  bookId: string,
  chapterId: string | null,
  durationSeconds: number,
  pagesRead: number = 0,
  startedAt?: string,
  endedAt?: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const sessionDate = now.split("T")[0];

  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const success = await recordReadingSession({
        userId,
        bookId,
        chapterId,
        durationSeconds,
        pagesRead,
      });
      if (success) return true;
    } catch {
      // Fall through to queue
    }
  }

  // Enqueue session
  try {
    const payload: SyncSessionPayload = {
      userId,
      bookId,
      chapterId,
      durationSeconds,
      pagesRead,
      sessionDate,
      startedAt: startedAt || now,
      endedAt: endedAt || now,
    };
    await addToSyncQueue({
      type: "session",
      user_id: userId,
      payload,
      created_at: now,
      retries: 0,
    });
  } catch (err) {
    console.error("Could not enqueue session to sync_queue:", err);
  }

  return true;
}

let isSyncing = false;

/**
 * Flush and synchronize all queued offline items back to Supabase.
 * Handles timestamp conflict resolution: higher progress or newer date wins.
 */
export async function syncPendingOfflineData(): Promise<{ synced: number; failed: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  if (isSyncing) return { synced: 0, failed: 0 };
  isSyncing = true;

  let syncedCount = 0;
  let failedCount = 0;

  try {
    const queue = await getSyncQueue();
    if (queue.length === 0) {
      isSyncing = false;
      return { synced: 0, failed: 0 };
    }

    const supabase = createClient();

    for (const item of queue) {
      try {
        if (item.type === "progress") {
          const p = item.payload as SyncProgressPayload;

          // Conflict resolution: fetch remote progress
          const { data: remoteData } = await supabase
            .from("reading_progress")
            .select("progress_percentage, updated_at, last_read_at")
            .eq("user_id", p.userId)
            .eq("book_id", p.bookId)
            .maybeSingle();

          let shouldUpload = true;
          if (remoteData) {
            const remoteTime = new Date(remoteData.last_read_at || remoteData.updated_at || 0).getTime();
            const localTime = new Date(p.timestamp).getTime();

            // If remote is significantly newer AND has higher progress, preserve remote
            if (remoteTime > localTime && (remoteData.progress_percentage || 0) > p.progressPercentage) {
              shouldUpload = false;
            }
          }

          if (shouldUpload) {
            await saveReadingProgress(
              p.userId,
              p.bookId,
              p.chapterId,
              p.progressPercentage,
              p.isCompleted
            );
          }

          if (item.id) await removeSyncQueueItem(item.id);
          syncedCount++;
        } else if (item.type === "session") {
          const s = item.payload as SyncSessionPayload;

          await recordReadingSession({
            userId: s.userId,
            bookId: s.bookId,
            chapterId: s.chapterId,
            durationSeconds: s.durationSeconds,
            pagesRead: s.pagesRead,
          });

          if (item.id) await removeSyncQueueItem(item.id);
          syncedCount++;
        }
      } catch (err) {
        console.warn("[Sync] Error syncing item:", item.id, err);
        failedCount++;
      }
    }

    if (syncedCount > 0 && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("taleora-offline-sync-completed", {
          detail: { syncedCount, failedCount },
        })
      );
    }
  } catch (err) {
    console.error("Failed to run syncPendingOfflineData:", err);
  } finally {
    isSyncing = false;
  }

  return { synced: syncedCount, failed: failedCount };
}

/**
 * Initialize automatic background sync listener for 'online' window event.
 */
export function initOfflineSyncListeners(): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => {
    console.log("[Sync] Connection restored, synchronizing pending offline items...");
    syncPendingOfflineData();
  };

  window.addEventListener("online", handleOnline);

  // Also attempt sync immediately on mount if online
  if (navigator.onLine) {
    syncPendingOfflineData();
  }

  return () => {
    window.removeEventListener("online", handleOnline);
  };
}
