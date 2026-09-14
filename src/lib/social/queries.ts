import { createClient as createBrowserClient } from "@/lib/supabase/client";
import {
  BookReviewRow,
  BookReviewUpdate,
  BookReviewWithAuthor,
  CommentWithAuthor,
  CreateCommentInput,
  CreateReviewInput,
  RatingDistribution,
  ReportInput,
  UpdateReviewInput,
  NotificationRow,
} from "@/types/social";

/**
 * Fetch all reviews for a book with author profile details and like state.
 */
export async function getBookReviews(
  bookId: string,
  currentUserId?: string,
  sortBy: "popular" | "newest" | "highest" | "lowest" = "popular"
): Promise<BookReviewWithAuthor[]> {
  const supabase = createBrowserClient();

  let query = supabase
    .from("book_reviews")
    .select("*")
    .eq("book_id", bookId);

  switch (sortBy) {
    case "highest":
      query = query.order("rating", { ascending: false }).order("created_at", { ascending: false });
      break;
    case "lowest":
      query = query.order("rating", { ascending: true }).order("created_at", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "popular":
    default:
      query = query.order("likes_count", { ascending: false }).order("created_at", { ascending: false });
      break;
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    if (error) {
      console.warn("Notice fetching book reviews:", error.message);
    }
    return [];
  }

  // Fetch author profiles for all reviewers
  const userIds = [...new Set(data.map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map<
    string,
    { id: string; username: string | null; display_name: string | null; avatar_url: string | null }
  >();
  if (profiles) {
    profiles.forEach((p) => {
      profileMap.set(p.id, {
        id: p.id,
        username: p.username,
        display_name: p.full_name,
        avatar_url: p.avatar_url,
      });
    });
  }

  // If user is authenticated, query review IDs they have liked
  let likedReviewIds = new Set<string>();
  if (currentUserId && data.length > 0) {
    const reviewIds = data.map((r) => r.id);
    const { data: likes } = await supabase
      .from("review_likes")
      .select("review_id")
      .eq("user_id", currentUserId)
      .in("review_id", reviewIds);

    if (likes) {
      likedReviewIds = new Set(likes.map((l) => l.review_id));
    }
  }

  return data.map((review) => ({
    ...review,
    author_profile: profileMap.get(review.user_id) || null,
    isLikedByMe: likedReviewIds.has(review.id),
  }));
}

/**
 * Fetch the current user's review for a given book, if one exists.
 */
export async function getUserReviewForBook(
  bookId: string,
  userId: string
): Promise<BookReviewWithAuthor | null> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("book_reviews")
    .select("*")
    .eq("book_id", bookId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  return {
    ...data,
    author_profile: profile
      ? {
          id: profile.id,
          username: profile.username,
          display_name: profile.full_name,
          avatar_url: profile.avatar_url,
        }
      : null,
    isLikedByMe: false,
  };
}

/**
 * Compute the distribution of star ratings for a book.
 */
export async function getRatingDistribution(bookId: string): Promise<RatingDistribution> {
  const supabase = createBrowserClient();

  const { data: reviews } = await supabase
    .from("book_reviews")
    .select("rating")
    .eq("book_id", bookId);

  const dist = {
    5: { count: 0, percentage: 0 },
    4: { count: 0, percentage: 0 },
    3: { count: 0, percentage: 0 },
    2: { count: 0, percentage: 0 },
    1: { count: 0, percentage: 0 },
  };

  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: dist,
    };
  }

  let sum = 0;
  for (const r of reviews) {
    sum += r.rating;
    if (r.rating >= 1 && r.rating <= 5) {
      dist[r.rating as 1 | 2 | 3 | 4 | 5].count++;
    }
  }

  const total = reviews.length;
  for (let star = 1; star <= 5; star++) {
    const s = star as 1 | 2 | 3 | 4 | 5;
    dist[s].percentage = Math.round((dist[s].count / total) * 100);
  }

  return {
    averageRating: Number((sum / total).toFixed(2)),
    totalReviews: total,
    distribution: dist,
  };
}

import {
  validateReviewInput,
  validateCommentInput,
  validateReportInput,
} from "@/lib/security/validation";
import { RateLimitProfiles } from "@/lib/security/rate-limit";

/**
 * Create a new written review and rating for a book.
 * Validates rating bounds, text length, and rate limits submission.
 */
export async function createReview(
  bookId: string,
  userId: string,
  input: CreateReviewInput
): Promise<BookReviewRow | null> {
  // 1. Rate limiting
  const rateLimit = RateLimitProfiles.content(userId);
  if (!rateLimit.success) {
    throw new Error("Rate limit exceeded: You are posting reviews too quickly. Please wait a moment.");
  }

  // 2. Strict validation and sanitization
  const validated = validateReviewInput(input);

  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("book_reviews")
    .insert({
      book_id: bookId,
      user_id: userId,
      rating: validated.rating,
      title: validated.title,
      content: validated.content,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating review:", error);
    throw new Error(error.message || "Failed to submit review");
  }

  return data;
}

/**
 * Update an existing review.
 */
export async function updateReview(
  reviewId: string,
  userId: string,
  input: UpdateReviewInput
): Promise<BookReviewRow | null> {
  const supabase = createBrowserClient();

  const updatePayload: BookReviewUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (input.rating !== undefined) {
    updatePayload.rating = Math.min(5, Math.max(1, input.rating));
  }
  if (input.title !== undefined) {
    updatePayload.title = input.title.trim() || null;
  }
  if (input.content !== undefined) {
    updatePayload.content = input.content.trim();
  }

  const { data, error } = await supabase
    .from("book_reviews")
    .update(updatePayload)
    .eq("id", reviewId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating review:", error);
    throw new Error(error.message || "Failed to update review");
  }

  return data;
}

/**
 * Delete an existing review.
 */
export async function deleteReview(
  reviewId: string,
  userId: string
): Promise<boolean> {
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from("book_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting review:", error);
    return false;
  }

  return true;
}

/**
 * Toggle like/unlike on a review.
 */
export async function toggleReviewLike(
  reviewId: string,
  userId: string
): Promise<{ liked: boolean; likesCount: number }> {
  const supabase = createBrowserClient();

  // Check if like exists
  const { data: existingLike } = await supabase
    .from("review_likes")
    .select("id")
    .eq("review_id", reviewId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingLike) {
    // Unlike
    await supabase
      .from("review_likes")
      .delete()
      .eq("id", existingLike.id);

    // Fetch updated likes count
    const { data: review } = await supabase
      .from("book_reviews")
      .select("likes_count")
      .eq("id", reviewId)
      .single();

    return { liked: false, likesCount: review?.likes_count ?? 0 };
  } else {
    // Like
    await supabase.from("review_likes").insert({
      review_id: reviewId,
      user_id: userId,
    });

    // Notify review author if not self-liking
    const { data: targetReview } = await supabase
      .from("book_reviews")
      .select("user_id, book_id, books(title)")
      .eq("id", reviewId)
      .single();

    if (targetReview && targetReview.user_id !== userId) {
      await supabase.from("notifications").insert({
        user_id: targetReview.user_id,
        actor_id: userId,
        type: "review_like",
        title: "Review Liked",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message: `Someone appreciated your review on "${(targetReview.books as any)?.title || "a story"}".`,
        link: `/books/${targetReview.book_id}#review-${reviewId}`,
      });
    }

    const { data: review } = await supabase
      .from("book_reviews")
      .select("likes_count")
      .eq("id", reviewId)
      .single();

    return { liked: true, likesCount: review?.likes_count ?? 1 };
  }
}

/**
 * Fetch comments for a book or specific review.
 */
export async function getBookComments(
  bookId: string,
  reviewId?: string
): Promise<CommentWithAuthor[]> {
  const supabase = createBrowserClient();

  let query = supabase
    .from("comments")
    .select("*")
    .eq("book_id", bookId)
    .order("created_at", { ascending: true });

  if (reviewId) {
    query = query.eq("review_id", reviewId);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    if (error) {
      console.warn("Notice fetching comments:", error.message);
    }
    return [];
  }

  const userIds = [...new Set(data.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map<
    string,
    { id: string; username: string | null; display_name: string | null; avatar_url: string | null }
  >();
  if (profiles) {
    profiles.forEach((p) => {
      profileMap.set(p.id, {
        id: p.id,
        username: p.username,
        display_name: p.full_name,
        avatar_url: p.avatar_url,
      });
    });
  }

  return data.map((c) => ({
    ...c,
    author_profile: profileMap.get(c.user_id) || null,
  }));
}

/**
 * Add a comment to a book or review.
 * Enforces text length limits, sanitization, and rate limits.
 */
export async function createComment(
  bookId: string,
  userId: string,
  input: CreateCommentInput
): Promise<CommentWithAuthor | null> {
  const rateLimit = RateLimitProfiles.content(userId);
  if (!rateLimit.success) {
    throw new Error("Rate limit exceeded: You are commenting too quickly. Please wait a moment.");
  }

  const cleanContent = validateCommentInput(input.content);

  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("comments")
    .insert({
      book_id: bookId,
      user_id: userId,
      review_id: input.reviewId || null,
      parent_id: input.parentId || null,
      content: cleanContent,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating comment:", error);
    throw new Error(error?.message || "Failed to post comment");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  const commentWithAuthor: CommentWithAuthor = {
    ...data,
    author_profile: profile
      ? {
          id: profile.id,
          username: profile.username,
          display_name: profile.full_name,
          avatar_url: profile.avatar_url,
        }
      : null,
  };

  // Notify review author if this is a comment on someone's review
  if (input.reviewId) {
    const { data: targetReview } = await supabase
      .from("book_reviews")
      .select("user_id, books(title)")
      .eq("id", input.reviewId)
      .single();

    if (targetReview && targetReview.user_id !== userId) {
      await supabase.from("notifications").insert({
        user_id: targetReview.user_id,
        actor_id: userId,
        type: "review_comment",
        title: "New Comment on Your Review",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message: `Someone replied to your review on "${(targetReview.books as any)?.title || "a story"}".`,
        link: `/books/${bookId}#review-${input.reviewId}`,
      });
    }
  }

  return commentWithAuthor;
}

/**
 * Delete a comment owned by user.
 */
export async function deleteComment(
  commentId: string,
  userId: string
): Promise<boolean> {
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting comment:", error);
    return false;
  }

  return true;
}

/**
 * Check if the user is following an author and get author's follower count.
 */
export async function getAuthorFollowStatus(
  authorId: string,
  userId?: string
): Promise<{ isFollowing: boolean; followerCount: number }> {
  const supabase = createBrowserClient();

  // Get author follower count
  const { data: author } = await supabase
    .from("authors")
    .select("follower_count")
    .eq("id", authorId)
    .single();

  const followerCount = author?.follower_count || 0;

  if (!userId) {
    return { isFollowing: false, followerCount };
  }

  const { data: follow } = await supabase
    .from("author_follows")
    .select("id")
    .eq("author_id", authorId)
    .eq("user_id", userId)
    .maybeSingle();

  return {
    isFollowing: Boolean(follow),
    followerCount,
  };
}

/**
 * Toggle follow/unfollow an author.
 */
export async function toggleAuthorFollow(
  authorId: string,
  userId: string
): Promise<{ isFollowing: boolean; followerCount: number }> {
  const supabase = createBrowserClient();

  const { data: existingFollow } = await supabase
    .from("author_follows")
    .select("id")
    .eq("author_id", authorId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingFollow) {
    // Unfollow
    await supabase
      .from("author_follows")
      .delete()
      .eq("id", existingFollow.id);

    const { data: author } = await supabase
      .from("authors")
      .select("follower_count")
      .eq("id", authorId)
      .single();

    return { isFollowing: false, followerCount: author?.follower_count || 0 };
  } else {
    // Follow
    await supabase.from("author_follows").insert({
      author_id: authorId,
      user_id: userId,
    });

    // Notify author if author has a linked user_id
    const { data: authorData } = await supabase
      .from("authors")
      .select("user_id, name")
      .eq("id", authorId)
      .single();

    if (authorData?.user_id && authorData.user_id !== userId) {
      await supabase.from("notifications").insert({
        user_id: authorData.user_id,
        actor_id: userId,
        type: "author_follow",
        title: "New Follower",
        message: "A fellow reader began following your literary updates and releases.",
        link: `/studio`,
      });
    }

    const { data: author } = await supabase
      .from("authors")
      .select("follower_count")
      .eq("id", authorId)
      .single();

    return { isFollowing: true, followerCount: author?.follower_count || 1 };
  }
}

/**
 * Fetch notifications for user.
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 20
): Promise<NotificationRow[]> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data;
}

/**
 * Get count of unread notifications.
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = createBrowserClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    return 0;
  }

  return count || 0;
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  return !error;
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const supabase = createBrowserClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return !error;
}

/**
 * Submit a report for review/comment/user moderation.
 * Validates enum constraints, details length, and rate limits submission.
 */
export async function submitReport(
  reporterId: string,
  input: ReportInput
): Promise<boolean> {
  const rateLimit = RateLimitProfiles.content(reporterId);
  if (!rateLimit.success) {
    throw new Error("Rate limit exceeded: You have submitted too many reports recently. Please wait.");
  }

  const validated = validateReportInput(input);

  const supabase = createBrowserClient();

  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    target_type: validated.targetType,
    target_id: validated.targetId,
    reason: validated.reason,
    details: validated.details,
  });

  if (error) {
    console.error("Error submitting report:", error);
    throw new Error(error.message || "Failed to submit report");
  }

  return true;
}
