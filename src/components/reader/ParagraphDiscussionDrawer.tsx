"use client";

import * as React from "react";
import { MessageSquare, Send, Sparkles, Pin, Flame, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface ParagraphComment {
  id: string;
  paragraphIndex: number;
  authorName: string;
  authorRole?: "author" | "patron" | "reader";
  content: string;
  timestamp: string;
  likes: number;
  isPinned?: boolean;
}

interface ParagraphDiscussionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapterNumber: number;
  paragraphIndex: number | null;
  paragraphSnippet?: string;
  currentUserName?: string;
}

export function ParagraphDiscussionDrawer({
  isOpen,
  onClose,
  chapterNumber,
  paragraphIndex,
  paragraphSnippet,
  currentUserName = "Reader",
}: ParagraphDiscussionDrawerProps) {
  const [commentList, setCommentList] = React.useState<ParagraphComment[]>([]);
  const [inputVal, setInputVal] = React.useState("");

  // Load live discussions from localStorage storage key for the current chapter/paragraph
  React.useEffect(() => {
    if (paragraphIndex === null) {
      setCommentList([]);
      return;
    }

    try {
      const stored = localStorage.getItem(`taleora-para-comments-${chapterNumber}-${paragraphIndex}`);
      if (stored) {
        setCommentList(JSON.parse(stored));
      } else {
        setCommentList([]);
      }
    } catch {
      setCommentList([]);
    }
  }, [chapterNumber, paragraphIndex]);

  if (!isOpen || paragraphIndex === null) return null;

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const newComment: ParagraphComment = {
      id: `c_${Date.now()}`,
      paragraphIndex,
      authorName: currentUserName,
      authorRole: "reader",
      content: inputVal.trim(),
      timestamp: "Just now",
      likes: 0,
    };

    const updated = [...commentList, newComment];
    setCommentList(updated);
    setInputVal("");

    try {
      localStorage.setItem(
        `taleora-para-comments-${chapterNumber}-${paragraphIndex}`,
        JSON.stringify(updated)
      );
    } catch {
      // Ignore write errors
    }
  };

  const handleLike = (commentId: string) => {
    const updated = commentList.map((c) =>
      c.id === commentId ? { ...c, likes: c.likes + 1 } : c
    );
    setCommentList(updated);
    try {
      localStorage.setItem(
        `taleora-para-comments-${chapterNumber}-${paragraphIndex}`,
        JSON.stringify(updated)
      );
    } catch {
      // Ignore write errors
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-background border-l border-border/80 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/70 flex items-center justify-between bg-card/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-foreground">
                Margin Discussions
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Ch. {chapterNumber} · Paragraph #{paragraphIndex + 1}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Paragraph Context Card */}
        {paragraphSnippet && (
          <div className="p-3.5 mx-4 mt-3 rounded-xl bg-secondary/50 border border-border/70 text-xs italic font-serif text-foreground/80 line-clamp-3">
            &ldquo;{paragraphSnippet}&rdquo;
          </div>
        )}

        {/* Discussion Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
          {commentList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground gap-2">
              <Sparkles className="w-6 h-6 text-amber-500/50" />
              <p className="text-xs">No comments on this paragraph yet.</p>
              <p className="text-[10px] opacity-70">Share your thoughts on this passage.</p>
            </div>
          ) : (
            commentList.map((comm) => (
              <div
                key={comm.id}
                className={cn(
                  "p-3 rounded-xl border text-xs transition-all",
                  comm.isPinned
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-card border-border/80"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-[11px]">
                      {comm.authorName}
                    </span>
                    {comm.authorRole === "author" && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-primary/15 border border-primary/30 text-primary text-[9px] font-bold uppercase">
                        <Pin className="w-2.5 h-2.5" /> Author
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{comm.timestamp}</span>
                </div>

                <p className="text-foreground/90 leading-relaxed font-sans">{comm.content}</p>

                <div className="mt-2.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => handleLike(comm.id)}
                    className="flex items-center gap-1 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Flame className="w-3 h-3" />
                    <span>{comm.likes}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handlePost} className="p-3.5 border-t border-border bg-card flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Add to the margin discussion..."
            className="flex-1 px-3 py-2 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <Button type="submit" size="sm" disabled={!inputVal.trim()} className="gap-1 cursor-pointer">
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Share</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
