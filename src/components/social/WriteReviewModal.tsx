"use client";

import * as React from "react";
import { X, Star, AlertCircle, Loader2 } from "lucide-react";
import { StarRatingInput } from "./StarRatingInput";
import { createReview, updateReview } from "@/lib/social/queries";
import { BookReviewRow } from "@/types/social";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/use-auth";

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle: string;
  userId?: string;
  existingReview?: BookReviewRow | null;
  onReviewSaved: (review: BookReviewRow) => void;
}

interface WriteReviewFormProps {
  onClose: () => void;
  bookId: string;
  bookTitle: string;
  userId: string;
  existingReview?: BookReviewRow | null;
  onReviewSaved: (review: BookReviewRow) => void;
}

function WriteReviewForm({
  onClose,
  bookId,
  bookTitle,
  userId,
  existingReview,
  onReviewSaved,
}: WriteReviewFormProps) {
  const [rating, setRating] = React.useState<number>(existingReview?.rating || 5);
  const [title, setTitle] = React.useState<string>(existingReview?.title || "");
  const [content, setContent] = React.useState<string>(existingReview?.content || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      setErrorMessage("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (content.trim().length < 10) {
      setErrorMessage("Please write at least 10 characters in your review.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (existingReview) {
        const updated = await updateReview(existingReview.id, userId, {
          rating,
          title,
          content,
        });
        if (updated) {
          onReviewSaved(updated);
          onClose();
        }
      } else {
        const created = await createReview(bookId, userId, {
          rating,
          title,
          content,
        });
        if (created) {
          onReviewSaved(created);
          onClose();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save review";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex flex-col">
          <h3 className="font-serif text-lg font-bold text-foreground">
            {existingReview ? "Edit Your Review" : "Write a Literary Review"}
          </h3>
          <p className="text-xs text-muted-foreground truncate max-w-sm">
            For &ldquo;{bookTitle}&rdquo;
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Star Rating Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Your Overall Rating</span>
          </label>
          <StarRatingInput value={rating} onChange={setRating} />
        </div>

        {/* Headline / Title */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="review-title"
            className="text-xs font-semibold text-foreground uppercase tracking-wider"
          >
            Review Headline (Optional)
          </label>
          <input
            id="review-title"
            type="text"
            placeholder="e.g., A mesmerizing voyage through forgotten stars"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="w-full text-xs sm:text-sm rounded-lg border border-border bg-secondary/30 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        {/* Written Body */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="review-content"
              className="text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Written Review *
            </label>
            <span className="text-[10px] text-muted-foreground">
              {content.length}/3000 (min 10)
            </span>
          </div>
          <textarea
            id="review-content"
            rows={5}
            required
            placeholder="What captivated you? What themes, pacing, or characters stood out to you as a reader?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={3000}
            className="w-full text-xs sm:text-sm rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-y"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer text-xs"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={isSubmitting || content.trim().length < 10}
            className="cursor-pointer text-xs gap-1.5 shadow-sm"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{existingReview ? "Save Changes" : "Submit Review"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export function WriteReviewModal({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  userId,
  existingReview,
  onReviewSaved,
}: WriteReviewModalProps) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  if (!isOpen || !effectiveUserId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in">
      <WriteReviewForm
        key={existingReview?.id ?? "new-review"}
        onClose={onClose}
        bookId={bookId}
        bookTitle={bookTitle}
        userId={effectiveUserId}
        existingReview={existingReview}
        onReviewSaved={onReviewSaved}
      />
    </div>
  );
}
