"use client";

import * as React from "react";
import Link from "next/link";
import { ChapterReaderData } from "@/types/books";
import { getOfflineReaderData } from "@/lib/offline/db";
import { getChapterReaderData } from "@/lib/books/queries";
import { StoryReader } from "./StoryReader";
import { Button } from "@/components/ui/Button";
import { WifiOff, ArrowLeft, HardDrive, RefreshCw, BookOpen, AlertCircle } from "lucide-react";

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
  const [isLoading, setIsLoading] = React.useState(!initialData);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isDeviceOffline, setIsDeviceOffline] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const deviceIsOffline = typeof navigator !== "undefined" && !navigator.onLine;
    setIsDeviceOffline(deviceIsOffline);

    // 1. If device is online, try fetching online data first
    if (!deviceIsOffline) {
      try {
        const onlineData = await getChapterReaderData(bookSlug, chapterSlug);
        if (onlineData) {
          setReaderData(onlineData);
          setIsOfflineMode(false);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Online story fetch failed, trying offline fallback:", err);
      }
    }

    // 2. Fallback to offline IndexedDB
    try {
      const offlineData = await getOfflineReaderData(bookSlug, chapterSlug);
      if (offlineData) {
        setReaderData(offlineData);
        setIsOfflineMode(true);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Offline IndexedDB fetch failed:", err);
    }

    // 3. Neither online nor offline could load the story
    setIsLoading(false);
    if (deviceIsOffline) {
      setLoadError("offline_not_saved");
    } else {
      setLoadError("story_not_found");
    }
  }, [bookSlug, chapterSlug]);

  React.useEffect(() => {
    if (initialData) {
      setReaderData(initialData);
      setIsOfflineMode(typeof navigator !== "undefined" && !navigator.onLine);
      setIsLoading(false);
      return;
    }

    loadData();
  }, [initialData, loadData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 animate-pulse">
          <BookOpen className="w-6 h-6 animate-pulse" />
        </div>
        <p className="font-serif text-base text-muted-foreground animate-pulse">
          Opening story in reader...
        </p>
      </div>
    );
  }

  // Error screen if not loaded
  if (loadError || !readerData) {
    const isTrulyOffline = isDeviceOffline || loadError === "offline_not_saved";

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
        <div className="max-w-md flex flex-col items-center gap-4 p-8 rounded-2xl border border-border bg-card shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            {isTrulyOffline ? <WifiOff className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
          </div>

          <h2 className="font-serif text-2xl font-bold text-foreground">
            {isTrulyOffline ? "Story Not Saved Offline" : "Story Not Available"}
          </h2>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {isTrulyOffline
              ? "You appear to be offline, and this story has not been downloaded to your device storage yet. When you have an internet connection, you can save stories for offline reading."
              : "We could not load this story from the cloud. Please check that your connection is active, or try reloading."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData()}
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
