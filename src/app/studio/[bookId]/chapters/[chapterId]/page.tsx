"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Feather,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  Save,
  Check,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import {
  deleteChapter,
  getAuthorChapter,
  getAuthorStory,
  updateChapter,
} from "@/lib/books/queries";
import { BookDetail, ChapterRow, ChapterStatus, ScheduleType } from "@/types/books";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function EditChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const bookId = params?.bookId as string;
  const chapterId = params?.chapterId as string;

  const [book, setBook] = React.useState<BookDetail | null>(null);
  const [chapter, setChapter] = React.useState<ChapterRow | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Form states
  const [title, setTitle] = React.useState("");
  const [chapterNumber, setChapterNumber] = React.useState<number>(1);
  const [slug, setSlug] = React.useState("");
  const [content, setContent] = React.useState("");

  // Scheduling states
  const [status, setStatus] = React.useState<ChapterStatus>("draft");
  const [scheduleType, setScheduleType] = React.useState<ScheduleType>("immediate");
  const [scheduledDateTime, setScheduledDateTime] = React.useState("");
  const [customDaysInterval, setCustomDaysInterval] = React.useState<number>(7);

  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user || !bookId || !chapterId) return;
    let isMounted = true;

    Promise.all([
      getAuthorStory(user.id, bookId),
      getAuthorChapter(user.id, chapterId),
    ])
      .then(([b, c]) => {
        if (!isMounted) return;
        setBook(b);
        if (c) {
          setChapter(c);
          setTitle(c.title);
          setChapterNumber(c.chapter_number);
          setSlug(c.slug);
          setContent(c.content);
          setStatus(c.status as ChapterStatus);
          setScheduleType(c.schedule_type as ScheduleType);

          if (c.scheduled_for) {
            setScheduledDateTime(
              new Date(c.scheduled_for).toISOString().slice(0, 16)
            );
          } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(18, 0, 0, 0);
            setScheduledDateTime(tomorrow.toISOString().slice(0, 16));
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading chapter for edit:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, bookId, chapterId]);

  const wordCount = React.useMemo(() => {
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  const estimatedReadMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const computedScheduledDate = React.useMemo(() => {
    if (status !== "scheduled") return null;
    if (scheduleType === "specific_date") {
      return scheduledDateTime ? new Date(scheduledDateTime) : null;
    }

    const result = new Date();
    if (scheduleType === "weekly") {
      result.setDate(result.getDate() + 7);
    } else if (scheduleType === "biweekly") {
      result.setDate(result.getDate() + 14);
    } else if (scheduleType === "monthly") {
      result.setMonth(result.getMonth() + 1);
    } else if (scheduleType === "custom") {
      result.setDate(result.getDate() + Math.max(1, customDaysInterval));
    }

    return result;
  }, [status, scheduleType, scheduledDateTime, customDaysInterval]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !chapterId) return;

    if (!title.trim()) {
      setErrorMessage("Title cannot be empty.");
      return;
    }

    if (!content.trim()) {
      setErrorMessage("Chapter content cannot be empty.");
      return;
    }

    let finalScheduledFor: string | null = null;
    if (status === "scheduled") {
      if (scheduleType === "specific_date") {
        if (!scheduledDateTime) {
          setErrorMessage("Please select a target release date and time.");
          return;
        }
        finalScheduledFor = new Date(scheduledDateTime).toISOString();
      } else if (computedScheduledDate) {
        finalScheduledFor = computedScheduledDate.toISOString();
      }
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await updateChapter(user.id, chapterId, {
        title: title.trim(),
        slug: slug.trim() || `chapter-${chapterNumber}`,
        chapter_number: chapterNumber,
        content: content.trim(),
        status,
        schedule_type: scheduleType,
        scheduled_for: finalScheduledFor,
      });

      if (updated) {
        setChapter(updated);
        setSuccessMessage("Chapter updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage("Failed to update chapter.");
      }
    } catch (err) {
      console.error("Error updating chapter:", err);
      setErrorMessage("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !chapterId) return;
    if (!window.confirm(`Delete chapter "${title}" permanently?`)) return;

    setIsDeleting(true);
    try {
      const ok = await deleteChapter(user.id, chapterId);
      if (ok) {
        router.push(`/studio/${bookId}/chapters`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto py-12 animate-pulse">
        <div className="h-6 w-32 bg-secondary rounded-lg" />
        <div className="h-96 bg-card rounded-2xl border border-border" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="text-center py-20 flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">Chapter not found.</p>
        <Link href={`/studio/${bookId}/chapters`}>
          <Button size="sm">Back to Chapters</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-24">
      {/* Back Link */}
      <Link
        href={`/studio/${bookId}/chapters`}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Chapter List</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border/70 pb-5">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <Feather className="w-4 h-4" />
          <span>Writer Studio · {book?.title}</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Edit Chapter {chapter.chapter_number}
        </h1>
        <p className="text-sm text-muted-foreground">
          Refine your story text and adjust release scheduling.
        </p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-8">
        {/* Chapter Header Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl border border-border bg-card">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
              Chapter Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background font-serif text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
              Chapter Number
            </label>
            <input
              type="number"
              min={1}
              required
              value={chapterNumber}
              onChange={(e) => setChapterNumber(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
        </div>

        {/* Writing Canvas */}
        <div className="flex flex-col gap-2 p-6 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between pb-2 border-b border-border/60 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-foreground/80">
              Story Prose Content
            </span>
            <div className="flex items-center gap-4 font-mono">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                {wordCount.toLocaleString()} words
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {estimatedReadMinutes} min read
              </span>
            </div>
          </div>

          <textarea
            rows={18}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 rounded-xl border border-input bg-background/50 font-serif text-base leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-y"
          />
        </div>

        {/* Release Scheduling & Publishing Controls */}
        <div className="flex flex-col gap-5 p-6 rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-lg font-bold text-foreground">
              Release Scheduling
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Publish Now */}
            <button
              type="button"
              onClick={() => {
                setStatus("published");
                setScheduleType("immediate");
              }}
              className={cn(
                "p-4 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer",
                status === "published"
                  ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
                  : "border-border hover:bg-secondary/50"
              )}
            >
              <span className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Published</span>
                {status === "published" && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Currently live or releases immediately upon saving.
              </span>
            </button>

            {/* 2. Schedule Release */}
            <button
              type="button"
              onClick={() => {
                setStatus("scheduled");
                if (scheduleType === "immediate") setScheduleType("weekly");
              }}
              className={cn(
                "p-4 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer",
                status === "scheduled"
                  ? "border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/20"
                  : "border-border hover:bg-secondary/50"
              )}
            >
              <span className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Schedule Release</span>
                {status === "scheduled" && (
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                )}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Automated release on a chosen date or cadence.
              </span>
            </button>

            {/* 3. Draft */}
            <button
              type="button"
              onClick={() => setStatus("draft")}
              className={cn(
                "p-4 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer",
                status === "draft"
                  ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20"
                  : "border-border hover:bg-secondary/50"
              )}
            >
              <span className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Draft</span>
                {status === "draft" && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Private in your studio until you choose to release.
              </span>
            </button>
          </div>

          {/* Cadence Selection */}
          {status === "scheduled" && (
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/80 flex flex-col gap-4 animate-in fade-in duration-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground/90">
                Choose Scheduling Cadence:
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {[
                  { key: "weekly", label: "Weekly (+7d)" },
                  { key: "biweekly", label: "Biweekly (+14d)" },
                  { key: "monthly", label: "Monthly (+30d)" },
                  { key: "specific_date", label: "Exact Date/Time" },
                  { key: "custom", label: "Custom Interval" },
                ].map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setScheduleType(c.key as ScheduleType)}
                    className={cn(
                      "p-2.5 rounded-lg border text-center font-medium transition-all cursor-pointer",
                      scheduleType === c.key
                        ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {scheduleType === "specific_date" && (
                <div className="flex flex-col gap-1.5 max-w-sm">
                  <label className="text-xs font-semibold text-foreground/80">
                    Pick Target Release Date & Time:
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>
              )}

              {scheduleType === "custom" && (
                <div className="flex flex-col gap-1.5 max-w-xs">
                  <label className="text-xs font-semibold text-foreground/80">
                    Release Every (Days):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={customDaysInterval}
                    onChange={(e) =>
                      setCustomDaysInterval(parseInt(e.target.value, 10) || 1)
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-input bg-card font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>
              )}

              {computedScheduledDate && (
                <div className="flex items-center gap-2 text-xs text-sky-700 dark:text-sky-300 bg-sky-500/10 p-3 rounded-lg font-medium">
                  <Calendar className="w-4 h-4 text-sky-500" />
                  <span>
                    Scheduled to go live on:{" "}
                    <strong>
                      {computedScheduledDate.toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 gap-2 cursor-pointer text-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? "Deleting..." : "Delete Chapter"}</span>
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/studio/${bookId}/chapters`)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="gap-2 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
