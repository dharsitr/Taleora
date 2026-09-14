"use client";

import * as React from "react";
import Link from "next/link";
import { ChapterReaderData } from "@/types/books";
import { getOfflineReaderData } from "@/lib/offline/db";
import { StoryReader } from "./StoryReader";
import { Button } from "@/components/ui/Button";
import { WifiOff, ArrowLeft, HardDrive, RefreshCw } from "lucide-react";

interface ReaderClientContainerProps {
  bookSlug: string;
  chapterSlug?: string;
  initialData: ChapterReaderData | null;
}

export function ReaderClientContainer({
  bookSlug,
  chapterSlug,
  initialData,
}: ReaderClientContainerProps) {
  const [readerData, setReaderData] = React.useState<ChapterReaderData | null>(initialData);
  const [isOfflineMode, setIsOfflineMode] = React.useState(false);
  const [isLoadingOffline, setIsLoadingOffline] = React.useState(!initialData);
  const [offlineNotFound, setOfflineNotFound] = React.useState(false);

  // If no initial SSR data, or if online data failed, query IndexedDB
  React.useEffect(() => {
    if (initialData) {
      setReaderData(initialData);
      setIsOfflineMode(typeof navigator !== "undefined" && !navigator.onLine);
      setIsLoadingOffline(false);
      return;
    }

    let isMounted = true;
    setIsLoadingOffline(true);

    getOfflineReaderData(bookSlug, chapterSlug)
      .then((offlineData) => {
        if (!isMounted) return;
        if (offlineData) {
          setReaderData(offlineData);
          setIsOfflineMode(true);
          setOfflineNotFound(false);
        } else {
          setOfflineNotFound(true);
        }
      })
      .catch((err) => {
        console.error("Error loading offline reader data:", err);
        if (isMounted) setOfflineNotFound(true);
      })
      .finally(() => {
        if (isMounted) setIsLoadingOffline(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookSlug, chapterSlug, initialData]);

  // Loading state for offline retrieval
  if (isLoadingOffline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 animate-pulse">
          <HardDrive className="w-6 h-6 animate-spin" />
        </div>
        <p className="font-serif text-base text-muted-foreground animate-pulse">
          Retrieving offline book from storage...
        </p>
      </div>
    );
  }

  // Not found in offline database and no network available
  if (offlineNotFound || !readerData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
        <div className="max-w-md flex flex-col items-center gap-4 p-8 rounded-2xl border border-border bg-card shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <WifiOff className="w-7 h-7" />
          </div>

          <h2 className="font-serif text-2xl font-bold text-foreground">
            Story Not Saved Offline
          </h2>

          <p className="text-xs text-muted-foreground leading-relaxed">
            You appear to be offline, and this story has not been downloaded to your device storage yet. When you have an internet connection, you can save stories for offline reading.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="gap-2 text-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </Button>

            <Link href="/offline">
              <Button size="sm" className="gap-2 text-xs cursor-pointer bg-primary text-primary-foreground">
                <HardDrive className="w-3.5 h-3.5" />
                <span>View Downloaded Stories</span>
              </Button>
            </Link>

            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-xs cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <StoryReader data={readerData} isOfflineInitial={isOfflineMode} />;
}
