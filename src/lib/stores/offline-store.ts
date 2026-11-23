import { createStore } from "./create-store";

export interface StorageQuotaInfo {
  usedBytes: number;
  quotaBytes: number;
  percentUsed: number;
}

export interface BookDownloadState {
  bookId: string;
  stage: "starting" | "downloading-chapters" | "saving-storage" | "completed" | "error";
  progressPercent: number;
}

interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  storageQuota: StorageQuotaInfo;
  activeDownloads: Record<string, BookDownloadState>;

  // Actions
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setPendingSyncCount: (count: number) => void;
  setStorageQuota: (quota: StorageQuotaInfo) => void;
  setDownloadProgress: (bookId: string, progress: Partial<BookDownloadState>) => void;
  clearDownloadProgress: (bookId: string) => void;
}

export const useOfflineStore = createStore<OfflineState>((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  isSyncing: false,
  pendingSyncCount: 0,
  storageQuota: {
    usedBytes: 0,
    quotaBytes: 0,
    percentUsed: 0,
  },
  activeDownloads: {},

  setOnline: (isOnline) => set({ isOnline }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
  setStorageQuota: (storageQuota) => set({ storageQuota }),

  setDownloadProgress: (bookId, progress) =>
    set((state) => {
      const existing = state.activeDownloads[bookId] || {
        bookId,
        stage: "starting",
        progressPercent: 0,
      };
      return {
        activeDownloads: {
          ...state.activeDownloads,
          [bookId]: { ...existing, ...progress },
        },
      };
    }),

  clearDownloadProgress: (bookId) =>
    set((state) => {
      const updated = { ...state.activeDownloads };
      delete updated[bookId];
      return { activeDownloads: updated };
    }),
}));
