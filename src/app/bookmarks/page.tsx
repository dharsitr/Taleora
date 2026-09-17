"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bookmark as BookmarkIcon,
  Highlighter,
  BookOpen,
  Compass,
  Sparkles,
  Clock,
  ArrowRight,
  Trash2,
  Edit3,
  Search,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import {
  getUserBookmarks,
  deleteBookmark,
  getUserHighlights,
  updateHighlightNote,
  deleteHighlight,
  getUserLibrary,
} from "@/lib/books/queries";
import {
  getUserBookmarksCache,
  getUserHighlightsCache,
  getUserLibraryCache,
} from "@/lib/books/cache";
import {
  BookmarkWithDetails,
  HighlightWithDetails,
  LibraryItem,
  HighlightColor,
  HighlightRow,
} from "@/types/books";
import { HIGHLIGHT_COLORS } from "@/lib/books/highlights";
import { BookCard } from "@/components/books/BookCard";
import { HighlightNoteModal } from "@/components/reader/HighlightNoteModal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ActiveTab = "bookmarks" | "highlights" | "library";

export default function BookmarksPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("bookmarks");

  const cachedBookmarks = user ? getUserBookmarksCache(user.id) : null;
  const cachedHighlights = user ? getUserHighlightsCache(user.id) : null;
  const cachedLibrary = user ? getUserLibraryCache(user.id) : null;
  const isInitiallyCached = Boolean(cachedBookmarks || cachedHighlights || cachedLibrary);

  // Data states initialized from cache for instant 0ms transition
  const [bookmarks, setBookmarks] = React.useState<BookmarkWithDetails[]>(
    cachedBookmarks || []
  );
  const [highlights, setHighlights] = React.useState<HighlightWithDetails[]>(
    cachedHighlights || []
  );
  const [libraryItems, setLibraryItems] = React.useState<LibraryItem[]>(
    cachedLibrary || []
  );
  const [isLoaded, setIsLoaded] = React.useState(isInitiallyCached);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modal state for editing notes
  const [editingHighlight, setEditingHighlight] = React.useState<HighlightRow | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) return;

    // Seed state immediately if cache exists
    const bCache = getUserBookmarksCache(user.id);
    const hCache = getUserHighlightsCache(user.id);
    const lCache = getUserLibraryCache(user.id);
    if (bCache) setBookmarks(bCache);
    if (hCache) setHighlights(hCache);
    if (lCache) setLibraryItems(lCache);
    if (bCache || hCache || lCache) setIsLoaded(true);

    let isMounted = true;

    Promise.all([
      getUserBookmarks(user.id),
      getUserHighlights(user.id),
      getUserLibrary(user.id),
    ])
      .then(([bmRes, hlRes, libRes]) => {
        if (isMounted) {
          setBookmarks(bmRes);
          setHighlights(hlRes);
          setLibraryItems(libRes);
          setIsLoaded(true);
        }
      })
      .catch((err) => {
        console.error("Error loading reader archives:", err);
        if (isMounted) setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleDeleteBookmark = async (id: string) => {
    if (!user) return;
    if (!window.confirm("Remove this bookmark?")) return;
    setDeletingId(id);
    try {
      const ok = await deleteBookmark(id, user.id);
      if (ok) {
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteHighlight = async (id: string) => {
    if (!user) return;
    setDeletingId(id);
    try {
      const ok = await deleteHighlight(id, user.id);
      if (ok) {
        setHighlights((prev) => prev.filter((h) => h.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveHighlightNote = async (
    highlightId: string,
    note: string | null,
    color: HighlightColor
  ) => {
    if (!user) return;
    const updated = await updateHighlightNote(highlightId, user.id, note, color);
    if (updated) {
      setHighlights((prev) =>
        prev.map((h) => (h.id === highlightId ? { ...h, ...updated } : h))
      );
    }
  };

  const loading = authLoading || (!!user && !isLoaded);

  // Search filtering
  const q = searchQuery.toLowerCase().trim();

  const filteredBookmarks = bookmarks.filter((b) => {
    if (!q) return true;
    return (
      b.book?.title.toLowerCase().includes(q) ||
      b.chapter?.title.toLowerCase().includes(q) ||
      (b.snippet && b.snippet.toLowerCase().includes(q)) ||
      (b.label && b.label.toLowerCase().includes(q))
    );
  });

  const filteredHighlights = highlights.filter((h) => {
    if (!q) return true;
    return (
      h.book?.title.toLowerCase().includes(q) ||
      h.chapter?.title.toLowerCase().includes(q) ||
      h.selected_text.toLowerCase().includes(q) ||
      (h.note && h.note.toLowerCase().includes(q))
    );
  });

  const filteredLibrary = libraryItems.filter((item) => {
    if (!q) return true;
    return (
      item.book.title.toLowerCase().includes(q) ||
      item.book.author.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b border-border/70 pb-5">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <BookmarkIcon className="w-4 h-4" />
          <span>Curated Personal Archive</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Bookmarks & Annotations
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review saved reading spots, literary highlights, and private reflections across your library.
            </p>
          </div>

          <Link href="/discover" prefetch={true}>
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
              <Compass className="w-4 h-4 text-primary" />
              <span>Explore Stories</span>
            </Button>
          </Link>
        </div>

        {/* Tab Selection & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
          <div className="flex border-b border-border sm:border-none gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("bookmarks")}
              className={cn(
                "pb-2 sm:pb-1.5 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer",
                activeTab === "bookmarks"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <BookmarkIcon className="w-4 h-4" />
              <span>Bookmarks</span>
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-secondary font-mono">
                {bookmarks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("highlights")}
              className={cn(
                "pb-2 sm:pb-1.5 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer",
                activeTab === "highlights"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Highlighter className="w-4 h-4" />
              <span>Highlights & Notes</span>
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-secondary font-mono">
                {highlights.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("library")}
              className={cn(
                "pb-2 sm:pb-1.5 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer",
                activeTab === "library"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="w-4 h-4" />
              <span>Saved Stories</span>
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-secondary font-mono">
                {libraryItems.length}
              </span>
            </button>
          </div>

          {/* Search within archive */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes & quotes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-card/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 h-60 animate-pulse bg-secondary/50"
            />
          ))}
        </div>
      )}

      {/* TAB 1: READING BOOKMARKS */}
      {!loading && activeTab === "bookmarks" && (
        <>
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-border bg-card/40 flex flex-col items-center gap-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                <BookmarkIcon className="w-8 h-8" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-serif text-lg font-bold text-foreground">
                  {searchQuery ? "No Matching Bookmarks" : "No Bookmarks Saved Yet"}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {searchQuery
                    ? "Try adjusting your search keywords."
                    : "While reading any chapter, tap the bookmark icon in the top header or annotations drawer to save your exact reading location."}
                </p>
              </div>
              <Link href="/library">
                <Button size="sm" className="gap-2 mt-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Go to Library</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredBookmarks.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between gap-4 hover:border-primary/40 hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col gap-3">
                    {/* Top: Book and Chapter Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col">
                        <Link
                          href={`/books/${b.book?.slug}`}
                          className="font-serif font-bold text-base text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {b.book?.title}
                        </Link>
                        <span className="text-xs text-primary font-medium mt-0.5">
                          {b.chapter
                            ? `Chapter ${b.chapter.chapter_number}: ${b.chapter.title}`
                            : "Saved Location"}
                        </span>
                      </div>

                      {/* Progress Badge */}
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-secondary text-foreground">
                        {Math.round(b.progress_percentage)}%
                      </span>
                    </div>

                    {/* Optional Label */}
                    {b.label && (
                      <div className="text-xs font-semibold text-foreground/90">
                        {b.label}
                      </div>
                    )}

                    {/* Quoted Passage Snippet */}
                    {b.snippet && (
                      <blockquote className="p-3 rounded-xl bg-secondary/30 border-l-2 border-primary/50 text-xs font-serif italic text-muted-foreground line-clamp-3">
                        &ldquo;{b.snippet}&rdquo;
                      </blockquote>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(b.created_at).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteBookmark(b.id)}
                        disabled={deletingId === b.id}
                        title="Delete Bookmark"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {b.chapter && (
                        <Link
                          href={`/read/${b.book?.slug}/${b.chapter.slug}?p=${b.paragraph_index}`}
                        >
                          <Button size="sm" variant="default" className="gap-1.5 h-8 text-xs cursor-pointer">
                            <span>Jump to Passage</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: HIGHLIGHTS & NOTES */}
      {!loading && activeTab === "highlights" && (
        <>
          {filteredHighlights.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-border bg-card/40 flex flex-col items-center gap-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                <Highlighter className="w-8 h-8" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-serif text-lg font-bold text-foreground">
                  {searchQuery ? "No Matching Highlights" : "No Highlights or Notes Yet"}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {searchQuery
                    ? "Try searching for other words in your highlighted quotes."
                    : "Select text while reading any story to highlight prose in 5 distinctive hues and jot down personal notes."}
                </p>
              </div>
              <Link href="/library">
                <Button size="sm" className="gap-2 mt-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Start Reading</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredHighlights.map((h) => {
                const colorConfig =
                  HIGHLIGHT_COLORS[h.color as HighlightColor] ||
                  HIGHLIGHT_COLORS.amber;

                return (
                  <div
                    key={h.id}
                    className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between gap-4 hover:border-primary/40 hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Book & Color Details */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/books/${h.book?.slug}`}
                            className="font-serif font-bold text-base text-foreground hover:text-primary transition-colors line-clamp-1"
                          >
                            {h.book?.title}
                          </Link>
                          <span className="text-xs text-muted-foreground mt-0.5 block">
                            {h.chapter
                              ? `Chapter ${h.chapter.chapter_number}: ${h.chapter.title}`
                              : "Chapter Passage"}
                          </span>
                        </div>

                        {/* Color Badge */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium"
                          style={{
                            borderColor: "transparent",
                          }}
                        >
                          <span
                            className={cn("w-2.5 h-2.5 rounded-full", colorConfig.previewBg)}
                          />
                          <span className="text-[11px] text-muted-foreground">
                            {colorConfig.name}
                          </span>
                        </div>
                      </div>

                      {/* Highlighted Passage */}
                      <blockquote
                        className={cn(
                          "p-3.5 rounded-xl border-l-4 text-xs sm:text-sm font-serif italic text-foreground/90 leading-relaxed",
                          h.color === "amber" && "border-amber-400 bg-amber-500/10",
                          h.color === "emerald" && "border-emerald-400 bg-emerald-500/10",
                          h.color === "sky" && "border-sky-400 bg-sky-500/10",
                          h.color === "rose" && "border-rose-400 bg-rose-500/10",
                          h.color === "violet" && "border-purple-400 bg-purple-500/10"
                        )}
                      >
                        &ldquo;{h.selected_text}&rdquo;
                      </blockquote>

                      {/* Attached Note */}
                      {h.note ? (
                        <div className="p-3 rounded-xl bg-secondary/40 border border-border/70 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Reflection</span>
                          </div>
                          <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                            {h.note}
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingHighlight(h)}
                          className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 w-fit cursor-pointer transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Add note to this quote...</span>
                        </button>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(h.created_at).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingHighlight(h)}
                          title="Edit Note or Color"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteHighlight(h.id)}
                          disabled={deletingId === h.id}
                          title="Delete Highlight"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {h.chapter && (
                          <Link
                            href={`/read/${h.book?.slug}/${h.chapter.slug}?p=${h.paragraph_index}`}
                          >
                            <Button size="sm" variant="default" className="gap-1.5 h-8 text-xs cursor-pointer">
                              <span>Jump</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 3: SAVED STORIES (LIBRARY) */}
      {!loading && activeTab === "library" && (
        <>
          {filteredLibrary.length === 0 ? (
            <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-border bg-card/40 flex flex-col items-center gap-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-serif text-lg font-bold text-foreground">
                  {searchQuery ? "No Matching Saved Stories" : "No Stories Saved Yet"}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Explore the catalog and add titles to your personal shelf.
                </p>
              </div>
              <Link href="/discover" prefetch={true}>
                <Button size="sm" className="gap-2 mt-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Discover Stories</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredLibrary.map((item) => (
                <BookCard key={item.id} book={item.book} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Highlight Note Modal for Editing */}
      <HighlightNoteModal
        highlight={editingHighlight}
        isOpen={!!editingHighlight}
        onClose={() => setEditingHighlight(null)}
        onSaveNote={handleSaveHighlightNote}
        onDeleteHighlight={handleDeleteHighlight}
      />
    </div>
  );
}
