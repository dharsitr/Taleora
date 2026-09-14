"use client";

import * as React from "react";
import Link from "next/link";
import {
  WifiOff,
  BookOpen,
  RefreshCw,
  HardDrive,
  Sparkles,
  ArrowRight,
  Library,
} from "lucide-react";
import { getAllOfflineBooks } from "@/lib/offline/db";
import { OfflineBook } from "@/types/offline";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function OfflineFallbackPage() {
  const [offlineBooks, setOfflineBooks] = React.useState<OfflineBook[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const loadBooks = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const books = await getAllOfflineBooks();
      setOfflineBooks(books);
    } catch (err) {
      console.error("Failed to load offline books:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadBooks();

    const handleStorageChange = () => loadBooks();
    window.addEventListener("taleora-offline-storage-change", handleStorageChange);
    return () => window.removeEventListener("taleora-offline-storage-change", handleStorageChange);
  }, [loadBooks]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      if (typeof window !== "undefined" && navigator.onLine) {
        window.location.reload();
      }
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-16 flex flex-col gap-10">
      {/* Header Banner */}
      <div className="text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-lg shadow-amber-500/5 animate-pulse">
          <WifiOff className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <Badge variant="warm" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold text-xs">
            Offline Mode
          </Badge>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Quiet In The Library
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg leading-relaxed">
          No internet connection was detected. You can continue reading any stories previously saved to your local device.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="gap-2 cursor-pointer text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Checking Connection..." : "Check Connection"}</span>
          </Button>

          <Link href="/library">
            <Button variant="secondary" size="sm" className="gap-2 cursor-pointer text-xs">
              <Library className="w-3.5 h-3.5" />
              <span>Go to My Library</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Downloaded Offline Stories Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-xl font-bold text-foreground">
              Downloaded Stories
            </h2>
            <span className="text-xs text-muted-foreground font-mono ml-2">
              ({offlineBooks.length} available)
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-36 rounded-xl border border-border/60 bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        ) : offlineBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {offlineBooks.map((book) => {
              const coverBg = book.cover_gradient || "from-amber-800 to-zinc-950";
              const primaryGenre = book.genres?.[0]?.name || "Story";

              return (
                <div
                  key={book.id}
                  className="rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-all p-4 flex gap-4 items-center shadow-xs group relative overflow-hidden"
                >
                  {/* Book Cover Thumbnail */}
                  <div className="w-20 h-28 rounded-lg bg-black/40 border border-border/50 shrink-0 relative overflow-hidden flex flex-col justify-between p-2 shadow-md">
                    {book.cover_data_url || book.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.cover_data_url || book.cover_image_url || ""}
                        alt={book.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${coverBg}`} />
                    )}
                    <div className="absolute inset-0 bg-black/25" />
                    <span className="relative z-10 text-[9px] font-semibold text-white/90 bg-black/60 px-1.5 py-0.5 rounded-sm self-start">
                      {primaryGenre}
                    </span>
                    <span className="relative z-10 text-[9px] font-mono text-white/80 line-clamp-1">
                      {book.total_chapters} ch
                    </span>
                  </div>

                  {/* Metadata & Read Action */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-28 py-0.5">
                    <div>
                      <h3 className="font-serif text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {book.author?.name || "Taleora Author"}
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 mt-1 font-mono">
                        {(book.size_bytes / 1024).toFixed(0)} KB · Offline Ready
                      </p>
                    </div>

                    <Link href={`/read/${book.slug}`}>
                      <Button
                        size="sm"
                        className="h-8 text-xs font-semibold gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:opacity-95"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Read Offline</span>
                        <ArrowRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 p-8 sm:p-12 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-foreground">
              No Offline Books Found
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              When you have an active internet connection, you can click &quot;Save for Offline&quot; on any story to read it anywhere without internet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
