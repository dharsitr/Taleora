// Taleora Phase 11: IndexedDB Offline Storage Manager
import {
  OfflineBook,
  OfflineChapter,
  OfflineReadingProgress,
  OfflineSyncQueueItem,
  OfflineStorageEstimate,
} from "@/types/offline";
import { ChapterReaderData, BookWithAuthorAndGenres } from "@/types/books";
import { sanitizeText } from "@/lib/security/validation";

const DB_NAME = "taleora_offline_v1";
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

/**
 * Open or initialize the IndexedDB instance for offline storage.
 */
export function openOfflineDb(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("IndexedDB is not supported in this environment."));
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error("Failed to open Taleora offline database."));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Books Store
      if (!db.objectStoreNames.contains("books")) {
        const booksStore = db.createObjectStore("books", { keyPath: "id" });
        booksStore.createIndex("by_slug", "slug", { unique: true });
      }

      // 2. Chapters Store
      if (!db.objectStoreNames.contains("chapters")) {
        const chaptersStore = db.createObjectStore("chapters", { keyPath: "id" });
        chaptersStore.createIndex("by_book", "book_id", { unique: false });
        chaptersStore.createIndex("by_book_and_number", ["book_id", "chapter_number"], { unique: true });
        chaptersStore.createIndex("by_book_and_slug", ["book_id", "slug"], { unique: true });
      }

      // 3. Offline Progress Store
      if (!db.objectStoreNames.contains("offline_progress")) {
        db.createObjectStore("offline_progress", { keyPath: "book_id" });
      }

      // 4. Sync Queue Store
      if (!db.objectStoreNames.contains("sync_queue")) {
        const syncStore = db.createObjectStore("sync_queue", {
          keyPath: "id",
          autoIncrement: true,
        });
        syncStore.createIndex("by_type", "type", { unique: false });
        syncStore.createIndex("by_created_at", "created_at", { unique: false });
      }
    };
  });
}

/**
 * Check if a book is downloaded and ready offline.
 */
export async function isBookOffline(bookId: string): Promise<boolean> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve) => {
      const tx = db.transaction("books", "readonly");
      const store = tx.objectStore("books");
      const request = store.get(bookId);
      request.onsuccess = () => {
        const book = request.result as OfflineBook | undefined;
        resolve(Boolean(book && book.status === "ready"));
      };
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Retrieve all offline downloaded books.
 */
export async function getAllOfflineBooks(): Promise<OfflineBook[]> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("books", "readonly");
      const store = tx.objectStore("books");
      const request = store.getAll();

      request.onsuccess = () => {
        const books = (request.result as OfflineBook[]) || [];
        resolve(books.sort((a, b) => new Date(b.downloaded_at).getTime() - new Date(a.downloaded_at).getTime()));
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Get offline book by UUID.
 */
export async function getOfflineBook(bookId: string): Promise<OfflineBook | null> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("books", "readonly");
      const store = tx.objectStore("books");
      const request = store.get(bookId);

      request.onsuccess = () => resolve((request.result as OfflineBook) || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Get offline book by URL slug.
 */
export async function getOfflineBookBySlug(slug: string): Promise<OfflineBook | null> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("books", "readonly");
      const store = tx.objectStore("books");
      const index = store.index("by_slug");
      const request = index.get(slug);

      request.onsuccess = () => resolve((request.result as OfflineBook) || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Get all chapters for a downloaded book, ordered by chapter number.
 */
export async function getOfflineChapters(bookId: string): Promise<OfflineChapter[]> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("chapters", "readonly");
      const store = tx.objectStore("chapters");
      const index = store.index("by_book");
      const request = index.getAll(bookId);

      request.onsuccess = () => {
        const chapters = (request.result as OfflineChapter[]) || [];
        resolve(chapters.sort((a, b) => a.chapter_number - b.chapter_number));
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Save a complete book and all its published chapters into IndexedDB.
 * Ensures all text and content are sanitized against script injections and null bytes.
 */
export async function saveOfflineBook(
  book: OfflineBook,
  chapters: OfflineChapter[]
): Promise<void> {
  const db = await openOfflineDb();

  const sanitizedBook: OfflineBook = {
    ...book,
    title: sanitizeText(book.title, 200),
    subtitle: book.subtitle ? sanitizeText(book.subtitle, 200) : null,
    description: book.description ? sanitizeText(book.description, 5000, { preserveNewlines: true }) : null,
  };

  const sanitizedChapters: OfflineChapter[] = chapters.map((ch) => ({
    ...ch,
    title: sanitizeText(ch.title, 200),
    content: sanitizeText(ch.content, 500000, { preserveNewlines: true }),
  }));

  return new Promise((resolve, reject) => {
    const tx = db.transaction(["books", "chapters"], "readwrite");

    tx.onerror = () => reject(tx.error || new Error("Failed to save book to offline storage."));
    tx.oncomplete = () => {
      window.dispatchEvent(new CustomEvent("taleora-offline-storage-change", { detail: { bookId: book.id } }));
      resolve();
    };

    const booksStore = tx.objectStore("books");
    const chaptersStore = tx.objectStore("chapters");

    // Put book record
    booksStore.put(sanitizedBook);

    // Put all chapter records
    sanitizedChapters.forEach((ch) => {
      chaptersStore.put(ch);
    });
  });
}

/**
 * Delete a downloaded book and its chapters from IndexedDB.
 */
export async function deleteOfflineBook(bookId: string): Promise<void> {
  const db = await openOfflineDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(["books", "chapters", "offline_progress"], "readwrite");

    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      window.dispatchEvent(new CustomEvent("taleora-offline-storage-change", { detail: { bookId } }));
      resolve();
    };

    // 1. Delete book record
    tx.objectStore("books").delete(bookId);

    // 2. Delete all chapters for this book
    const chaptersStore = tx.objectStore("chapters");
    const index = chaptersStore.index("by_book");
    const getKeysReq = index.getAllKeys(bookId);

    getKeysReq.onsuccess = () => {
      const keys = getKeysReq.result;
      keys.forEach((key) => {
        chaptersStore.delete(key);
      });
    };

    // 3. Delete offline progress
    tx.objectStore("offline_progress").delete(bookId);
  });
}

/**
 * Wipe all downloaded books and chapters.
 */
export async function clearAllOfflineData(): Promise<void> {
  const db = await openOfflineDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(["books", "chapters", "offline_progress"], "readwrite");

    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      window.dispatchEvent(new CustomEvent("taleora-offline-storage-change", { detail: "all" }));
      resolve();
    };

    tx.objectStore("books").clear();
    tx.objectStore("chapters").clear();
    tx.objectStore("offline_progress").clear();
  });
}

/**
 * Save reading progress locally in IndexedDB.
 */
export async function saveOfflineProgress(progress: OfflineReadingProgress): Promise<void> {
  const db = await openOfflineDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("offline_progress", "readwrite");
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    tx.objectStore("offline_progress").put(progress);
  });
}

/**
 * Get saved offline progress for a book.
 */
export async function getOfflineProgress(bookId: string): Promise<OfflineReadingProgress | null> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("offline_progress", "readonly");
      const store = tx.objectStore("offline_progress");
      const request = store.get(bookId);

      request.onsuccess = () => resolve((request.result as OfflineReadingProgress) || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Add a pending sync item to the IndexedDB sync queue.
 */
export async function addToSyncQueue(
  item: Omit<OfflineSyncQueueItem, "id">
): Promise<number> {
  const db = await openOfflineDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("sync_queue", "readwrite");
    const store = tx.objectStore("sync_queue");
    const request = store.add(item);

    request.onsuccess = () => resolve(Number(request.result));
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending sync items from the queue.
 */
export async function getSyncQueue(): Promise<OfflineSyncQueueItem[]> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("sync_queue", "readonly");
      const store = tx.objectStore("sync_queue");
      const request = store.getAll();

      request.onsuccess = () => resolve((request.result as OfflineSyncQueueItem[]) || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Remove an item from the sync queue after successful upload.
 */
export async function removeSyncQueueItem(id: number): Promise<void> {
  const db = await openOfflineDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("sync_queue", "readwrite");
    const store = tx.objectStore("sync_queue");
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Construct ChapterReaderData structure directly from offline IndexedDB stores.
 */
export async function getOfflineReaderData(
  bookSlug: string,
  chapterSlug?: string
): Promise<ChapterReaderData | null> {
  const book = await getOfflineBookBySlug(bookSlug);
  if (!book) return null;

  const chapters = await getOfflineChapters(book.id);
  if (!chapters || chapters.length === 0) return null;

  let currentIdx = 0;
  if (chapterSlug) {
    const foundIdx = chapters.findIndex((c) => c.slug === chapterSlug);
    if (foundIdx !== -1) currentIdx = foundIdx;
  }

  const currentChapter = chapters[currentIdx];
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null;

  const formatChapter = (c: OfflineChapter) => ({
    id: c.id,
    book_id: c.book_id,
    chapter_number: c.chapter_number,
    title: c.title,
    slug: c.slug,
    content: c.content,
    word_count: c.word_count,
    estimated_read_minutes: c.estimated_read_minutes,
    status: "published" as const,
    created_at: "",
    updated_at: "",
    published_at: null,
    schedule_type: "immediate" as const,
    scheduled_for: null,
    user_id: null,
    is_suspended: false,
    suspension_reason: null,
    moderated_by: null,
    moderated_at: null,
  });

  // Format book for StoryReader compatibility
  const bookWithMeta: BookWithAuthorAndGenres = {
    id: book.id,
    title: book.title,
    slug: book.slug,
    subtitle: book.subtitle,
    description: book.description,
    author_id: book.author?.id || "author-offline",
    status: "published",
    cover_image_url: book.cover_data_url || book.cover_image_url,
    cover_gradient: book.cover_gradient,
    cover_accent: null,
    total_chapters: book.total_chapters || chapters.length,
    estimated_read_time_minutes: chapters.reduce((acc, c) => acc + (c.estimated_read_minutes || 5), 0),
    ratings_count: 0,
    average_rating: 4.8,
    featured: false,
    trending: false,
    release_schedule: "immediate",
    tags: [],
    user_id: null,
    published_at: book.downloaded_at,
    created_at: book.downloaded_at,
    updated_at: book.downloaded_at,
    is_suspended: false,
    suspension_reason: null,
    moderated_by: null,
    moderated_at: null,
    author: {
      id: book.author?.id || "author-offline",
      user_id: null,
      name: book.author?.name || "Taleora Author",
      slug: book.author?.slug || "author",
      bio: null,
      avatar_url: book.author?.avatar_url || null,
      website: null,
      follower_count: 0,
      created_at: "",
      updated_at: "",
      is_suspended: false,
      is_verified: false,
      suspension_reason: null,
      moderated_by: null,
      moderated_at: null,
    },
    genres: book.genres.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: null,
      created_at: "",
      updated_at: "",
    })),
  };

  return {
    book: bookWithMeta,
    currentChapter: formatChapter(currentChapter),
    allChapters: chapters.map(formatChapter),
    prevChapter: prevChapter ? formatChapter(prevChapter) : null,
    nextChapter: nextChapter ? formatChapter(nextChapter) : null,
  };
}

/**
 * Retrieve device storage usage estimation.
 */
export async function getOfflineStorageEstimate(): Promise<OfflineStorageEstimate> {
  let usedBytes = 0;
  let quotaBytes = 50 * 1024 * 1024 * 1024; // 50GB default fallback

  if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage) usedBytes = estimate.usage;
      if (estimate.quota) quotaBytes = estimate.quota;
    } catch {
      // Ignore estimation error
    }
  }

  const books = await getAllOfflineBooks();
  const bookCount = books.length;
  const chapterCount = books.reduce((acc, b) => acc + (b.total_chapters || 0), 0);

  // If storage API gives 0 usage, approximate from book size_bytes
  if (usedBytes === 0) {
    usedBytes = books.reduce((acc, b) => acc + (b.size_bytes || 0), 0);
  }

  const usedPercentage = Math.min(100, Math.max(0.1, (usedBytes / quotaBytes) * 100));

  return {
    usedBytes,
    quotaBytes,
    usedPercentage: parseFloat(usedPercentage.toFixed(1)),
    bookCount,
    chapterCount,
  };
}
