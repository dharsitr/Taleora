"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Bookmark as BookmarkIcon,
  Highlighter,
  Trash2,
  ExternalLink,
  MessageSquare,
  Clock,
  PlusCircle,
} from "lucide-react";
import { BookmarkWithDetails, HighlightColor, HighlightRow } from "@/types/books";
import { HIGHLIGHT_COLORS } from "@/lib/books/highlights";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ReaderBookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkWithDetails[];
  highlights: HighlightRow[];
  currentBookSlug: string;
  currentChapterId: string;
  onDeleteBookmark: (id: string) => Promise<void>;
  onDeleteHighlight: (id: string) => Promise<void>;
  onSelectHighlight: (h: HighlightRow) => void;
  onAddBookmarkNow: () => void;
  isBookmarking?: boolean;
  onJumpToLocation?: (paragraphIndex: number) => void;
}

export function ReaderBookmarksDrawer({
  isOpen,
  onClose,
  bookmarks,
  highlights,
  currentBookSlug,
  currentChapterId,
  onDeleteBookmark,
  onDeleteHighlight,
  onSelectHighlight,
  onAddBookmarkNow,
  isBookmarking = false,
  onJumpToLocation,
}: ReaderBookmarksDrawerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"bookmarks" | "highlights">(
    "bookmarks"
  );
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleJumpToBookmark = (b: BookmarkWithDetails) => {
    onClose();
    if (b.chapter_id === currentChapterId) {
      if (onJumpToLocation) {
        onJumpToLocation(b.paragraph_index);
      }
      setTimeout(() => {
        const el = document.getElementById(`p-${b.paragraph_index}`);
        if (el) {
          el.classList.add("bg-primary/20", "rounded-md", "transition-colors");
          setTimeout(() => el.classList.remove("bg-primary/20"), 2200);
        }
      }, 150);
    } else {
      // Different chapter: navigate with query param
      router.push(`/read/${currentBookSlug}/${b.chapter.slug}?p=${b.paragraph_index}`);
    }
  };

  const handleJumpToHighlight = (h: HighlightRow) => {
    onClose();
    if (onJumpToLocation) {
      onJumpToLocation(h.paragraph_index);
    }
    setTimeout(() => {
      const el = document.getElementById(`p-${h.paragraph_index}`);
      if (el) {
        el.classList.add("ring-2", "ring-primary/50", "rounded-md");
        setTimeout(() => el.classList.remove("ring-2", "ring-primary/50"), 2200);
      }
    }, 150);
    onSelectHighlight(h);
  };


  const handleDeleteBookmark = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await onDeleteBookmark(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteHighlight = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Remove this highlight?")) return;
    setDeletingId(id);
    try {
      await onDeleteHighlight(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-annotations-title"
      className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-2">
            <BookmarkIcon className="w-4 h-4 text-primary" />
            <h2
              id="drawer-annotations-title"
              className="font-serif font-bold text-sm text-foreground"
            >
              Annotations & Marks
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border bg-muted/30 px-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("bookmarks")}
            className={cn(
              "flex-1 pb-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer",
              activeTab === "bookmarks"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <BookmarkIcon className="w-3.5 h-3.5" />
            <span>Bookmarks</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-secondary font-mono">
              {bookmarks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("highlights")}
            className={cn(
              "flex-1 pb-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer",
              activeTab === "highlights"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>Highlights</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-secondary font-mono">
              {highlights.length}
            </span>
          </button>
        </div>

        {/* Action button at top */}
        {activeTab === "bookmarks" && (
          <div className="p-3 border-b border-border/60 bg-card">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddBookmarkNow}
              disabled={isBookmarking}
              className="w-full gap-2 text-xs cursor-pointer border-dashed"
            >
              <PlusCircle className="w-3.5 h-3.5 text-primary" />
              <span>
                {isBookmarking ? "Saving bookmark..." : "Bookmark Current View"}
              </span>
            </Button>
          </div>
        )}

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === "bookmarks" ? (
            bookmarks.length === 0 ? (
              <div className="text-center py-16 px-4 flex flex-col items-center gap-3 text-muted-foreground">
                <BookmarkIcon className="w-8 h-8 opacity-40 stroke-1" />
                <p className="text-xs">No bookmarks saved yet for this story.</p>
                <p className="text-[11px] text-muted-foreground/80 max-w-xs">
                  Tap &ldquo;Bookmark Current View&rdquo; above or use the bookmark icon in the header to remember your spot.
                </p>
              </div>
            ) : (
              bookmarks.map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleJumpToBookmark(b)}
                  className="group p-3.5 rounded-xl border border-border/80 bg-secondary/20 hover:bg-secondary/60 transition-all cursor-pointer flex flex-col gap-2 relative"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-primary">
                      {b.chapter ? `Ch. ${b.chapter.chapter_number}: ${b.chapter.title}` : "Saved Passage"}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {Math.round(b.progress_percentage)}%
                    </span>
                  </div>

                  {b.label && (
                    <div className="text-xs font-bold text-foreground">
                      {b.label}
                    </div>
                  )}

                  {b.snippet && (
                    <p className="text-xs font-serif italic text-muted-foreground line-clamp-2">
                      &ldquo;{b.snippet}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(b.created_at).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteBookmark(b.id, e)}
                        disabled={deletingId === b.id}
                        title="Delete bookmark"
                        className="opacity-60 hover:opacity-100 hover:text-rose-500 p-1 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="text-primary flex items-center gap-0.5 group-hover:underline">
                        Jump <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : highlights.length === 0 ? (
            <div className="text-center py-16 px-4 flex flex-col items-center gap-3 text-muted-foreground">
              <Highlighter className="w-8 h-8 opacity-40 stroke-1" />
              <p className="text-xs">No highlights in this chapter yet.</p>
              <p className="text-[11px] text-muted-foreground/80 max-w-xs">
                Select any text in the story to highlight passages and save notes.
              </p>
            </div>
          ) : (
            highlights.map((h) => {
              const colorCfg =
                HIGHLIGHT_COLORS[h.color as HighlightColor] ||
                HIGHLIGHT_COLORS.amber;
              return (
                <div
                  key={h.id}
                  onClick={() => handleJumpToHighlight(h)}
                  className="group p-3.5 rounded-xl border border-border/80 bg-secondary/20 hover:bg-secondary/60 transition-all cursor-pointer flex flex-col gap-2 relative"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn("w-2.5 h-2.5 rounded-full", colorCfg.previewBg)}
                      />
                      <span className="font-semibold text-muted-foreground">
                        {colorCfg.name}
                      </span>
                    </div>
                    {h.note && (
                      <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-md font-medium">
                        <MessageSquare className="w-3 h-3" />
                        <span>Note</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-serif italic text-foreground/90 line-clamp-3">
                    &ldquo;{h.selected_text}&rdquo;
                  </p>

                  {h.note && (
                    <div className="p-2 rounded-lg bg-background/80 border border-border/60 text-xs text-foreground/80 leading-snug">
                      {h.note}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(h.created_at).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteHighlight(h.id, e)}
                        disabled={deletingId === h.id}
                        title="Delete highlight"
                        className="opacity-60 hover:opacity-100 hover:text-rose-500 p-1 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="text-primary flex items-center gap-0.5 group-hover:underline">
                        View <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
