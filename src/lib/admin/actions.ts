"use server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";
import type {
  AdminOverviewMetrics,
  AdminReportItem,
  AdminUserItem,
  AdminBookItem,
  AdminChapterItem,
  AdminReviewItem,
  AdminCommentItem,
  AdminAuditLogDisplayItem,
  ModerationStatus,
  ProfileRole,
  ReportStatus,
} from "@/types/admin";
import { revalidatePath } from "next/cache";
import { RateLimitProfiles } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/validation";

type ClientType = Awaited<ReturnType<typeof createClient>>;

/**
 * Server-side authorization check.
 * Strictly verifies the authenticated user session and ensures they have
 * either 'admin' or 'moderator' privileges and are not suspended.
 */
export async function requireAdminOrModerator() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required: Please log in to proceed.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, full_name, role, is_suspended")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("User profile not found.");
  }

  if (profile.is_suspended) {
    throw new Error("Account suspended: Administrative access revoked.");
  }

  if (!["admin", "moderator"].includes(profile.role)) {
    throw new Error("Forbidden: Admin or Moderator role required.");
  }

  // Enforce administrative action rate limit
  const rateLimit = RateLimitProfiles.admin(user.id);
  if (!rateLimit.success) {
    throw new Error("Rate limit exceeded: Please wait before performing additional administrative actions.");
  }

  // Enforce AAL2 MFA if enrolled
  if (supabase.auth.mfa?.getAuthenticatorAssuranceLevel) {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2") {
      throw new Error("MFA verification required: Please complete Two-Factor Authentication (AAL2) to perform administrative actions.");
    }
  }

  return { supabase, user, profile };
}

/**
 * Server-side authorization check strictly requiring 'admin' privileges and active AAL2 MFA.
 */
export async function requireAdmin() {
  const context = await requireAdminOrModerator();
  if (context.profile.role !== "admin") {
    throw new Error("Forbidden: Super-Administrator role required for this action.");
  }

  if (context.supabase.auth.mfa?.getAuthenticatorAssuranceLevel) {
    const { data: aalData } = await context.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData?.currentLevel !== "aal2") {
      throw new Error("MFA verification required: Super-Administrator actions require active Two-Factor Authentication (AAL2).");
    }
  }

  return context;
}

/**
 * Append-only immutable audit log writer.
 */
async function recordAuditLog(
  supabase: ClientType,
  log: {
    actorId: string;
    action: string;
    targetType: "user" | "author" | "book" | "chapter" | "review" | "comment" | "report" | "system";
    targetId: string;
    targetTitle?: string | null;
    reason?: string | null;
    details?: Record<string, unknown>;
  }
) {
  try {
    await supabase.from("admin_audit_logs").insert({
      actor_id: log.actorId,
      action: log.action,
      target_type: log.targetType,
      target_id: log.targetId,
      target_title: log.targetTitle || null,
      reason: log.reason || null,
      details: (log.details as Json) || null,
    });
  } catch (err) {
    console.error("Failed to append to admin audit logs:", err);
  }
}

/**
 * Fetch high-level operational metrics for the admin overview dashboard.
 */
export async function getAdminOverviewMetrics(): Promise<AdminOverviewMetrics> {
  const { supabase } = await requireAdminOrModerator();

  const [
    usersCountRes,
    booksCountRes,
    authorsCountRes,
    pendingReportsRes,
    suspendedBooksRes,
    suspendedUsersRes,
    flaggedReviewsRes,
    recentLogsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("books").select("id", { count: "exact", head: true }),
    supabase.from("authors").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("books").select("id", { count: "exact", head: true }).eq("is_suspended", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_suspended", true),
    supabase.from("book_reviews").select("id", { count: "exact", head: true }).in("moderation_status", ["flagged", "hidden", "removed"]),
    supabase
      .from("admin_audit_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  return {
    totalUsers: usersCountRes.count || 0,
    totalBooks: booksCountRes.count || 0,
    totalAuthors: authorsCountRes.count || 0,
    pendingReports: pendingReportsRes.count || 0,
    suspendedBooks: suspendedBooksRes.count || 0,
    suspendedUsers: suspendedUsersRes.count || 0,
    flaggedReviews: flaggedReviewsRes.count || 0,
    auditActions24h: recentLogsRes.count || 0,
  };
}

/**
 * Fetch reported community content for review queue.
 */
export async function getAdminReports(options?: {
  status?: string;
  targetType?: string;
  limit?: number;
}): Promise<AdminReportItem[]> {
  const { supabase } = await requireAdminOrModerator();
  const limit = options?.limit || 50;

  let query = supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options?.targetType && options.targetType !== "all") {
    query = query.eq("target_type", options.targetType);
  }

  const { data: reports, error } = await query;
  if (error || !reports) {
    return [];
  }

  // Fetch reporter and resolver profile info
  const userIds = [
    ...new Set(
      reports
        .flatMap((r) => [r.reporter_id, r.resolved_by])
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("id, username, avatar_url").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  // Map into AdminReportItem with previews
  return reports.map((r) => {
    const reporter = profileMap.get(r.reporter_id);
    const resolver = r.resolved_by ? profileMap.get(r.resolved_by) : null;

    return {
      id: r.id,
      reporter_id: r.reporter_id,
      reporter_username: reporter?.username || "Unknown",
      reporter_avatar: reporter?.avatar_url || null,
      target_type: r.target_type as AdminReportItem["target_type"],
      target_id: r.target_id,
      target_title: null,
      target_preview: r.details || null,
      reason: r.reason,
      details: r.details,
      status: r.status as ReportStatus,
      created_at: r.created_at,
      resolved_at: r.resolved_at,
      resolved_by: r.resolved_by,
      resolver_username: resolver?.username || null,
      resolution_notes: r.resolution_notes,
      action_taken: r.action_taken,
    };
  });
}

/**
 * Resolve a community report with an administrative action.
 */
export async function resolveReport(
  reportId: string,
  actionTaken: string,
  resolutionNotes: string
) {
  const { supabase, user } = await requireAdminOrModerator();

  const { data: report, error: fetchErr } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .single();

  if (fetchErr || !report) {
    throw new Error("Report not found");
  }

  const cleanNotes = sanitizeText(resolutionNotes, 1000);
  const cleanAction = sanitizeText(actionTaken, 100);

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("reports")
    .update({
      status: "actioned",
      resolved_by: user.id,
      resolved_at: now,
      action_taken: cleanAction,
      resolution_notes: cleanNotes,
    })
    .eq("id", reportId);

  if (error) {
    throw new Error(error.message);
  }

  await recordAuditLog(supabase, {
    actorId: user.id,
    action: "resolve_report",
    targetType: "report",
    targetId: reportId,
    targetTitle: `Report on ${report.target_type} (${report.reason})`,
    reason: cleanNotes,
    details: { actionTaken: cleanAction, targetType: report.target_type, targetId: report.target_id },
  });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Dismiss a community report as benign or duplicate.
 */
export async function dismissReport(reportId: string, notes?: string) {
  const { supabase, user } = await requireAdminOrModerator();

  const cleanNotes = sanitizeText(notes || "Dismissed by moderator review", 1000);
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("reports")
    .update({
      status: "dismissed",
      resolved_by: user.id,
      resolved_at: now,
      action_taken: "dismissed",
      resolution_notes: cleanNotes,
    })
    .eq("id", reportId);

  if (error) {
    throw new Error(error.message);
  }

  await recordAuditLog(supabase, {
    actorId: user.id,
    action: "dismiss_report",
    targetType: "report",
    targetId: reportId,
    reason: notes || "No violation found",
  });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Fetch users with filter parameters for administration.
 */
export async function getAdminUsers(options?: {
  search?: string;
  role?: string;
  isSuspended?: boolean;
  limit?: number;
}): Promise<AdminUserItem[]> {
  const { supabase } = await requireAdminOrModerator();
  const limit = options?.limit || 50;

  let query = supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, role, is_suspended, suspended_at, suspension_reason, created_at, streak_days")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.role && options.role !== "all") {
    query = query.eq("role", options.role);
  }

  if (typeof options?.isSuspended === "boolean") {
    query = query.eq("is_suspended", options.isSuspended);
  }

  if (options?.search) {
    const s = `%${options.search}%`;
    query = query.or(`username.ilike.${s},full_name.ilike.${s}`);
  }

  const { data: profiles, error } = await query;
  if (error || !profiles) {
    return [];
  }

  // Check which profiles have registered author pages
  const userIds = profiles.map((p) => p.id);
  const { data: authors } = userIds.length > 0
    ? await supabase.from("authors").select("id, user_id, is_verified").in("user_id", userIds)
    : { data: [] };

  const authorMap = new Map((authors || []).map((a) => [a.user_id, a]));

  return profiles.map((p) => {
    const author = authorMap.get(p.id);
    return {
      id: p.id,
      username: p.username,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      role: p.role as ProfileRole,
      is_suspended: p.is_suspended,
      suspended_at: p.suspended_at,
      suspension_reason: p.suspension_reason,
      created_at: p.created_at,
      streak_days: p.streak_days,
      is_author: Boolean(author),
      author_id: author?.id || null,
      author_verified: author?.is_verified || false,
    };
  });
}

/**
 * Suspend a user account and immediately invalidate administrative privileges.
 */
export async function suspendUser(userId: string, reason: string) {
  const { supabase, user } = await requireAdmin();

  if (userId === user.id) {
    throw new Error("You cannot suspend your own administrative account.");
  }

  const cleanReason = sanitizeText(reason, 500) || "Account suspended by administrator";
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      is_suspended: true,
      suspended_at: now,
      suspension_reason: cleanReason,
      suspended_by: user.id,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await recordAuditLog(supabase, {
    actorId: user.id,
    action: "suspend_user",
    targetType: "user",
    targetId: userId,
    reason: cleanReason,
  });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Unsuspend a previously suspended user account.
 */
export async function unsuspendUser(userId: string) {
  const { supabase, user } = await requireAdmin();

  const { error } = await supabase
    .from("profiles")
    .update({
      is_suspended: false,
      suspended_at: null,
      suspension_reason: null,
      suspended_by: null,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await recordAuditLog(supabase, {
    actorId: user.id,
    action: "unsuspend_user",
    targetType: "user",
    targetId: userId,
    reason: "Restored by administrator",
  });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Update user role (user, moderator, admin).
 */
export async function updateUserRole(userId: string, newRole: ProfileRole) {
  const { supabase, user } = await requireAdmin();

  if (userId === user.id && newRole !== "admin") {
    throw new Error("You cannot demote your own administrator role.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      role: newRole,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await recordAuditLog(supabase, {
    actorId: user.id,
    action: "update_user_role",
    targetType: "user",
    targetId: userId,
    details: { newRole },
  });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Toggle author verification status.
 */
export async function verifyAuthor(authorId: string, isVerified: boolean) {
  const { supabase, user } = await requireAdminOrModerator();

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("authors")
    .update({
      is_verified: isVerified,
      moderated_by: user.id,
      moderated_at: now,
    })
    .eq("id", authorId);

  if (error) {
    throw new Error(error.message);
  }

  await recordAuditLog(supabase, {
    actorId: user.id,
    action: isVerified ? "verify_author" : "unverify_author",
    targetType: "author",
    targetId: authorId,
    details: { isVerified },
  });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Fetch books catalogue for administration.
 */
export async function getAdminBooks(options?: {
  search?: string;
  status?: string;
  isSuspended?: boolean;
  limit?: number;
}): Promise<AdminBookItem[]> {
  const { supabase } = await requireAdminOrModerator();
  const limit = options?.limit || 50;

  let query = supabase
    .from("books")
    .select(`
      id,
      title,
      slug,
      subtitle,
      status,
      featured,
      trending,
      is_suspended,
      suspension_reason,
      moderated_at,
      total_chapters,
      author_id,
      average_rating,
      ratings_count,
      published_at,
      created_at,
      cover_image_url,
      cover_gradient,
      authors (
        name,
        is_verified
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (typeof options?.isSuspended === "boolean") {
    query = query.eq("is_suspended", options.isSuspended);
  }

  if (options?.search) {
    const s = `%${options.search}%`;
    query = query.or(`title.ilike.${s},subtitle.ilike.${s}`);
  }

  const { data: books, error } = await query;
  if (error || !books) {
    return [];
  }

  return books.map((b) => {
    // author join
    const authorData = Array.isArray(b.authors) ? b.authors[0] : b.authors;
    return {
      id: b.id,
      title: b.title,
      slug: b.slug,
      subtitle: b.subtitle,
      status: b.status,
      featured: b.featured,
      trending: b.trending,
      is_suspended: b.is_suspended,
      suspension_reason: b.suspension_reason,
      moderated_at: b.moderated_at,
      total_chapters: b.total_chapters,
      author_id: b.author_id,
      author_name: authorData?.name || "Unknown Author",
      author_verified: authorData?.is_verified || false,
      average_rating: b.average_rating,
      ratings_count: b.ratings_count,
      published_at: b.published_at,
      created_at: b.created_at,
      cover_image_url: b.cover_image_url,
      cover_gradient: b.cover_gradient,
    };
  });
}

/**
 * Toggle book featured status.
 */
export async function toggleBookFeature(bookId: string, featured: boolean) {
  const { supabase, user } = await requireAdminOrModerator();

  const { error } = await supabase
    .from("books")
    .update({ featured })
    .eq("id", bookId);

  if (error) {
    throw new Error(error.message);
  }

  await recordAuditLog(supabase, {
    actorId: user.id,
    action: featured ? "feature_book" : "unfeature_book",
    targetType: "book",
    targetId: bookId,
    details: { featured },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

/**
 * Toggle book trending status.
 */
export async function toggleBookTrending(bookId: string, trending: boolean) {
  const { supabase, user } = await requireAdminOrModerator();

  const { error } = await supabase
    .from("books")
    .update({ trending })
    .eq("id", bookId);

  if (error) {
    throw new Error(error.message);
  }

  await recordAuditLog(supabase, {
    actorId: user.id,
    action: trending ? "trend_book" : "untrend_book",
    targetType: "book",
    targetId: bookId,
    details: { trending },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

/**
 * Suspend a book and conceal it from public discovery and library listings.
 */
export async function suspendBook(bookId: string, reason: string) {
  const { supabase, user } = await requireAdminOrModerator();

  const cleanReason = sanitizeText(reason, 500) || "Suspended by moderator review";
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("books")
    .update({
      is_suspended: true,
      suspension_reason: cleanReason,
      moderated_by: user.id,
      moderated_at: now,
    })
    .eq("id", bookId);

  if (error) {
    throw new Error(error.message);
  }

  await recordAuditLog(supabase, {
    actorId: user.id,
    action: "suspend_book",
    targetType: "book",
    targetId: bookId,
    reason: cleanReason,
  });

  revalidatePath("/admin");
  revalidatePath("/discover");
  revalidatePath("/");
  return { success: true };
}

/**
 * Restore a suspended book to public view.
 */
export async function restoreBook(bookId: string) {
  const { supabase, user } = await requireAdminOrModerator();

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("books")
    .update({
      is_suspended: false,
      suspension_reason: null,
      moderated_by: user.id,
      moderated_at: now,
    })
    .eq("id", bookId);

  if (error) {
    throw new Error(error.message);
  }

  await recordAuditLog(supabase, {
    actorId: user.id,
    action: "restore_book",
    targetType: "book",
    targetId: bookId,
    reason: "Restored by moderator",
  });

  revalidatePath("/admin");
  revalidatePath("/discover");
  revalidatePath("/");
  return { success: true };
}

/**
 * Fetch chapters for a book to inspect content.
 */
export async function getAdminChapters(bookId: string): Promise<AdminChapterItem[]> {
  const { supabase } = await requireAdminOrModerator();

  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, book_id, chapter_number, title, slug, status, is_suspended, suspension_reason, moderated_at, word_count, estimated_read_minutes, published_at, created_at")
    .eq("book_id", bookId)
    .order("chapter_number", { ascending: true });

  if (error || !chapters) {
    return [];
  }

  return chapters.map((c) => ({
    id: c.id,
    book_id: c.book_id,
    chapter_number: c.chapter_number,
    title: c.title,
    slug: c.slug,
    status: c.status,
    is_suspended: c.is_suspended,
    suspension_reason: c.suspension_reason,
    moderated_at: c.moderated_at,
    word_count: c.word_count,
    estimated_read_minutes: c.estimated_read_minutes,
    published_at: c.published_at,
    created_at: c.created_at,
  }));
}

/**
 * Suspend a chapter.
 */
export async function suspendChapter(chapterId: string, reason: string) {
  const { supabase, user } = await requireAdminOrModerator();

  const cleanReason = sanitizeText(reason, 500) || "Chapter suspended by moderator review";
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("chapters")
    .update({
      is_suspended: true,
      suspension_reason: cleanReason,
      moderated_by: user.id,
      moderated_at: now,
    })
    .eq("id", chapterId);

  if (error) {
    throw new Error(error.message);
  }

  await recordAuditLog(supabase, {
    actorId: user.id,
    action: "suspend_chapter",
    targetType: "chapter",
    targetId: chapterId,
    reason: cleanReason,
  });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Restore a suspended chapter.
 */
export async function restoreChapter(chapterId: string) {
  const { supabase, user } = await requireAdminOrModerator();

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("chapters")
    .update({
      is_suspended: false,
      suspension_reason: null,
      moderated_by: user.id,
      moderated_at: now,
    })
    .eq("id", chapterId);

  if (error) {
    throw new Error(error.message);
  }

  await recordAuditLog(supabase, {
    actorId: user.id,
    action: "restore_chapter",
    targetType: "chapter",
    targetId: chapterId,
    reason: "Restored by moderator",
  });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Fetch reviews for moderation review.
 */
export async function getAdminReviews(options?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<AdminReviewItem[]> {
  const { supabase } = await requireAdminOrModerator();
  const limit = options?.limit || 50;

  let query = supabase
    .from("book_reviews")
    .select(`
      id,
      book_id,
      user_id,
      rating,
      title,
      content,
      moderation_status,
      moderation_note,
      moderated_at,
      created_at,
      likes_count,
      books (
        title
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.status && options.status !== "all") {
    query = query.eq("moderation_status", options.status);
  }

  if (options?.search) {
    const s = `%${options.search}%`;
    query = query.or(`content.ilike.${s},title.ilike.${s}`);
  }

  const { data: reviews, error } = await query;
  if (error || !reviews) {
    return [];
  }

  // Fetch author profiles
  const userIds = [...new Set(reviews.map((r) => r.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("id, username, avatar_url").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return reviews.map((r) => {
    const profile = profileMap.get(r.user_id);
    const bookData = Array.isArray(r.books) ? r.books[0] : r.books;

    return {
      id: r.id,
      book_id: r.book_id,
      book_title: bookData?.title || "Unknown Book",
      user_id: r.user_id,
      username: profile?.username || "Unknown User",
      user_avatar: profile?.avatar_url || null,
      rating: r.rating,
      title: r.title,
      content: r.content,
      moderation_status: r.moderation_status as ModerationStatus,
      moderation_note: r.moderation_note,
      moderated_at: r.moderated_at,
      created_at: r.created_at,
      likes_count: r.likes_count,
    };
  });
}

/**
 * Moderate a community review (approve, flag, hide, remove).
 */
export async function moderateReview(
  reviewId: string,
  status: ModerationStatus,
  note?: string
) {
  const { supabase, user } = await requireAdminOrModerator();

  const cleanNote = note ? sanitizeText(note, 500) : null;
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("book_reviews")
    .update({
      moderation_status: status,
      moderation_note: cleanNote,
      moderated_by: user.id,
      moderated_at: now,
    })
    .eq("id", reviewId);

  if (error) {
    throw new Error(error.message);
  }

  await recordAuditLog(supabase, {
    actorId: user.id,
    action: `moderate_review_${status}`,
    targetType: "review",
    targetId: reviewId,
    reason: cleanNote || `Review marked as ${status}`,
    details: { status },
  });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Fetch comments for moderation review.
 */
export async function getAdminComments(options?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<AdminCommentItem[]> {
  const { supabase } = await requireAdminOrModerator();
  const limit = options?.limit || 50;

  let query = supabase
    .from("comments")
    .select(`
      id,
      book_id,
      user_id,
      content,
      moderation_status,
      moderation_note,
      moderated_at,
      created_at,
      books (
        title
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.status && options.status !== "all") {
    query = query.eq("moderation_status", options.status);
  }

  if (options?.search) {
    const s = `%${options.search}%`;
    query = query.ilike("content", s);
  }

  const { data: comments, error } = await query;
  if (error || !comments) {
    return [];
  }

  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("id, username, avatar_url").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return comments.map((c) => {
    const profile = profileMap.get(c.user_id);
    const bookData = Array.isArray(c.books) ? c.books[0] : c.books;

    return {
      id: c.id,
      book_id: c.book_id,
      book_title: bookData?.title || "Unknown Book",
      user_id: c.user_id,
      username: profile?.username || "Unknown User",
      user_avatar: profile?.avatar_url || null,
      content: c.content,
      moderation_status: c.moderation_status as ModerationStatus,
      moderation_note: c.moderation_note,
      moderated_at: c.moderated_at,
      created_at: c.created_at,
    };
  });
}

/**
 * Moderate a comment (approve, flag, hide, remove).
 */
export async function moderateComment(
  commentId: string,
  status: ModerationStatus,
  note?: string
) {
  const { supabase, user } = await requireAdminOrModerator();

  const cleanNote = note ? sanitizeText(note, 500) : null;
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("comments")
    .update({
      moderation_status: status,
      moderation_note: cleanNote,
      moderated_by: user.id,
      moderated_at: now,
    })
    .eq("id", commentId);

  if (error) {
    throw new Error(error.message);
  }

  await recordAuditLog(supabase, {
    actorId: user.id,
    action: `moderate_comment_${status}`,
    targetType: "comment",
    targetId: commentId,
    reason: cleanNote || `Comment marked as ${status}`,
    details: { status },
  });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Fetch immutable administrative audit logs for forensic auditing.
 */
export async function getAdminAuditLogs(options?: {
  targetType?: string;
  limit?: number;
}): Promise<AdminAuditLogDisplayItem[]> {
  const { supabase } = await requireAdminOrModerator();
  const limit = options?.limit || 100;

  let query = supabase
    .from("admin_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.targetType && options.targetType !== "all") {
    query = query.eq("target_type", options.targetType);
  }

  const { data: logs, error } = await query;
  if (error || !logs) {
    return [];
  }

  const actorIds = [...new Set(logs.map((l) => l.actor_id))];
  const { data: profiles } = actorIds.length > 0
    ? await supabase.from("profiles").select("id, username, avatar_url").in("id", actorIds)
    : { data: [] };

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return logs.map((l) => {
    const actor = profileMap.get(l.actor_id);
    return {
      id: l.id,
      actor_id: l.actor_id,
      actor_username: actor?.username || "Admin Actor",
      actor_avatar: actor?.avatar_url || null,
      action: l.action,
      target_type: l.target_type,
      target_id: l.target_id,
      target_title: l.target_title,
      reason: l.reason,
      details: l.details as Record<string, unknown> | null,
      created_at: l.created_at,
    };
  });
}
