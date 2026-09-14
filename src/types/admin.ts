import type { Database } from "@/types/database.types";

export type ProfileRole = "user" | "moderator" | "admin";
export type ModerationStatus = "approved" | "flagged" | "hidden" | "removed";
export type ReportTargetType = "review" | "comment" | "user" | "book" | "chapter" | "author";
export type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";
export type ReportReason = "spam" | "harassment" | "inappropriate" | "spoiler" | "other";

export type AdminAuditLogRow = Database["public"]["Tables"]["admin_audit_logs"]["Row"];
export type AdminAuditLogInsert = Database["public"]["Tables"]["admin_audit_logs"]["Insert"];

export interface AdminOverviewMetrics {
  totalUsers: number;
  totalBooks: number;
  totalAuthors: number;
  pendingReports: number;
  suspendedBooks: number;
  suspendedUsers: number;
  flaggedReviews: number;
  auditActions24h: number;
}

export interface AdminReportItem {
  id: string;
  reporter_id: string;
  reporter_username: string | null;
  reporter_avatar: string | null;
  target_type: ReportTargetType;
  target_id: string;
  target_title?: string | null;
  target_preview?: string | null;
  reason: ReportReason | string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolver_username?: string | null;
  resolution_notes: string | null;
  action_taken: string | null;
}

export interface AdminUserItem {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: ProfileRole;
  is_suspended: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
  created_at: string;
  streak_days: number;
  is_author: boolean;
  author_id?: string | null;
  author_verified?: boolean;
}

export interface AdminBookItem {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  status: string;
  featured: boolean;
  trending: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
  moderated_at: string | null;
  total_chapters: number;
  author_id: string;
  author_name: string;
  author_verified: boolean;
  average_rating: number;
  ratings_count: number;
  published_at: string | null;
  created_at: string;
  cover_image_url: string | null;
  cover_gradient: string | null;
}

export interface AdminChapterItem {
  id: string;
  book_id: string;
  book_title?: string;
  chapter_number: number;
  title: string;
  slug: string;
  status: string;
  is_suspended: boolean;
  suspension_reason: string | null;
  moderated_at: string | null;
  word_count: number;
  estimated_read_minutes: number;
  published_at: string | null;
  created_at: string;
}

export interface AdminReviewItem {
  id: string;
  book_id: string;
  book_title: string;
  user_id: string;
  username: string;
  user_avatar: string | null;
  rating: number;
  title: string | null;
  content: string;
  moderation_status: ModerationStatus;
  moderation_note: string | null;
  moderated_at: string | null;
  created_at: string;
  likes_count: number;
}

export interface AdminCommentItem {
  id: string;
  book_id: string;
  book_title: string;
  user_id: string;
  username: string;
  user_avatar: string | null;
  content: string;
  moderation_status: ModerationStatus;
  moderation_note: string | null;
  moderated_at: string | null;
  created_at: string;
}

export interface AdminAuditLogDisplayItem {
  id: string;
  actor_id: string;
  actor_username: string;
  actor_avatar: string | null;
  action: string;
  target_type: string;
  target_id: string;
  target_title: string | null;
  reason: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export type AdminTab = "overview" | "reports" | "books" | "users" | "reviews" | "logs";
