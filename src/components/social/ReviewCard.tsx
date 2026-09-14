"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Heart,
  MessageSquare,
  MoreVertical,
  Edit2,
  Trash2,
  Flag,
  Loader2,
  User,
} from "lucide-react";
import { BookReviewWithAuthor } from "@/types/social";
import { useAuth } from "@/lib/auth/use-auth";
import { toggleReviewLike, deleteReview } from "@/lib/social/queries";
import { ReviewComments } from "./ReviewComments";
import { ReportModal } from "./ReportModal";

interface ReviewCardProps {
  review: BookReviewWithAuthor;
  bookTitle?: string;
  onEdit?: (review: BookReviewWithAuthor) => void;
  onDeleted?: (reviewId: string) => void;
  isCurrentUserReview?: boolean;
}

export function ReviewCard({
  review,
  bookTitle,
  onEdit,
  onDeleted,
  isCurrentUserReview = false,
}: ReviewCardProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [optimisticLiked, setOptimisticLiked] = React.useState<boolean | null>(null);
  const [likesDelta, setLikesDelta] = React.useState<number>(0);
  const [commentsDelta, setCommentsDelta] = React.useState<number>(0);
  const [showComments, setShowComments] = React.useState<boolean>(false);
  const [isLiking, setIsLiking] = React.useState<boolean>(false);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
  const [showMenu, setShowMenu] = React.useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = React.useState<boolean>(false);

  const menuRef = React.useRef<HTMLDivElement>(null);

  const isLiked = optimisticLiked !== null ? optimisticLiked : (review.isLikedByMe ?? false);
  const likesCount = Math.max(0, (review.likes_count ?? 0) + likesDelta);
  const commentsCount = Math.max(0, (review.comments_count ?? 0) + commentsDelta);

  // Close dropdown menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const isOwner = user?.id === review.user_id;

  const handleLikeToggle = async () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (isLiking) return;

    setIsLiking(true);
    const prevLiked = isLiked;
    const nextLiked = !prevLiked;

    // Optimistic toggle
    setOptimisticLiked(nextLiked);
    setLikesDelta((prev) => prev + (nextLiked ? 1 : -1));

    try {
      const result = await toggleReviewLike(review.id, user.id);
      setOptimisticLiked(result.liked);
      setLikesDelta(result.likesCount - (review.likes_count ?? 0));
    } catch (err) {
      console.error("Failed to toggle review like:", err);
      // Revert
      setOptimisticLiked(prevLiked);
      setLikesDelta((prev) => prev + (nextLiked ? -1 : 1));
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setShowMenu(false);
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteReview(review.id, user.id);
      onDeleted?.(review.id);
    } catch (err) {
      console.error("Failed to delete review:", err);
      alert("Failed to delete review. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const reviewerName =
    review.author_profile?.display_name ||
    review.author_profile?.username ||
    "Taleora Reader";
  const initials = reviewerName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formattedDate = new Date(review.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article
      className={`rounded-xl border bg-card p-5 sm:p-6 transition-all ${
        isCurrentUserReview
          ? "border-primary/40 bg-primary/[0.02] ring-1 ring-primary/20 shadow-sm"
          : "border-border hover:border-border/80"
      }`}
    >
      {/* Review Header */}
      <div className="flex items-start justify-between gap-4">
        {/* Author info & Rating */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/25 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {initials || <User className="w-4 h-4" />}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground">
                {reviewerName}
              </span>
              {isOwner && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary/15 text-primary border border-primary/25">
                  You
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              {/* Star Rating display */}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                • {formattedDate}
              </span>
              {review.updated_at && review.updated_at !== review.created_at && (
                <span className="text-[10px] text-muted-foreground/70 italic">
                  (edited)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Options Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Review options"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-36 rounded-lg border border-border bg-card p-1 shadow-lg z-20 animate-in fade-in zoom-in-95 duration-100">
              {isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit?.(review);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary rounded-md transition-colors cursor-pointer text-left"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Review</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer text-left"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Delete Review</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setIsReportModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors cursor-pointer text-left"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report Review</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Body */}
      <div className="mt-3.5 flex flex-col gap-1.5">
        {review.title && (
          <h4 className="font-serif font-bold text-base text-foreground">
            {review.title}
          </h4>
        )}
        <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">
          {review.content}
        </p>
      </div>

      {/* Footer / Interaction Bar */}
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleLikeToggle}
            disabled={isLiking}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              isLiked
                ? "bg-rose-500/10 text-rose-500 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            aria-label={isLiked ? "Unlike review" : "Like review"}
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                isLiked ? "fill-rose-500 text-rose-500" : ""
              }`}
            />
            <span>{likesCount > 0 ? likesCount : "Helpful"}</span>
          </button>

          {/* Comments Toggle */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              showComments
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            aria-expanded={showComments}
            aria-label="Toggle comments"
          >
            <MessageSquare className="w-4 h-4" />
            <span>
              {commentsCount > 0
                ? `${commentsCount} ${commentsCount === 1 ? "Comment" : "Comments"}`
                : "Discuss"}
            </span>
          </button>
        </div>

        {/* Report link if not owner */}
        {!isOwner && (
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Flag className="w-3 h-3" />
            <span>Report</span>
          </button>
        )}
      </div>

      {/* Collapsible Discussion Section */}
      {showComments && (
        <ReviewComments
          reviewId={review.id}
          bookId={review.book_id}
          onCommentCountChange={(delta) => {
            setCommentsDelta((prev) => prev + delta);
          }}
        />
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <ReportModal
          isOpen={true}
          onClose={() => setIsReportModalOpen(false)}
          targetType="review"
          targetId={review.id}
          targetTitle={review.title ? `"${review.title}"` : bookTitle ? `Review on "${bookTitle}"` : "Review"}
        />
      )}
    </article>
  );
}
