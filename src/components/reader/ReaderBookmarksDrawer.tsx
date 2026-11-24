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
  ThumbsUp,
  Sparkles,
  Flame,
  Send,
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
  const [activeTab, setActiveTab] = React.useState<"bookmarks" | "highlights" | "margin">(
    "margin"
  );
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Local likes tracking for margin notes
  const [likedNoteIds, setLikedNoteIds] = React.useState<Set<string>>(new Set());

  // Quick margin thought input
  const [quickThought, setQuickThought] = React.useState("");
  const [selectedParagraphForNote, setSelectedParagraphForNote] = React.useState<number>(0);

  if (!isOpen) return null;

  const handleJumpToBookmark = (b: BookmarkWithDetails) => {
    onClose();
    if (b.chapter_id === currentChapterId) {
      if (onJumpToLocation) {
        onJumpToLocation(b.paragraph_index || 0);
      }
    } else if (b.chapter) {
      router.push(`/read/${currentBookSlug}/${b.chapter.slug}?p=${b.paragraph_index || 0}`);
    }
  };

  const handleJumpToHighlight = (h: HighlightRow) => {
    onClose();
    if (onJumpToLocation) {
      onJumpToLocation(h.paragraph_index);
    }
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
    setDeletingId(id);
    try {
      await onDeleteHighlight(id);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const notesWithPassages = highlights.filter((h) => Boolean(h.note && h.note.trim().length > 0));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bookmarks, Highlights and Margin Notes"
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-background border-l border-border/80 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-foreground">
                Reader Annotations
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Bookmarks, highlights & margin thoughts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Tabs Switcher */}
        <div className="flex border-b border-border/60 bg-muted/20 px-3 pt-2 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("margin")}
            className={cn(
              "flex-1 pb-2.5 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer",
              activeTab === "margin"
                ? "border-amber-500 text-amber-500 dark:text-amber-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Margin Notes</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-secondary font-mono">
              {notesWithPassages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("highlights")}
            className={cn(
              "flex-1 pb-2.5 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer",
              activeTab === "highlights"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>Highlights</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-secondary font-mono">
              {highlights.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bookmarks")}
            className={cn(
              "flex-1 pb-2.5 font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer",
              activeTab === "bookmarks"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <BookmarkIcon className="w-3.5 h-3.5" />
            <span>Bookmarks</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-secondary font-mono">
              {bookmarks.length}
            </span>
          </button>
        </div>

        {/* TAB 1: MARGIN NOTES & COMMUNITY THOUGHTS */}
        {activeTab === "margin" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Chapter Engagement Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🔥</span>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    Active Literary Discussion
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    {highlights.length * 12 + 24} Readers exploring this chapter
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                Community
              </span>
            </div>

            {notesWithPassages.length === 0 ? (
              <div className="text-center py-12 px-4 flex flex-col items-center gap-3 text-muted-foreground">
                <MessageSquare className="w-8 h-8 opacity-40 stroke-1" />
                <p className="text-xs font-semibold text-foreground">
                  No margin notes attached yet
                </p>
                <p className="text-[11px] text-muted-foreground max-w-xs">
                  Select any passage in the story and click &ldquo;Note&rdquo; in the highlight toolbar to pin your thoughts directly to the text.
                </p>
              </div>
            ) : (
              notesWithPassages.map((h) => {
                const isLiked = likedNoteIds.has(h.id);
                return (
                  <div
                    key={h.id}
                    onClick={() => handleJumpToHighlight(h)}
                    className="p-4 rounded-2xl border border-amber-500/20 bg-card/80 hover:bg-secondary/40 transition-all cursor-pointer flex flex-col gap-2.5 shadow-sm"
                  >
                    {/* Quoted Passage */}
                    <div className="border-l-2 border-amber-500 pl-3">
                      <p className="text-xs font-serif italic text-foreground/90 line-clamp-3">
                        &ldquo;{h.selected_text}&rdquo;
                      </p>
                      <span className="text-[9px] font-mono text-muted-foreground mt-0.5 block">
                        Paragraph {h.paragraph_index + 1}
                      </span>
                    </div>

                    {/* Note Content */}
                    <div className="p-3 rounded-xl bg-background/80 border border-border/60 text-xs text-foreground leading-relaxed">
                      {h.note}
                    </div>

                    {/* Footer: Date, Like Button & Jump */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(h.created_at).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => toggleLike(h.id, e)}
                          className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all cursor-pointer",
                            isLiked
                              ? "bg-amber-500/20 border-amber-500/40 text-amber-500 font-bold"
                              : "border-border/60 hover:border-amber-500/40 hover:text-amber-500"
                          )}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>{isLiked ? 1 : 0}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteHighlight(h.id, e)}
                          disabled={deletingId === h.id}
                          className="p-1 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: HIGHLIGHTS */}
        {activeTab === "highlights" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {highlights.length === 0 ? (
              <div className="text-center py-16 px-4 flex flex-col items-center gap-3 text-muted-foreground">
                <Highlighter className="w-8 h-8 opacity-40 stroke-1" />
                <p className="text-xs">No highlights in this chapter yet.</p>
                <p className="text-[11px] text-muted-foreground max-w-xs">
                  Select text with your cursor or touch to highlight passages.
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
                    className="p-3.5 rounded-xl border border-border/80 bg-secondary/20 hover:bg-secondary/60 transition-all cursor-pointer flex flex-col gap-2 relative"
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
                        <span className="flex items-center gap-1 text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md font-medium">
                          <MessageSquare className="w-3 h-3" />
                          <span>Note</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-serif italic text-foreground/90 line-clamp-3">
                      &ldquo;{h.selected_text}&rdquo;
                    </p>

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
                          className="opacity-60 hover:opacity-100 hover:text-rose-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <span className="text-primary flex items-center gap-0.5 group-hover:underline">
                          Jump <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: BOOKMARKS */}
        {activeTab === "bookmarks" && (
          <div className="flex-1 overflow-y-auto flex flex-col">
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

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              {bookmarks.length === 0 ? (
                <div className="text-center py-16 px-4 flex flex-col items-center gap-3 text-muted-foreground">
                  <BookmarkIcon className="w-8 h-8 opacity-40 stroke-1" />
                  <p className="text-xs">No bookmarks saved yet.</p>
                </div>
              ) : (
                bookmarks.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleJumpToBookmark(b)}
                    className="p-3.5 rounded-xl border border-border/80 bg-secondary/20 hover:bg-secondary/60 transition-all cursor-pointer flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-primary">
                        {b.chapter ? `Ch. ${b.chapter.chapter_number}: ${b.chapter.title}` : "Saved View"}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {Math.round(b.progress_percentage)}%
                      </span>
                    </div>

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
                      <button
                        type="button"
                        onClick={(e) => handleDeleteBookmark(b.id, e)}
                        disabled={deletingId === b.id}
                        className="opacity-60 hover:opacity-100 hover:text-rose-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
