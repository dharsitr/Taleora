"use client";

import * as React from "react";
import Link from "next/link";
import { MessageSquare, Send, Trash2, Flag, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import { CommentWithAuthor } from "@/types/social";
import { getBookComments, createComment, deleteComment } from "@/lib/social/queries";
import { Button } from "@/components/ui/Button";
import { ReportModal } from "./ReportModal";

interface ReviewCommentsProps {
  reviewId: string;
  bookId: string;
  onCommentCountChange?: (delta: number) => void;
}

export function ReviewComments({
  reviewId,
  bookId,
  onCommentCountChange,
}: ReviewCommentsProps) {
  const { user } = useAuth();

  const [comments, setComments] = React.useState<CommentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [content, setContent] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Moderation report modal state
  const [reportingCommentId, setReportingCommentId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    getBookComments(bookId, reviewId)
      .then((data) => {
        if (isMounted) {
          setComments(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load review comments:", err);
        if (isMounted) {
          setError("Unable to load comments. Please try again.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [bookId, reviewId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmed = content.trim();
    if (!trimmed || trimmed.length < 2) {
      setError("Comment must be at least 2 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const newComment = await createComment(bookId, user.id, {
        reviewId,
        content: trimmed,
      });

      if (newComment) {
        setComments((prev) => [newComment, ...prev]);
        setContent("");
        onCommentCountChange?.(1);
      }
    } catch (err: unknown) {
      console.error("Failed to submit comment:", err);
      setError(err instanceof Error ? err.message : "Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      setDeletingId(commentId);
      await deleteComment(commentId, user.id);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentCountChange?.(-1);
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert("Failed to delete comment. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="pt-4 mt-4 border-t border-border/60 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <MessageSquare className="w-3.5 h-3.5" />
        <span>Discussion ({comments.length})</span>
      </div>

      {/* Post comment input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="relative">
            <textarea
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Join the discussion... share your thoughts on this review"
              maxLength={1000}
              className="w-full text-xs sm:text-sm rounded-lg border border-border bg-secondary/30 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {content.length}/1000 characters
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !content.trim()}
              className="gap-1.5 h-8 text-xs cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Post Comment</span>
            </Button>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </form>
      ) : (
        <div className="p-3 rounded-lg border border-border/70 bg-secondary/20 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Sign in to join the conversation and reply to this review.</span>
          <Link href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}>
            <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer">
              Sign In
            </Button>
          </Link>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground gap-2 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Loading replies...</span>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">
          No replies yet. Be the first to join the conversation!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => {
            const commenterName =
              comment.author_profile?.display_name ||
              comment.author_profile?.username ||
              "Reader";
            const commenterInitials = commenterName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const isOwner = user?.id === comment.user_id;

            return (
              <div
                key={comment.id}
                className="group p-3 rounded-lg bg-secondary/25 border border-border/50 flex gap-3 text-xs"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                  {commenterInitials}
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {commenterName}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        • {formatDate(comment.created_at)}
                      </span>
                    </div>

                    {/* Actions: delete own or report */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {isOwner ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          disabled={deletingId === comment.id}
                          className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete comment"
                          aria-label="Delete comment"
                        >
                          {deletingId === comment.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReportingCommentId(comment.id)}
                          className="p-1 rounded text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                          title="Report comment"
                          aria-label="Report comment"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-foreground/90 whitespace-pre-line leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {reportingCommentId && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportingCommentId(null)}
          targetType="comment"
          targetId={reportingCommentId}
          targetTitle="Comment"
        />
      )}
    </div>
  );
}
