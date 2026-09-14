"use client";

import * as React from "react";
import {
  BookOpen,
  Search,
  Star,
  Flame,
  EyeOff,
  Eye,
  CheckCircle,
  RefreshCw,
  Layers,
  X,
} from "lucide-react";
import type { AdminBookItem, AdminChapterItem } from "@/types/admin";
import {
  toggleBookFeature,
  toggleBookTrending,
  suspendBook,
  restoreBook,
  getAdminChapters,
  suspendChapter,
  restoreChapter,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";

interface AdminBooksTabProps {
  books: AdminBookItem[];
  onRefresh: () => Promise<void>;
}

export function AdminBooksTab({ books, onRefresh }: AdminBooksTabProps) {
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [moderationFilter, setModerationFilter] = React.useState<string>("all");
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);

  // Suspension Modal State
  const [suspendingBook, setSuspendingBook] = React.useState<AdminBookItem | null>(null);
  const [suspensionReason, setSuspensionReason] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  // Chapter Inspection State
  const [inspectingBook, setInspectingBook] = React.useState<AdminBookItem | null>(null);
  const [chapters, setChapters] = React.useState<AdminChapterItem[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = React.useState<boolean>(false);
  const [suspendingChapter, setSuspendingChapter] = React.useState<AdminChapterItem | null>(null);
  const [chapterSuspensionReason, setChapterSuspensionReason] = React.useState<string>("");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredBooks = books.filter((b) => {
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (moderationFilter === "active" && b.is_suspended) return false;
    if (moderationFilter === "suspended" && !b.is_suspended) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = b.title.toLowerCase().includes(q);
      const matchAuthor = b.author_name.toLowerCase().includes(q);
      if (!matchTitle && !matchAuthor) return false;
    }
    return true;
  });

  const handleToggleFeature = async (book: AdminBookItem) => {
    try {
      await toggleBookFeature(book.id, !book.featured);
      await onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle featured status");
    }
  };

  const handleToggleTrending = async (book: AdminBookItem) => {
    try {
      await toggleBookTrending(book.id, !book.trending);
      await onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle trending status");
    }
  };

  const handleConfirmSuspend = async () => {
    if (!suspendingBook) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      await suspendBook(suspendingBook.id, suspensionReason || "Suspended by moderator review");
      setSuspendingBook(null);
      setSuspensionReason("");
      await onRefresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to suspend book");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async (book: AdminBookItem) => {
    if (!confirm(`Restore "${book.title}" to public discovery?`)) return;
    try {
      await restoreBook(book.id);
      await onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to restore book");
    }
  };

  const handleInspectChapters = async (book: AdminBookItem) => {
    setInspectingBook(book);
    setIsLoadingChapters(true);
    try {
      const result = await getAdminChapters(book.id);
      setChapters(result);
    } catch (err: unknown) {
      console.error("Failed to load chapters:", err);
    } finally {
      setIsLoadingChapters(false);
    }
  };

  const handleToggleChapterSuspension = async (chapter: AdminChapterItem) => {
    if (chapter.is_suspended) {
      try {
        await restoreChapter(chapter.id);
        if (inspectingBook) {
          const result = await getAdminChapters(inspectingBook.id);
          setChapters(result);
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to restore chapter");
      }
    } else {
      setSuspendingChapter(chapter);
      setChapterSuspensionReason("");
    }
  };

  const handleConfirmChapterSuspend = async () => {
    if (!suspendingChapter || !inspectingBook) return;
    setIsSubmitting(true);
    try {
      await suspendChapter(
        suspendingChapter.id,
        chapterSuspensionReason || "Chapter suspended by moderation review"
      );
      setSuspendingChapter(null);
      const result = await getAdminChapters(inspectingBook.id);
      setChapters(result);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to suspend chapter");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/80 bg-card/40">
        <div className="flex flex-wrap items-center gap-2">
          {/* Moderation Status */}
          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg border border-border/60">
            {["all", "active", "suspended"].map((m) => (
              <button
                key={m}
                onClick={() => setModerationFilter(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all cursor-pointer ${
                  moderationFilter === m
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Publication status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-secondary/60 border border-border/80 text-foreground text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">All Release States</option>
            <option value="published">Published Only</option>
            <option value="draft">Draft Only</option>
          </select>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search story title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/40 border border-border/70 rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="shrink-0 gap-1.5 text-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Book List */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border/80 bg-card/20 space-y-2">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto" />
          <h4 className="text-sm font-semibold text-foreground">No Stories Found</h4>
          <p className="text-xs text-muted-foreground">
            No story manuscripts match the selected search and filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 shadow-2xs ${
                book.is_suspended
                  ? "border-red-500/40 bg-red-500/[0.04]"
                  : "border-border/80 bg-card/60 hover:border-primary/30"
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Book Cover / Thumbnail */}
                <div
                  className="w-14 h-20 rounded-md shrink-0 bg-cover bg-center border border-border/80 flex items-end justify-center p-1 relative overflow-hidden shadow-xs"
                  style={{
                    backgroundImage: book.cover_image_url
                      ? `url(${book.cover_image_url})`
                      : undefined,
                    background: !book.cover_image_url
                      ? book.cover_gradient || "linear-gradient(135deg, #2b3a42 0%, #171f24 100%)"
                      : undefined,
                  }}
                >
                  {book.is_suspended && (
                    <div className="absolute inset-0 bg-red-950/70 backdrop-blur-2xs flex items-center justify-center">
                      <EyeOff className="w-5 h-5 text-red-400" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                        book.status === "published"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-secondary text-muted-foreground border border-border"
                      }`}
                    >
                      {book.status}
                    </span>

                    {book.featured && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <Star className="w-2.5 h-2.5 fill-amber-500" />
                        <span>Featured</span>
                      </span>
                    )}

                    {book.trending && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                        <Flame className="w-2.5 h-2.5 fill-rose-500" />
                        <span>Trending</span>
                      </span>
                    )}

                    {book.is_suspended && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                        <EyeOff className="w-2.5 h-2.5" />
                        <span>Suspended</span>
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-semibold text-foreground truncate">
                    {book.title}
                  </h4>

                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>by {book.author_name}</span>
                    {book.author_verified && (
                      <CheckCircle className="w-3 h-3 text-primary inline" />
                    )}
                  </p>

                  <div className="text-[11px] text-muted-foreground flex items-center gap-3 pt-0.5 font-mono">
                    <span>{book.total_chapters} ch</span>
                    <span>★ {book.average_rating.toFixed(1)} ({book.ratings_count})</span>
                  </div>

                  {book.is_suspended && book.suspension_reason && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 italic mt-1 bg-red-500/10 p-1.5 rounded border border-red-500/20">
                      Reason: {book.suspension_reason}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInspectChapters(book)}
                  className="text-xs gap-1.5 text-foreground/80 hover:text-foreground cursor-pointer h-7"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Chapters ({book.total_chapters})</span>
                </Button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleFeature(book)}
                    title={book.featured ? "Unfeature book" : "Feature on homepage"}
                    className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      book.featured
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400"
                        : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${book.featured ? "fill-current" : ""}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleTrending(book)}
                    title={book.trending ? "Remove from trending" : "Mark as trending"}
                    className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      book.trending
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400"
                        : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Flame className={`w-3.5 h-3.5 ${book.trending ? "fill-current" : ""}`} />
                  </button>

                  {book.is_suspended ? (
                    <Button
                      size="sm"
                      onClick={() => handleRestore(book)}
                      className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Restore</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSuspendingBook(book);
                        setSuspensionReason("");
                      }}
                      className="text-xs h-7 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10 gap-1 cursor-pointer"
                    >
                      <EyeOff className="w-3 h-3" />
                      <span>Suspend</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book Suspension Modal */}
      {suspendingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Suspend Story: &ldquo;{suspendingBook.title}&rdquo;
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Suspending this story conceals it from public catalog discovery, search, and reading lists. Authors will be notified of the suspension reason.
              </p>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600">
                {actionError}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Suspension Reason:
              </label>
              <textarea
                rows={3}
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="State the policy violation (e.g. copyright infringement, inappropriate graphic content)..."
                className="w-full bg-secondary/40 border border-border text-foreground text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSuspendingBook(null)}
                disabled={isSubmitting}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmSuspend}
                disabled={isSubmitting}
                className="text-xs bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                {isSubmitting ? "Suspending..." : "Confirm Suspension"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Inspection Drawer / Modal */}
      {inspectingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Manuscript Chapters: {inspectingBook.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inspect chapters, word counts, and apply individual chapter moderation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingBook(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {isLoadingChapters ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading manuscript chapters...</span>
                </div>
              ) : chapters.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No chapters uploaded yet for this story.
                </div>
              ) : (
                chapters.map((ch) => (
                  <div
                    key={ch.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      ch.is_suspended
                        ? "border-red-500/40 bg-red-500/[0.04]"
                        : "border-border/70 bg-secondary/20"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground font-semibold">
                          Ch {ch.chapter_number}:
                        </span>
                        <span className="font-medium text-foreground truncate">
                          {ch.title}
                        </span>
                        {ch.is_suspended && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                            Suspended
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-3 font-mono">
                        <span>{ch.word_count} words</span>
                        <span>~{ch.estimated_read_minutes} min</span>
                        <span>{ch.status}</span>
                      </div>
                      {ch.is_suspended && ch.suspension_reason && (
                        <p className="text-[11px] text-red-500 italic mt-1">
                          Reason: {ch.suspension_reason}
                        </p>
                      )}
                    </div>

                    <Button
                      variant={ch.is_suspended ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleChapterSuspension(ch)}
                      className={`text-xs h-7 shrink-0 cursor-pointer ${
                        ch.is_suspended
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10"
                      }`}
                    >
                      {ch.is_suspended ? "Restore Chapter" : "Suspend Chapter"}
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-border/70">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectingBook(null)}
                className="text-xs cursor-pointer"
              >
                Close Drawer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Suspension Modal */}
      {suspendingChapter && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Suspend Chapter {suspendingChapter.chapter_number}: &ldquo;{suspendingChapter.title}&rdquo;
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Conceals this chapter from readers while keeping the rest of the book accessible.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Chapter Suspension Reason:
              </label>
              <textarea
                rows={3}
                value={chapterSuspensionReason}
                onChange={(e) => setChapterSuspensionReason(e.target.value)}
                placeholder="Reason for chapter suspension..."
                className="w-full bg-secondary/40 border border-border text-foreground text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSuspendingChapter(null)}
                disabled={isSubmitting}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmChapterSuspend}
                disabled={isSubmitting}
                className="text-xs bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                {isSubmitting ? "Suspending..." : "Confirm Chapter Suspension"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
