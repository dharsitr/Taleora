import { Tables, TablesInsert, TablesUpdate } from "./database.types";

export type BookReviewRow = Tables<"book_reviews">;
export type BookReviewInsert = TablesInsert<"book_reviews">;
export type BookReviewUpdate = TablesUpdate<"book_reviews">;

export type ReviewLikeRow = Tables<"review_likes">;
export type CommentRow = Tables<"comments">;
export type AuthorFollowRow = Tables<"author_follows">;
export type NotificationRow = Tables<"notifications">;
export type ReportRow = Tables<"reports">;

export type NotificationType =
  | "review_like"
  | "review_comment"
  | "book_comment"
  | "author_new_chapter"
  | "author_follow"
  | "system";

export type ReviewSortOption = "popular" | "newest" | "highest" | "lowest";

export type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate"
  | "spoiler"
  | "other";

export type ReportTargetType = "review" | "comment" | "user";

export interface BookReviewWithAuthor extends BookReviewRow {
  author_profile: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  isLikedByMe?: boolean;
}

export interface CommentWithAuthor extends CommentRow {
  author_profile: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface RatingDistribution {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: { count: number; percentage: number };
    4: { count: number; percentage: number };
    3: { count: number; percentage: number };
    2: { count: number; percentage: number };
    1: { count: number; percentage: number };
  };
}

export interface CreateReviewInput {
  rating: number;
  title?: string;
  content: string;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  content?: string;
}

export interface CreateCommentInput {
  content: string;
  reviewId?: string;
  parentId?: string;
}

export interface ReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}
