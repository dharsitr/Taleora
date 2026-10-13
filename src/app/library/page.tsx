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
  Bookmark,
  Check,
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
  const streakDays = profile?.streak_days ?? 0;

  // Active novella for the Currently Reading Spotlight Hero
  const activeContinueItem = readingItems[0] || (libraryItems.length > 0 ? libraryItems[0] : null);

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col gap-8 sm:gap-10">
      {/* Background Ambient Warm Light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Header: Greeting & Gamified Reading Streaks */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/60 pb-8">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit text-amber-500 text-[11px] font-semibold uppercase tracking-widest">
            <Library className="w-3.5 h-3.5" />
            <span>Literary Sanctuary • Personal Library</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Your private repository of active novellas, reading streaks, and offline literature.
          </p>
        </div>

        {/* Stats Widgets */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Reading Streak Capsule */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-amber-500/25 bg-card/70 backdrop-blur-xl shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Flame className="w-4 h-4 fill-amber-500 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Daily Streak
              </span>
              <span className="text-xs font-bold text-amber-400 font-mono">
                {streakDays} Days Flame
              </span>
            </div>
          </div>

          {/* Daily Goal Progress Widget */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xl shadow-xs">
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <svg className="w-9 h-9 transform -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-secondary"
                  fill="transparent"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-amber-500 transition-all duration-500"
                  strokeDasharray={88}
                  strokeDashoffset={88 - (88 * Math.min(progressPercent, 100)) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-[10px] font-bold font-mono text-foreground">
                {minutesReadToday}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Daily Goal
              </span>
              <span className="text-xs font-semibold text-foreground">
                {minutesReadToday} / {dailyGoalMinutes} min
              </span>
            </div>
          </div>

          {/* Storage Manager Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStorageManagerOpen(true)}
            className="h-10 px-4 rounded-2xl border-border/80 bg-background/50 hover:bg-secondary gap-1.5 text-xs font-semibold cursor-pointer transition-all"
          >
            <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Offline Vault</span>
          </Button>
        </div>
      </div>

      {/* "Currently Reading" Hero Spotlight Card matching Concept Mockup */}
      {activeContinueItem && (
        <section className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-card/85 p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
          {/* Ambient Warm Golden Orb */}
          <div className="absolute top-1/2 -left-10 -translate-y-1/2 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 w-full md:w-auto">
              {/* 3D Tilted Hardcover Novella with Ribbon Bookmark */}
              <div
                className="relative shrink-0 w-32 sm:w-36 h-44 sm:h-52 rounded-r-md rounded-l-xs shadow-2xl transition-transform duration-500 group-hover:scale-105"
                style={{ perspective: "800px" }}
              >
                <div
                  className="w-full h-full rounded-r-md rounded-l-xs p-3 flex flex-col justify-between border border-amber-400/40 shadow-xl relative overflow-hidden bg-gradient-to-br from-stone-900 via-zinc-950 to-black"
                  style={{
                    transform: "rotateY(-12deg) rotateX(4deg)",
                    boxShadow: "10px 15px 30px rgba(0,0,0,0.6), inset 2px 0 4px rgba(255,255,255,0.15)",
                  }}
                >
                  {/* Spine Crease Depth */}
                  <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-black/80 via-white/20 to-transparent z-20 pointer-events-none" />

                  {/* Ribbon Bookmark hanging down */}
                  <div className="absolute top-0 right-4 w-3.5 h-10 bg-amber-500 shadow-md z-20 rounded-b-xs pointer-events-none border-t-0 border border-amber-300/40" />

                  {activeContinueItem.book.cover_image_url ? (
                    <Image
                      src={activeContinueItem.book.cover_image_url}
                      alt={activeContinueItem.book.title}
                      fill
                      sizes="160px"
                      unoptimized={
                        !activeContinueItem.book.cover_image_url.includes(".supabase.co") &&
                        !activeContinueItem.book.cover_image_url.startsWith("/")
                      }
                      className="absolute inset-0 object-cover object-center"
                    />
                  ) : (
                    <div className="relative z-10 h-full flex flex-col justify-between text-center p-2 border border-amber-400/30 rounded-xs">
                      <span className="text-[8px] font-mono tracking-widest text-amber-400 uppercase">
                        Taleora
                      </span>
                      <h4 className="font-serif text-xs font-bold text-white line-clamp-3 leading-snug">
                        {activeContinueItem.book.title}
                      </h4>
                      <span className="text-[8px] text-amber-400/80 italic truncate">
                        {activeContinueItem.book.author?.name}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none z-10" />
                </div>
              </div>

              {/* Spotlight Metadata & Progress */}
              <div className="flex flex-col gap-3 min-w-0 flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                    Currently Reading
                  </span>
                  <span className="text-muted-foreground text-xs">•</span>
                  <span className="text-xs text-muted-foreground">
                    by {activeContinueItem.book.author?.name}
                  </span>
                  <Badge variant="warm" className="text-[10px] px-2 py-0.5 rounded-full ml-1">
                    {activeContinueItem.book.genres?.[0]?.name || "Novella"}
                  </Badge>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                  {activeContinueItem.book.title}
                </h3>

                {/* Progress Bar & Numerical State */}
                <div className="flex flex-col gap-2 pt-1 max-w-md mx-auto sm:mx-0 w-full">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">
                      Reading Progress
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {Math.round(activeContinueItem.progress_percentage)}% completed
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 transition-all duration-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                      style={{
                        width: `${Math.max(activeContinueItem.progress_percentage, 5)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Streak Tag */}
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-muted-foreground font-medium">
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                  <span>Daily {streakDays}-day reading streak</span>
                </div>
              </div>
            </div>

            {/* Glowing CTA Action */}
            <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row md:flex-col items-center gap-3">
              <Link
                href={`/read/${activeContinueItem.book.slug}`}
                className="w-full md:w-auto"
              >
                <Button
                  size="lg"
                  className="w-full md:w-auto h-12 px-7 rounded-full font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] border border-amber-300/40 gap-2.5 cursor-pointer transition-all"
                >
                  <Play className="w-4 h-4 fill-stone-950 stroke-[2.5]" />
                  <span>Resume Reading</span>
                </Button>
              </Link>
              <Link
                href={`/books/${activeContinueItem.book.slug}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View Story Details →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Segmented Shelf Tabs matching Concept Mockup */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-secondary/50 border border-border/80 backdrop-blur-md w-fit text-xs font-semibold overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap",
            activeTab === "all"
              ? "bg-card text-foreground shadow-xs font-bold border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          All Stories ({libraryItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reading")}
          className={cn(
            "px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap",
            activeTab === "reading"
              ? "bg-amber-500/15 text-amber-400 shadow-xs font-bold border border-amber-500/30"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Currently Reading ({readingItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={cn(
            "px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap",
            activeTab === "saved"
              ? "bg-card text-foreground shadow-xs font-bold border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Want to Read ({savedItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={cn(
            "px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap",
            activeTab === "completed"
              ? "bg-emerald-500/15 text-emerald-400 shadow-xs font-bold border border-emerald-500/30"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Finished ({completedItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("downloaded")}
          className={cn(
            "px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
            activeTab === "downloaded"
              ? "bg-sky-500/15 text-sky-400 shadow-xs font-bold border border-sky-500/30"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Offline Vault ({offlineBooks.length})</span>
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading && activeTab !== "downloaded" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl border border-border/60 bg-secondary/30 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Offline Tab Downloaded Content */}
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
                    className="group relative rounded-3xl border border-border/80 bg-card/80 backdrop-blur-md overflow-hidden shadow-xs hover:border-amber-500/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div
                      className={`h-44 w-full bg-gradient-to-br ${coverGradient} p-4 flex flex-col justify-between text-white relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/60 via-white/20 to-transparent z-10" />

                      <div className="relative z-10 flex items-start justify-between">
                        <Badge
                          variant="warm"
                          className="bg-black/50 text-white border-white/20 text-[10px] font-semibold"
                        >
                          {primaryGenre}
                        </Badge>

                        <span className="text-[10px] font-mono text-white/90 bg-black/50 px-2.5 py-0.5 rounded-full border border-white/20">
                          {book.total_chapters} chapters
                        </span>
                      </div>

                      <div className="relative z-10">
                        <Link href={`/read/${book.slug}`}>
                          <h3 className="font-serif text-lg font-bold leading-tight line-clamp-2 text-white hover:text-amber-300 transition-colors">
                            {book.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-white/80 line-clamp-1 mt-0.5 font-medium">
                          by {book.author?.name}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Saved Offline ({sizeKb} KB)</span>
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">Ready</span>
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
                            size="sm"
                            className="rounded-full px-4 text-xs font-semibold bg-amber-500 text-stone-950 hover:bg-amber-400"
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
            <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-amber-500/30 bg-card/40 backdrop-blur-md flex flex-col items-center gap-5 max-w-lg mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                <HardDrive className="w-10 h-10" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-serif text-2xl font-bold text-foreground">
                  No Offline Stories Saved
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
                  You haven&apos;t downloaded any stories for offline reading yet. Click &quot;Save Offline&quot; on any book to enjoy reading without an internet connection.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("all")}
                className="rounded-full px-5 h-10 gap-2 mt-2 cursor-pointer border-border/80"
              >
                <span>Browse Your Saved Stories</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty State: Zero Library Items */}
      {!loading && activeTab !== "downloaded" && libraryItems.length === 0 && (
        <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-amber-500/30 bg-card/40 backdrop-blur-md flex flex-col items-center gap-5 max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
            <BookMarked className="w-10 h-10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="font-serif text-2xl font-bold text-foreground">
              Your Literary Shelf is Waiting
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
              You haven&apos;t added any stories to your library yet. Explore our curated collections and save tales that inspire you.
            </p>
          </div>
          <Link href="/discover" prefetch={true}>
            <Button
              size="md"
              className="h-10 px-5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] gap-2 mt-2"
            >
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>Browse Curated Catalog</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Empty Tab Filter */}
      {!loading && activeTab !== "downloaded" && libraryItems.length > 0 && displayedItems.length === 0 && (
        <div className="text-center py-16 px-6 rounded-3xl border border-dashed border-border/70 bg-card/30 flex flex-col items-center gap-3">
          <BookOpen className="w-8 h-8 text-muted-foreground/60" />
          <h4 className="font-serif text-lg font-semibold text-foreground capitalize">
            No Stories in &ldquo;{activeTab}&rdquo;
          </h4>
          <p className="text-xs text-muted-foreground">
            Switch back to &ldquo;All Stories&rdquo; or explore more titles from the catalog.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("all")}
            className="rounded-full px-4 h-9 mt-1"
          >
            View All Saved Stories
          </Button>
        </div>
      )}

      {/* Physical Bookshelf Bento Grid */}
      {!loading && activeTab !== "downloaded" && displayedItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedItems.map((item) => {
            const { book } = item;
            const isDeleting = deletingId === book.id;
            const primaryGenre = book.genres?.[0]?.name || "Novella";
            const coverGradient =
              book.cover_gradient || "from-stone-900 via-zinc-900 to-black";

            return (
              <div
                key={item.id}
                className={cn(
                  "group relative rounded-3xl border border-border/80 bg-card/80 backdrop-blur-md overflow-hidden flex flex-col justify-between hover:border-amber-500/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition-all duration-300",
                  isDeleting && "opacity-50 pointer-events-none"
                )}
              >
                {/* Book Cover Banner with 3D Depth */}
                <div>
                  <div
                    className={`h-44 w-full bg-gradient-to-br ${coverGradient} p-4 flex flex-col justify-between text-white relative overflow-hidden`}
                  >
                    {book.cover_image_url && (
                      <Image
                        src={book.cover_image_url}
                        alt={book.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        unoptimized={
                          !book.cover_image_url.includes(".supabase.co") &&
                          !book.cover_image_url.startsWith("/")
                        }
                        className="absolute inset-0 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

                    {/* Book Spine 3D Crease Depth */}
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/70 via-white/20 to-transparent z-10 pointer-events-none" />

                    {/* Top Row: Genre & Trash Action */}
                    <div className="relative z-10 flex items-start justify-between">
                      <Badge
                        variant="warm"
                        className="bg-black/50 backdrop-blur-md text-white border-white/20 text-[10px] font-bold uppercase tracking-wider"
                      >
                        {primaryGenre}
                      </Badge>

                      <button
                        type="button"
                        onClick={() => handleRemove(book.id)}
                        title="Remove from my library"
                        className="w-7 h-7 rounded-full bg-black/40 hover:bg-rose-500/90 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer border border-white/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Cover Title & Author */}
                    <div className="relative z-10">
                      <Link href={`/books/${book.slug}`}>
                        <h3 className="font-serif text-lg font-bold leading-tight line-clamp-2 text-white hover:text-amber-300 transition-colors">
                          {book.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-white/80 line-clamp-1 mt-0.5 font-medium">
                        by {book.author?.name}
                      </p>
                    </div>
                  </div>

                  {/* Card Body & Reading Progress */}
                  <div className="p-5 flex flex-col gap-3.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
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
                        <span className="text-muted-foreground text-[11px] font-medium">
                          {item.is_completed
                            ? "Completed"
                            : item.progress_percentage > 0
                            ? "Reading Progress"
                            : "Not Started"}
                        </span>
                        <span className="font-mono text-foreground font-bold text-[11px]">
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
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-5 py-3.5 bg-secondary/30 border-t border-border/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleRemove(book.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove from library"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <OfflineDownloadButton
                      bookId={book.id}
                      bookTitle={book.title}
                      size="sm"
                      variant="ghost"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/books/${book.slug}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 rounded-full text-xs hover:text-foreground cursor-pointer"
                      >
                        Details
                      </Button>
                    </Link>

                    <Link href={`/read/${book.slug}`}>
                      <Button
                        size="sm"
                        className="h-8 px-4 rounded-full text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 gap-1.5 cursor-pointer transition-all"
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
