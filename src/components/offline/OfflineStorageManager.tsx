"use client";

import * as React from "react";
import Link from "next/link";
import {
  HardDrive,
  Trash2,
  BookOpen,
  RefreshCw,
  CheckCircle2,
  CloudUpload,
  X,
  Sparkles,
} from "lucide-react";
import {
  getAllOfflineBooks,
  deleteOfflineBook,
  clearAllOfflineData,
  getOfflineStorageEstimate,
  getSyncQueue,
} from "@/lib/offline/db";
import { syncPendingOfflineData } from "@/lib/offline/sync";
import { OfflineBook, OfflineStorageEstimate, OfflineSyncQueueItem } from "@/types/offline";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface OfflineStorageManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfflineStorageManager({ isOpen, onClose }: OfflineStorageManagerProps) {
  const [books, setBooks] = React.useState<OfflineBook[]>([]);
  const [estimate, setEstimate] = React.useState<OfflineStorageEstimate | null>(null);
  const [queue, setQueue] = React.useState<OfflineSyncQueueItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [confirmClearAll, setConfirmClearAll] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [allBooks, storageEst, syncItems] = await Promise.all([
        getAllOfflineBooks(),
        getOfflineStorageEstimate(),
        getSyncQueue(),
      ]);
      setBooks(allBooks);
      setEstimate(storageEst);
      setQueue(syncItems);
    } catch (err) {
      console.error("Failed to load storage manager data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  React.useEffect(() => {
    const handleStorageChange = () => {
      if (isOpen) loadData();
    };
    window.addEventListener("taleora-offline-storage-change", handleStorageChange);
    window.addEventListener("taleora-offline-sync-completed", handleStorageChange);
    return () => {
      window.removeEventListener("taleora-offline-storage-change", handleStorageChange);
      window.removeEventListener("taleora-offline-sync-completed", handleStorageChange);
    };
  }, [isOpen, loadData]);

  const handleDeleteBook = async (bookId: string) => {
    try {
      await deleteOfflineBook(bookId);
      await loadData();
    } catch (err) {
      console.error("Failed to delete book:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirmClearAll) {
      setConfirmClearAll(true);
      setTimeout(() => setConfirmClearAll(false), 4000);
      return;
    }

    try {
      await clearAllOfflineData();
      setConfirmClearAll(false);
      await loadData();
    } catch (err) {
      console.error("Failed to clear offline storage:", err);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncPendingOfflineData();
      await loadData();
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  const usedMb = estimate ? (estimate.usedBytes / (1024 * 1024)).toFixed(1) : "0.0";
  const quotaGb = estimate ? (estimate.quotaBytes / (1024 * 1024 * 1024)).toFixed(1) : "50.0";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-label="Offline Storage & Download Manager"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-border/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-foreground">
                Offline Storage & Downloads
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage downloaded stories and pending reading progress sync
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close storage modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex flex-col gap-6">
          {/* Storage Quota Usage Card */}
          <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-primary" />
                <span>Device Storage Used</span>
              </span>
              <span className="font-mono text-muted-foreground">
                {usedMb} MB / ~{quotaGb} GB available
              </span>
            </div>

            {/* Storage Bar */}
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(2, estimate?.usedPercentage || 2))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
              <span>{books.length} stories saved offline</span>
              <span>{estimate?.chapterCount || 0} total chapters stored</span>
            </div>
          </div>

          {/* Sync Queue Monitor */}
          <div className="rounded-xl border border-border/80 bg-card p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                {queue.length > 0 ? (
                  <CloudUpload className="w-4 h-4 text-amber-500 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  {queue.length > 0
                    ? `${queue.length} Pending Cloud Sync Item${queue.length > 1 ? "s" : ""}`
                    : "Cloud Sync Up-to-Date"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {queue.length > 0
                    ? "Offline reading progress and sessions will sync automatically when online"
                    : "All offline reading progress and sessions are saved to Supabase"}
                </span>
              </div>
            </div>

            {queue.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="h-8 text-xs font-semibold gap-1.5 shrink-0 cursor-pointer"
              >
                <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
                <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
              </Button>
            )}
          </div>

          {/* Downloaded Stories List */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-sm font-bold text-foreground">
                Saved Stories ({books.length})
              </h3>
              {books.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className={cn(
                    "h-7 text-xs transition-colors cursor-pointer",
                    confirmClearAll
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  )}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  <span>{confirmClearAll ? "Confirm Clear All?" : "Clear All Downloads"}</span>
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2].map((n) => (
                  <div key={n} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : books.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {books.map((b) => {
                  const sizeKb = (b.size_bytes / 1024).toFixed(0);
                  const isDeleting = deletingId === b.id;

                  return (
                    <div
                      key={b.id}
                      className="rounded-xl border border-border/80 bg-card p-3 flex items-center justify-between gap-3 hover:border-primary/30 transition-colors group"
                    >
                      {/* Left: Thumbnail & Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-14 rounded-md bg-stone-800 border border-border/50 shrink-0 relative overflow-hidden flex items-center justify-center">
                          {b.cover_data_url || b.cover_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={b.cover_data_url || b.cover_image_url || ""}
                              alt={b.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="w-4 h-4 text-white/50" />
                          )}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <h4 className="font-serif text-xs sm:text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {b.title}
                          </h4>
                          <span className="text-[11px] text-muted-foreground line-clamp-1">
                            {b.author?.name || "Taleora Author"}
                          </span>
                          <span className="text-[10px] text-muted-foreground/80 font-mono mt-0.5">
                            {b.total_chapters} chapters · {sizeKb} KB
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link href={`/read/${b.slug}`} onClick={onClose}>
                          <Button
                            size="sm"
                            className="h-8 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Read</span>
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (isDeleting) {
                              handleDeleteBook(b.id);
                            } else {
                              setDeletingId(b.id);
                              setTimeout(() => setDeletingId(null), 3000);
                            }
                          }}
                          className={cn(
                            "h-8 text-xs cursor-pointer transition-colors",
                            isDeleting
                              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          )}
                          title={isDeleting ? "Click again to confirm" : "Remove download"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-xs">{isDeleting ? "Confirm?" : ""}</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/80 p-8 text-center flex flex-col items-center gap-2">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  You haven&apos;t downloaded any stories for offline reading yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border/70 flex justify-end bg-secondary/20">
          <Button variant="secondary" size="sm" onClick={onClose} className="cursor-pointer text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
