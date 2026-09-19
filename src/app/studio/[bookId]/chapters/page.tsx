"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  ArrowUp,
  ArrowDown,
  Clock,
  Calendar,
  Trash2,
  Edit,
  Layers,
  Check,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import {
  getAuthorStory,
  getStoryChaptersForAuthor,
  reorderChapters,
  deleteChapter,
} from "@/lib/books/queries";
import { BookDetail, ChapterRow } from "@/types/books";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";

export default function ChaptersManagerPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const bookId = params?.bookId as string;

  // Redirect to login if unauthenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?next=/studio/${bookId}/chapters`);
    }
  }, [authLoading, user, bookId, router]);

  const [book, setBook] = React.useState<BookDetail | null>(null);
  const [chapters, setChapters] = React.useState<ChapterRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isReordering, setIsReordering] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [chapterToDelete, setChapterToDelete] = React.useState<ChapterRow | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user || !bookId) return;
    let isMounted = true;

    Promise.all([
      getAuthorStory(user.id, bookId),
      getStoryChaptersForAuthor(user.id, bookId),
    ])
      .then(([b, c]) => {
        if (!isMounted) return;
        setBook(b);
        setChapters(c);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading chapters:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, bookId]);

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    const reordered = [...chapters];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Update local order immediately for snappy UX
    const updatedWithNumbers = reordered.map((c, i) => ({
      ...c,
      chapter_number: i + 1,
    }));
    setChapters(updatedWithNumbers);
    setIsReordering(true);

    try {
      const chapterIds = updatedWithNumbers.map((c) => c.id);
      const ok = await reorderChapters(bookId, chapterIds);
      if (ok) {
        setStatusMessage("Chapter order updated.");
        setTimeout(() => setStatusMessage(null), 2500);
      }
    } catch (err) {
      console.error("Failed to reorder chapters:", err);
    } finally {
      setIsReordering(false);
    }
  };

  const handleDeleteClick = (chapter: ChapterRow) => {
    setDeleteError(null);
    setChapterToDelete(chapter);
  };

  const handleConfirmDelete = async () => {
    if (!user || !chapterToDelete) return;

    setDeletingId(chapterToDelete.id);
    setDeleteError(null);
    try {
      const ok = await deleteChapter(user.id, chapterToDelete.id, bookId);
      if (ok) {
        setChapters((prev) => prev.filter((c) => c.id !== chapterToDelete.id));
        setChapterToDelete(null);
      } else {
        setDeleteError("Failed to delete chapter. Please check your permissions.");
      }
    } catch (err) {
      console.error("Error deleting chapter:", err);
      setDeleteError(err instanceof Error ? err.message : "Error deleting chapter.");
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto py-12 animate-pulse">
        <div className="h-6 w-32 bg-secondary rounded-lg" />
        <div className="h-64 bg-card rounded-2xl border border-border" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-20 flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">Story not found.</p>
        <Link href="/studio">
          <Button size="sm">Back to Studio</Button>
        </Link>
      </div>
    );
  }

  const publishedCount = chapters.filter((c) => c.status === "published").length;
  const scheduledCount = chapters.filter((c) => c.status === "scheduled").length;
  const draftCount = chapters.filter((c) => c.status === "draft").length;
  const totalWords = chapters.reduce((sum, c) => sum + (c.word_count || 0), 0);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-20">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={`/studio/${bookId}`}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Story Settings</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/studio/${bookId}/chapters/new`}>
            <Button size="sm" className="gap-2 cursor-pointer shadow-sm">
              <Plus className="w-4 h-4" />
              <span>Write Chapter</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border/70 pb-5">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          <span>Chapter Index & Sequence</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          {book.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Organize, reorder, and schedule chapter releases.
        </p>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-xl border border-border bg-card/60">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
            Total Chapters
          </span>
          <span className="font-serif text-xl font-bold text-foreground">
            {chapters.length}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
            Published
          </span>
          <span className="font-serif text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {publishedCount} live
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
            Scheduled
          </span>
          <span className="font-serif text-xl font-bold text-sky-600 dark:text-sky-400">
            {scheduledCount} queued
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
            Drafts
          </span>
          <span className="font-serif text-xl font-bold text-muted-foreground">
            {draftCount}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
            Total Words
          </span>
          <span className="font-serif text-xl font-bold text-foreground">
            {totalWords.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Chapters Sequence List */}
      <div className="flex flex-col gap-3">
        {chapters.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-border bg-card/40 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-serif text-lg font-bold text-foreground">
                No Chapters Written Yet
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
                Every compelling story starts with Chapter 1. Open the writing canvas to start drafting.
              </p>
            </div>
            <Link href={`/studio/${bookId}/chapters/new`}>
              <Button size="sm" className="gap-2 mt-2 cursor-pointer">
                <Plus className="w-4 h-4" />
                <span>Write Chapter 1</span>
              </Button>
            </Link>
          </div>
        ) : (
          chapters.map((chapter, index) => {
            const isFirst = index === 0;
            const isLast = index === chapters.length - 1;

            return (
              <div
                key={chapter.id}
                className="p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left: Reordering buttons & Chapter number */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={isFirst || isReordering}
                      onClick={() => handleMove(index, "up")}
                      title="Move Up"
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast || isReordering}
                      onClick={() => handleMove(index, "down")}
                      title="Move Down"
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">
                        Chapter {chapter.chapter_number}
                      </span>
                      <h3 className="font-serif text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {chapter.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {chapter.estimated_read_minutes} min read
                      </span>
                      <span>·</span>
                      <span>{chapter.word_count.toLocaleString()} words</span>
                    </div>
                  </div>
                </div>

                {/* Right: Status & Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-none border-border/60">
                  {/* Status Indicator */}
                  {chapter.status === "published" && (
                    <Badge
                      variant="warm"
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-medium"
                    >
                      Published
                    </Badge>
                  )}

                  {chapter.status === "scheduled" && (
                    <Badge
                      variant="warm"
                      className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 text-xs font-medium flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>
                        {chapter.scheduled_for
                          ? `Scheduled: ${new Date(chapter.scheduled_for).toLocaleDateString()}`
                          : "Scheduled"}
                      </span>
                    </Badge>
                  )}

                  {chapter.status === "draft" && (
                    <Badge
                      variant="outline"
                      className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-medium"
                    >
                      Draft
                    </Badge>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/studio/${bookId}/chapters/${chapter.id}`}
                      className="p-2 rounded-lg border border-border/80 text-foreground hover:bg-secondary transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
                    >
                      <Edit className="w-3.5 h-3.5 text-primary" />
                      <span>Edit</span>
                    </Link>

                    <button
                      type="button"
                      disabled={deletingId === chapter.id}
                      onClick={() => handleDeleteClick(chapter)}
                      title="Delete Chapter"
                      className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Chapter Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!chapterToDelete}
        title="Delete Chapter"
        itemName={chapterToDelete?.title || "Chapter"}
        itemType="chapter"
        details={[
          "Chapter reading content will be permanently removed",
          "Reader bookmarks and highlights for this chapter will be cascade-deleted",
          "Story total chapter count and estimated reading time will be automatically updated",
        ]}
        isDeleting={!!deletingId}
        errorMessage={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setChapterToDelete(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
