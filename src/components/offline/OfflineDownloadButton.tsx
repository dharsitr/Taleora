"use client";

import * as React from "react";
import { Download, Check, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { isBookOffline, deleteOfflineBook } from "@/lib/offline/db";
import { downloadBookForOffline } from "@/lib/offline/sync";
import { OfflineDownloadProgress } from "@/types/offline";
import { cn } from "@/lib/utils";

interface OfflineDownloadButtonProps {
  bookId: string;
  bookTitle?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "secondary" | "outline" | "ghost";
}

export function OfflineDownloadButton({
  bookId,
  bookTitle,
  className,
  size = "md",
  variant = "secondary",
}: OfflineDownloadButtonProps) {
  const [isSaved, setIsSaved] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [downloadProgress, setDownloadProgress] = React.useState<OfflineDownloadProgress | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  // Check if book is offline saved
  const checkStatus = React.useCallback(async () => {
    try {
      const saved = await isBookOffline(bookId);
      setIsSaved(saved);
    } catch (err) {
      console.warn("Could not check offline status:", err);
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  React.useEffect(() => {
    checkStatus();

    const handleStorageChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && (detail.bookId === bookId || detail === "all")) {
        checkStatus();
      }
    };

    window.addEventListener("taleora-offline-storage-change", handleStorageChange);
    return () => {
      window.removeEventListener("taleora-offline-storage-change", handleStorageChange);
    };
  }, [bookId, checkStatus]);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress({
      bookId,
      status: "downloading",
      progress: 0,
      message: "Starting download...",
    });

    try {
      const success = await downloadBookForOffline(bookId, (p) => {
        setDownloadProgress(p);
      });

      if (success) {
        setIsSaved(true);
        setTimeout(() => {
          setIsDownloading(false);
          setDownloadProgress(null);
        }, 1200);
      } else {
        setTimeout(() => {
          setIsDownloading(false);
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to download book:", err);
      setIsDownloading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3500);
      return;
    }

    try {
      await deleteOfflineBook(bookId);
      setIsSaved(false);
      setConfirmDelete(false);
    } catch (err) {
      console.error("Failed to remove downloaded book:", err);
    }
  };

  if (isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={cn("opacity-70 gap-2 cursor-wait", className)}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Checking...</span>
      </Button>
    );
  }

  // Currently Downloading State
  if (isDownloading) {
    const percent = downloadProgress?.progress || 0;
    const isError = downloadProgress?.status === "error";

    return (
      <Button
        variant="outline"
        size={size}
        disabled={!isError}
        onClick={isError ? handleDownload : undefined}
        className={cn(
          "gap-2 relative overflow-hidden transition-all",
          isError ? "border-destructive/60 text-destructive hover:bg-destructive/10 cursor-pointer" : "cursor-wait",
          className
        )}
      >
        {!isError && (
          <div
            className="absolute left-0 top-0 bottom-0 bg-primary/20 transition-all duration-300 pointer-events-none"
            style={{ width: `${percent}%` }}
          />
        )}
        {isError ? (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs font-semibold">Failed · Retry</span>
          </>
        ) : (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary relative z-10" />
            <span className="text-xs font-semibold relative z-10 font-mono">
              Downloading {percent}%
            </span>
          </>
        )}
      </Button>
    );
  }

  // Already Saved Offline
  if (isSaved) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <Button
          variant="outline"
          size={size}
          className={cn(
            "gap-2 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 cursor-default",
            className
          )}
        >
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold">Saved Offline</span>
        </Button>

        <Button
          variant="ghost"
          size={size === "lg" ? "md" : "sm"}
          onClick={handleDelete}
          title={confirmDelete ? "Click again to confirm removal" : "Remove from device storage"}
          className={cn(
            "cursor-pointer text-xs transition-colors",
            confirmDelete
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-xs">{confirmDelete ? "Confirm?" : ""}</span>
        </Button>
      </div>
    );
  }

  // Not Downloaded Yet
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      className={cn("gap-2 cursor-pointer group", className)}
      title={bookTitle ? `Download "${bookTitle}" for offline reading` : "Save for offline reading"}
    >
      <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-y-0.5" />
      <span className="text-xs font-semibold">Save Offline</span>
    </Button>
  );
}
