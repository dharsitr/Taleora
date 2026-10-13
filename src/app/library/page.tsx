"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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
  Flame,
  Clock,
  Play,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import { getUserLibrary, removeFromLibrary } from "@/lib/books/queries";
import { getUserLibraryCache } from "@/lib/books/cache";
import { LibraryItem } from "@/types/books";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { OfflineDownloadButton } from "@/components/offline/OfflineDownloadButton";
import { OfflineStorageManager } from "@/components/offline/OfflineStorageManager";
import { getAllOfflineBooks } from "@/lib/offline/db";
import { OfflineBook } from "@/types/offline";
import { useDailyReadingProgress } from "@/lib/stats/use-daily-reading-progress";

export default function LibraryPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const cachedInitial = user ? getUserLibraryCache(user.id) : null;
  const [libraryItems, setLibraryItems] = React.useState<LibraryItem[]>(cachedInitial || []);
  const [offlineBooks, setOfflineBooks] = React.useState<OfflineBook[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(Boolean(cachedInitial));
  const [activeTab, setActiveTab] = React.useState<
    "all" | "reading" | "saved" | "completed" | "downloaded"
  >("all");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [storageManagerOpen, setStorageManagerOpen] = React.useState(false);

  // Live daily progress stats
  const { minutesReadToday, dailyGoalMinutes, progressPercent } = useDailyReadingProgress();

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

    const cached = getUserLibraryCache(user.id);
    if (cached) {
      setLibraryItems(cached);
      setIsLoaded(true);
    }

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

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || "Reader";
  const streakDays = profile?.streak_days ?? 14;

  // The active story for the Continue Reading Hero
  const activeContinueItem = readingItems[0] || (libraryItems.length > 0 ? libraryItems[0] : null);

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      {/* Top Header: Greeting & Gamified Reading Streaks */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
            <Library className="w-4 h-4" />
            <span>My Personal Library</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Welcome back, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Your personalized sanctuary of saved novellas, reading streaks, and offline books.
          </p>
        </div>

        {/* Stats Row: Streak Medal & Daily Reading Goal Ring */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Reading Streak Medal */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-amber-500/20 bg-card/80 backdrop-blur-md shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0">
              <Flame className="w-5 h-5 fill-amber-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Reading Streak
              </span>
              <span className="text-sm font-bold text-amber-500 font-mono">
                {streakDays}-Day Streak
              </span>
            </div>
          </div>

          {/* Daily Goal Ring Widget */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md shadow-sm">
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
              <svg className="w-10 h-10 transform -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  className="text-secondary"
                  fill="transparent"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  className="text-amber-500 transition-all duration-500"
                  strokeDasharray={100}
                  strokeDashoffset={100 - Math.min(progressPercent, 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-[11px] font-bold font-mono text-foreground">
                {minutesReadToday}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Daily Goal
              </span>
              <span className="text-xs font-semibold text-foreground">
                {minutesReadToday} / {dailyGoalMinutes} mins
              </span>
            </div>
          </div>

          {/* Manage Storage Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStorageManagerOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3 text-xs border-border/80 text-foreground/80 hover:bg-secondary cursor-pointer"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Storage</span>
          </Button>
        </div>
      </div>

      {/* Continue Reading 3D Hero Card (if user has active reads) */}
      {activeContinueItem && (
        <section className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-card/90 via-card/70 to-card/40 p-5 sm:p-7 shadow-xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5 w-full sm:w-auto">
              {/* Mini 3D Tilted Novella Preview */}
              <div
                className="relative shrink-0 w-20 sm:w-24 h-28 sm:h-32 rounded-r-md rounded-l-xs shadow-xl transition-transform duration-500 hover:scale-105"
                style={{
                  perspective: "600px",
                }}
              >
                <div
                  className="w-full h-full rounded-r-md rounded-l-xs p-2.5 flex flex-col justify-between border border-amber-400/30 shadow-md relative overflow-hidden"
                  style={{
                    transform: "rotateY(-12deg) rotateX(4deg)",
                    background: activeContinueItem.book.cover_gradient
                      ? undefined
                      : "linear-gradient(135deg, #1f1d1b 0%, #121110 100%)",
                  }}
                >
                  {/* Subtle Spine shadow */}
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/60 to-transparent z-10" />

                  {activeContinueItem.book.cover_image_url ? (
                    <>
                      <Image
                        src={activeContinueItem.book.cover_image_url}
                        alt={activeContinueItem.book.title}
                        fill
                        sizes="120px"
                        unoptimized={
                          !activeContinueItem.book.cover_image_url.includes(".supabase.co") &&
                          !activeContinueItem.book.cover_image_url.startsWith("/")
                        }
                        className="absolute inset-0 object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none z-10" />
                      <div className="border border-amber-400/20 rounded-xs h-full relative z-10 pointer-events-none" />
                    </>
                  ) : (
                    <div className="border border-amber-400/30 rounded p-1 h-full flex flex-col justify-between text-center relative z-10">
                      <span className="text-[7px] text-amber-300 font-serif tracking-widest uppercase truncate">
                        Taleora
                      </span>
                      <h4 className="font-serif text-[10px] font-bold text-amber-100 line-clamp-2 leading-tight">
                        {activeContinueItem.book.title}
                      </h4>
                      <span className="text-[7px] text-amber-400/80 italic truncate">
                        {activeContinueItem.book.author?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress and Book Meta */}
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Continue Reading
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {activeContinueItem.book.author?.name}
                  </span>
                </div>

                <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground truncate">
                  {activeContinueItem.book.title}
                </h3>

                {/* Progress Bar & Percentage */}
                <div className="flex items-center gap-3 w-full max-w-md pt-1">
                  <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
                      style={{
                        width: `${Math.max(activeContinueItem.progress_percentage, 5)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-500 shrink-0">
                    {Math.round(activeContinueItem.progress_percentage)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Resume Reading CTA */}
            <Link
              href={`/read/${activeContinueItem.book.slug}`}
              className="w-full sm:w-auto shrink-0"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-6 rounded-xl font-semibold bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-white shadow-lg shadow-amber-500/25 border border-amber-400/30 gap-2 cursor-pointer transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume Reading</span>
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Filter Tabs matching the modern mockup */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0",
            activeTab === "all"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50"
          )}
        >
          All Stories ({libraryItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reading")}
          className={cn(
            "px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0",
            activeTab === "reading"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50"
          )}
        >
          Currently Reading ({readingItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={cn(
            "px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0",
            activeTab === "saved"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50"
          )}
        >
          Saved Bookmarks ({savedItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={cn(
            "px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0",
            activeTab === "completed"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50"
          )}
        >
          Completed ({completedItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("downloaded")}
          className={cn(
            "px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
            activeTab === "downloaded"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50"
          )}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Downloaded Offline ({offlineBooks.length})</span>
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading && activeTab !== "downloaded" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl border border-border/60 bg-muted/40 animate-pulse"
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
                const primaryGenre = book.genres?.[0]?.name || "Novella";
                const coverGradient = book.cover_gradient || "from-stone-800 via-zinc-900 to-black";
                const sizeKb = (book.size_bytes / 1024).toFixed(0);

                return (
                  <div
                    key={book.id}
                    className="group flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs hover:border-primary/40 transition-all duration-300"
                  >
                    <div
                      className={`h-40 w-full bg-gradient-to-br ${coverGradient} p-4 flex flex-col justify-between text-white relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-black/35" />
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-white/20 z-10" />

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

                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Saved on Device ({sizeKb} KB)</span>
                        </span>
                        <span className="text-[11px] font-mono">Offline Ready</span>
                      </div>

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
          <Link href="/discover" prefetch={true}>
            <Button size="md" className="gap-2 mt-2">
              <Sparkles className="w-4 h-4" />
              <span>Browse Curated Catalog</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Empty State: Current tab has 0 items */}
      {!loading && activeTab !== "downloaded" && libraryItems.length > 0 && displayedItems.length === 0 && (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-card/30 flex flex-col items-center gap-3">
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

      {/* Standard Library Bento Shelf Grid */}
      {!loading && activeTab !== "downloaded" && displayedItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedItems.map((item) => {
            const { book } = item;
            const isDeleting = deletingId === book.id;
            const primaryGenre = book.genres?.[0]?.name || "Novella";
            const coverGradient =
              book.cover_gradient || "from-stone-800 via-zinc-900 to-black";

            return (
              <div
                key={item.id}
                className={cn(
                  "group flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs hover:border-primary/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
                  isDeleting && "opacity-50 pointer-events-none"
                )}
              >
                {/* Book Mini Banner */}
                <div
                  className={`h-40 w-full bg-gradient-to-br ${coverGradient} p-4 flex flex-col justify-between text-white relative overflow-hidden`}
                >
                  {book.cover_image_url && (
                    <Image
                      src={book.cover_image_url}
                      alt={book.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      unoptimized={
                        !book.cover_image_url.includes(".supabase.co") &&
                        !book.cover_image_url.startsWith("/")
                      }
                      className="absolute inset-0 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/25" />
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400/40 z-10" />

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
                      className="w-7 h-7 rounded-full bg-black/40 hover:bg-destructive/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
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
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{book.average_rating ? Number(book.average_rating).toFixed(1) : "5.0"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{book.total_chapters} chapters</span>
                    </div>
                  </div>

                  {/* Reading Progress Indicator */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground text-[11px]">
                        {item.is_completed
                          ? "Completed"
                          : item.progress_percentage > 0
                          ? "Reading Progress"
                          : "Not Started"}
                      </span>
                      <span className="font-mono text-foreground font-semibold text-[11px]">
                        {Math.round(item.progress_percentage)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          item.is_completed
                            ? "bg-emerald-500"
                            : "bg-gradient-to-r from-amber-500 to-amber-600"
                        )}
                        style={{ width: `${Math.max(item.progress_percentage, 0)}%` }}
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
                          className="text-xs gap-1 cursor-pointer font-semibold bg-primary text-primary-foreground"
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
