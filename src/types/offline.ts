// Taleora Phase 11: Offline Storage & Sync Types

export interface OfflineBook {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
  cover_gradient: string | null;
  cover_blob?: Blob | null;
  cover_data_url?: string | null;
  author: {
    id: string;
    name: string;
    slug: string;
    avatar_url: string | null;
  } | null;
  genres: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  total_chapters: number;
  downloaded_at: string;
  size_bytes: number;
  status: "ready" | "downloading" | "error";
}

export interface OfflineChapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  slug: string;
  content: string;
  word_count: number;
  estimated_read_minutes: number;
}

export interface OfflineReadingProgress {
  book_id: string;
  user_id: string;
  current_chapter_id: string;
  current_page: number;
  progress_percentage: number;
  is_completed: boolean;
  updated_at: string;
}

export type SyncQueueItemType = "progress" | "session";

export interface SyncProgressPayload {
  userId: string;
  bookId: string;
  chapterId: string;
  progressPercentage: number;
  isCompleted: boolean;
  timestamp: string;
}

export interface SyncSessionPayload {
  userId: string;
  bookId: string;
  chapterId: string | null;
  durationSeconds: number;
  pagesRead: number;
  sessionDate: string;
  startedAt: string;
  endedAt: string;
}

export interface OfflineSyncQueueItem {
  id?: number;
  type: SyncQueueItemType;
  user_id: string;
  payload: SyncProgressPayload | SyncSessionPayload;
  created_at: string;
  retries: number;
}

export interface OfflineDownloadProgress {
  bookId: string;
  status: "idle" | "downloading" | "completed" | "error";
  progress: number; // 0 to 100
  message: string;
  error?: string;
}

export interface OfflineStorageEstimate {
  usedBytes: number;
  quotaBytes: number;
  usedPercentage: number;
  bookCount: number;
  chapterCount: number;
}
