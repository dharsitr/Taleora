"use client";

import * as React from "react";
import {
  Star,
  MessageSquarePlus,
  ArrowUpDown,
  Loader2,
  Sparkles,
  Award,
} from "lucide-react";
import { BookReviewWithAuthor, RatingDistribution, ReviewSortOption } from "@/types/social";
import { useAuth } from "@/lib/auth/use-auth";
import {
  getBookReviews,
  getUserReviewForBook,
  getRatingDistribution,
} from "@/lib/social/queries";
import { Button } from "@/components/ui/Button";
import { ReviewCard } from "./ReviewCard";
import { WriteReviewModal } from "./WriteReviewModal";

interface BookReviewsSectionProps {
  bookId: string;
  bookTitle: string;
}

export function BookReviewsSection({ bookId, bookTitle }: BookReviewsSectionProps) {
  const { user } = useAuth();

  const [reviews, setReviews] = React.useState<BookReviewWithAuthor[]>([]);
  const [userReview, setUserReview] = React.useState<BookReviewWithAuthor | null>(null);
  const [distribution, setDistribution] = React.useState<RatingDistribution>({
    averageRating: 0,
    totalReviews: 0,
    distribution: {
      5: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      1: { count: 0, percentage: 0 },
    },
  });
  const [sortBy, setSortBy] = React.useState<ReviewSortOption>("popular");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Review modal state
  const [isWriteModalOpen, setIsWriteModalOpen] = React.useState<boolean>(false);
  const [editingReview, setEditingReview] = React.useState<BookReviewWithAuthor | null>(null);

  // Load reviews, user review, and distribution
  React.useEffect(() => {
    let isMounted = true;
    Promise.all([
      getBookReviews(bookId, user?.id, sortBy),
      user ? getUserReviewForBook(bookId, user.id) : Promise.resolve(null),
      getRatingDistribution(bookId),
    ])
      .then(([reviewsData, userReviewData, distData]) => {
        if (isMounted) {
          setReviews(reviewsData);
          setUserReview(userReviewData);
          setDistribution(distData);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load book reviews:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [bookId, sortBy, user]);

  const refreshData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [reviewsData, userReviewData, distData] = await Promise.all([
        getBookReviews(bookId, user?.id, sortBy),
        user ? getUserReviewForBook(bookId, user.id) : Promise.resolve(null),
        getRatingDistribution(bookId),
      ]);

      setReviews(reviewsData);
      setUserReview(userReviewData);
      setDistribution(distData);
    } catch (err) {
      console.error("Failed to refresh book reviews:", err);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, sortBy, user]);

  // Handle write review CTA click
  const handleOpenWriteModal = () => {
    setEditingReview(null);
    setIsWriteModalOpen(true);
  };

  // Handle edit review click
  const handleEditReview = (review: BookReviewWithAuthor) => {
    setEditingReview(review);
    setIsWriteModalOpen(true);
  };

  // Handle successful submission/edit
  const handleReviewSaved = () => {
    refreshData();
  };

  // Handle review deletion
  const handleReviewDeleted = (deletedId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== deletedId));
    if (userReview?.id === deletedId) {
      setUserReview(null);
    }
    // Refresh distribution
    getRatingDistribution(bookId).then(setDistribution).catch(console.error);
  };

  // Filter out user review from general list if it's already shown in the user's pinned box
  const otherReviews = userReview
    ? reviews.filter((r) => r.id !== userReview.id)
    : reviews;

  return (
    <section className="mt-8 pt-8 border-t border-border flex flex-col gap-6" id="reviews">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community & Discussion</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mt-1">
            Ratings & Reviews
          </h3>
        </div>

        {/* CTA Button */}
        <div>
          {userReview ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditReview(userReview)}
              className="gap-2 cursor-pointer border-primary/40 text-primary hover:bg-primary/10"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Edit Your Review</span>
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenWriteModal}
              className="gap-2 cursor-pointer shadow-sm"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Write a Review</span>
            </Button>
          )}
        </div>
      </div>

      {/* Ratings Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-xs">
        {/* Average Rating Summary */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-border/70">
          <div className="font-serif text-5xl font-extrabold text-foreground tracking-tight">
            {distribution.averageRating > 0
              ? distribution.averageRating.toFixed(1)
              : "—"}
          </div>

          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(distribution.averageRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Based on{" "}
            <span className="font-semibold text-foreground font-mono">
              {distribution.totalReviews}
            </span>{" "}
            {distribution.totalReviews === 1 ? "rating" : "ratings"}
          </p>

          {distribution.totalReviews >= 5 && distribution.averageRating >= 4.5 && (
            <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-[11px] font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Reader Favorite</span>
            </div>
          )}
        </div>

        {/* 5-Star Distribution Bars */}
        <div className="md:col-span-8 flex flex-col justify-center gap-2.5 py-2">
          {([5, 4, 3, 2, 1] as const).map((stars) => {
            const count = distribution.distribution[stars]?.count || 0;
            const percentage = distribution.distribution[stars]?.percentage || 0;

            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-muted-foreground font-medium flex items-center justify-end gap-1">
                  <span>{stars}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>

                {/* Progress bar container */}
                <div className="flex-1 h-2.5 rounded-full bg-secondary/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-12 text-right text-muted-foreground font-mono text-[11px]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pinned User Review (if exists) */}
      {userReview && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>Your Submitted Review</span>
          </div>
          <ReviewCard
            review={userReview}
            bookTitle={bookTitle}
            onEdit={handleEditReview}
            onDeleted={handleReviewDeleted}
            isCurrentUserReview={true}
          />
        </div>
      )}

      {/* Toolbar & Sort Options */}
      <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
        <h4 className="font-serif text-lg font-bold text-foreground">
          Community Reviews ({distribution.totalReviews})
        </h4>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ReviewSortOption)}
            className="text-xs bg-secondary/60 border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            aria-label="Sort reviews by"
          >
            <option value="popular">Most Helpful</option>
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs">Loading community reviews...</span>
        </div>
      ) : otherReviews.length === 0 && !userReview ? (
        <div className="p-8 rounded-2xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <MessageSquarePlus className="w-6 h-6" />
          </div>
          <h4 className="font-serif text-lg font-bold text-foreground">
            No reviews yet
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm">
            Be the first to share your thoughts, impressions, and star rating for{" "}
            <span className="font-semibold text-foreground">&ldquo;{bookTitle}&rdquo;</span>.
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={handleOpenWriteModal}
            className="mt-2 gap-2 cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Write the First Review</span>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {otherReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              bookTitle={bookTitle}
              onEdit={handleEditReview}
              onDeleted={handleReviewDeleted}
            />
          ))}
        </div>
      )}

      {/* Write/Edit Review Modal */}
      <WriteReviewModal
        isOpen={isWriteModalOpen}
        onClose={() => {
          setIsWriteModalOpen(false);
          setEditingReview(null);
        }}
        bookId={bookId}
        bookTitle={bookTitle}
        existingReview={editingReview}
        onReviewSaved={handleReviewSaved}
      />
    </section>
  );
}
