"use client";

import * as React from "react";
import Link from "next/link";
import {
  Library,
  BookMarked,
  BookOpen,
  Trash2,
  Sparkles,
  Layers,
  Star,
  CheckCircle2,
  Compass,
  HardDrive,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import { getUserLibrary, removeFromLibrary } from "@/lib/books/queries";
import { LibraryItem } from "@/types/books";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { OfflineDownloadButton } from "@/components/offline/OfflineDownloadButton";
import { OfflineStorageManager } from "@/components/offline/OfflineStorageManager";
import { getAllOfflineBooks } from "@/lib/offline/db";
import { OfflineBook } from "@/types/offline";

export default function LibraryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [libraryItems, setLibraryItems] = React.useState<LibraryItem[]>([]);
  const [offlineBooks, setOfflineBooks] = React.useState<OfflineBook[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<
    "all" | "reading" | "saved" | "completed" | "downloaded"
  >("all");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [storageManagerOpen, setStorageManagerOpen] = React.useState(false);

  const loadOffline = React.useCallback(async () => {
    try {
      const b = await getAllOfflineBooks();
      setOfflineBooks(b);
    } catch (err) {
      console.warn("Could not load offline books in library:", err);
    }
  }, []);

  React.useEffect(() => {
    loadOffline();
    const handleStorageChange = () => loadOffline();
    window.addEventListener("taleora-offline-storage-change", handleStorageChange);
    return () => window.removeEventListener("taleora-offline-storage-change", handleStorageChange);
  }, [loadOffline]);

  React.useEffect(() => {
    if (!user) return;

    let isMounted = true;
    getUserLibrary(user.id)
      .then((items) => {
        if (isMounted) {
          setLibraryItems(items);
          setIsLoaded(true);
        }
      })
      .catch((err) => {
        console.error("Error fetching library:", err);
        if (isMounted) setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleRemove = async (bookId: string) => {
    if (!user) return;
    setDeletingId(bookId);
    try {
      const success = await removeFromLibrary(user.id, bookId);
      if (success) {
        setLibraryItems((prev) => prev.filter((item) => item.book_id !== bookId));
      }
    } catch (err) {
      console.error("Failed to remove book:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const loading = authLoading || (!!user && !isLoaded);

  const readingItems = libraryItems.filter(
    (item) => item.progress_percentage > 0 && !item.is_completed
  );
  const savedItems = libraryItems.filter(
    (item) => item.progress_percentage === 0 && !item.is_completed
  );
  const completedItems = libraryItems.filter(
    (item) => item.is_completed || item.progress_percentage >= 100
  );

  const displayedItems =
    activeTab === "reading"
      ? readingItems
      : activeTab === "saved"
      ? savedItems
      : activeTab === "completed"
      ? completedItems
      : libraryItems;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b border-border/70 pb-5">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <Library className="w-4 h-4" />
          <span>Personal Shelf</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              My Literary Library
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your personalized collection of stories, bookmarks, and offline reading storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStorageManagerOpen(true)}
              className="gap-2 cursor-pointer text-xs border-primary/30 text-foreground hover:bg-secondary"
            >
              <HardDrive className="w-4 h-4 text-primary" />
              <span>Storage Manager ({offlineBooks.length})</span>
            </Button>

            <Link href="/explore">
              <Button variant="outline" size="sm" className="gap-2 cursor-pointer text-xs">
                <Compass className="w-4 h-4 text-primary" />
                <span>Explore More Books</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0",
            activeTab === "all"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
        >
          All Stories ({libraryItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reading")}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0",
            activeTab === "reading"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
        >
          Currently Reading ({readingItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0",
            activeTab === "saved"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
        >
          Saved / Unread ({savedItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0",
            activeTab === "completed"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
        >
          Completed ({completedItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("downloaded")}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0",
            activeTab === "downloaded"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Downloaded ({offlineBooks.length})</span>
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading && activeTab !== "downloaded" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl border border-border/60 bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Downloaded Tab Offline View */}
      {activeTab === "downloaded" && (
        <>
          {offlineBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offlineBooks.map((book) => {
                const primaryGenre = book.genres?.[0]?.name || "Story";
                const coverGradient = book.cover_gradient || "from-stone-800 via-zinc-900 to-black";
                const sizeKb = (book.size_bytes / 1024).toFixed(0);

                return (
                  <div
                    key={book.id}
                    className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-xs hover:border-primary/40 transition-all duration-300"
                  >
                    {/* Book Mini Banner */}
                    <div
                      className={`h-36 w-full bg-gradient-to-br ${coverGradient} p-4 flex flex-col justify-between text-white relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-black/25" />
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/20 z-10" />

                      <div className="relative z-10 flex items-start justify-between">
                        <Badge
                          variant="warm"
                          className="bg-black/50 text-white border-white/20 text-[10px]"
                        >
                          {primaryGenre}
                        </Badge>

                        <span className="text-[10px] font-mono text-white/90 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                          {book.total_chapters} chapters
                        </span>
                      </div>

                      <div className="relative z-10">
                        <Link href={`/read/${book.slug}`}>
                          <h3 className="font-serif text-base font-bold leading-tight line-clamp-2 text-white drop-shadow-xs hover:text-amber-200 transition-colors">
                            {book.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-white/80 line-clamp-1 mt-0.5">
                          by {book.author?.name}
                        </p>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Saved on Device ({sizeKb} KB)</span>
                        </span>
                        <span className="text-[11px] font-mono">
                          Offline Ready
                        </span>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                        <OfflineDownloadButton
                          bookId={book.id}
                          bookTitle={book.title}
                          size="sm"
                          variant="ghost"
                        />

                        <Link href={`/read/${book.slug}`}>
                          <Button
                            variant="default"
                            size="sm"
                            className="text-xs gap-1 cursor-pointer bg-primary text-primary-foreground"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Read Offline</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-border bg-card/40 flex flex-col items-center gap-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <HardDrive className="w-8 h-8" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-serif text-xl font-bold text-foreground">
                  No Offline Stories Saved
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  You haven&apos;t downloaded any stories for offline reading yet. Click &quot;Save Offline&quot; on any book to enjoy reading without an internet connection.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("all")}
                className="gap-2 cursor-pointer mt-2"
              >
                <span>Browse Your Saved Stories</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty State: Unauthenticated or Zero Library Items */}
      {!loading && activeTab !== "downloaded" && libraryItems.length === 0 && (
        <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-border bg-card/40 flex flex-col items-center gap-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center text-primary shadow-xs">
            <BookMarked className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-serif text-xl font-bold text-foreground">
              Your Literary Shelf is Waiting
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              You haven&apos;t added any stories to your library yet. Explore our curated collections and save tales that inspire you.
            </p>
          </div>
          <Link href="/explore">
            <Button size="md" className="gap-2 mt-2">
              <Sparkles className="w-4 h-4" />
              <span>Browse Curated Catalog</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Empty State: Tab empty */}
      {!loading && activeTab !== "downloaded" && libraryItems.length > 0 && displayedItems.length === 0 && (
        <div className="text-center py-16 px-4 rounded-xl border border-dashed border-border bg-card/30 flex flex-col items-center gap-3">
          <BookOpen className="w-8 h-8 text-muted-foreground/60" />
          <h4 className="font-serif text-base font-semibold text-foreground">
            No Stories in &ldquo;{activeTab}&rdquo;
          </h4>
          <p className="text-xs text-muted-foreground">
            Check your &ldquo;All Stories&rdquo; tab or explore new titles.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("all")}
            className="mt-1"
          >
            View All Saved Stories
          </Button>
        </div>
      )}

      {/* Standard Library Grid */}
      {!loading && activeTab !== "downloaded" && displayedItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedItems.map((item) => {
            const { book } = item;
            const isDeleting = deletingId === book.id;
            const primaryGenre = book.genres?.[0]?.name || "Story";
            const coverGradient =
              book.cover_gradient || "from-stone-800 via-zinc-900 to-black";

            return (
              <div
                key={item.id}
                className={cn(
                  "group flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-xs hover:border-primary/40 transition-all duration-300",
                  isDeleting && "opacity-50 pointer-events-none"
                )}
              >
                {/* Book Mini Banner */}
                <div
                  className={`h-36 w-full bg-gradient-to-br ${coverGradient} p-4 flex flex-col justify-between text-white relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/25" />
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/20 z-10" />

                  <div className="relative z-10 flex items-start justify-between">
                    <Badge
                      variant="warm"
                      className="bg-black/50 text-white border-white/20 text-[10px]"
                    >
                      {primaryGenre}
                    </Badge>

                    <button
                      type="button"
                      onClick={() => handleRemove(book.id)}
                      title="Remove from my library"
                      className="w-8 h-8 rounded-full bg-black/40 hover:bg-destructive/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="relative z-10">
                    <Link href={`/books/${book.slug}`}>
                      <h3 className="font-serif text-base font-bold leading-tight line-clamp-2 text-white drop-shadow-xs hover:text-amber-200 transition-colors">
                        {book.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-white/80 line-clamp-1 mt-0.5">
                      by {book.author?.name}
                    </p>
                  </div>
                </div>

                {/* Card Body & Progress Indicator */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{book.average_rating ? book.average_rating.toFixed(1) : "5.0"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{book.total_chapters} ch</span>
                    </div>
                  </div>

                  {/* Reading Progress Indicator */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {item.is_completed
                          ? "Completed"
                          : item.progress_percentage > 0
                          ? "Reading Progress"
                          : "Not Started"}
                      </span>
                      <span className="font-mono text-foreground font-semibold">
                        {Math.round(item.progress_percentage)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          item.is_completed ? "bg-emerald-500" : "bg-primary"
                        )}
                        style={{ width: `${item.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-border/60 mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleRemove(book.id)}
                        className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>

                      <OfflineDownloadButton
                        bookId={book.id}
                        bookTitle={book.title}
                        size="sm"
                        variant="ghost"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link href={`/books/${book.slug}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs gap-1 hover:text-primary cursor-pointer"
                        >
                          <span>Details</span>
                        </Button>
                      </Link>

                      <Link href={`/read/${book.slug}`}>
                        <Button
                          variant="default"
                          size="sm"
                          className="text-xs gap-1 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>
                            {item.progress_percentage > 0 ? "Resume" : "Read"}
                          </span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Offline Storage Manager Modal */}
      <OfflineStorageManager
        isOpen={storageManagerOpen}
        onClose={() => setStorageManagerOpen(false)}
      />
    </div>
  );
}
