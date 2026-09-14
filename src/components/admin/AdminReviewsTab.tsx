"use client";

import * as React from "react";
import {
  MessageSquare,
  Search,
  Star,
  CheckCircle,
  AlertCircle,
  EyeOff,
  Trash2,
  RefreshCw,
} from "lucide-react";
import type { AdminReviewItem, AdminCommentItem, ModerationStatus } from "@/types/admin";
import {
  moderateReview,
  getAdminComments,
  moderateComment,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";

interface AdminReviewsTabProps {
  initialReviews: AdminReviewItem[];
  onRefresh: () => Promise<void>;
}

export function AdminReviewsTab({
  initialReviews,
  onRefresh,
}: AdminReviewsTabProps) {
  const [activeSubTab, setActiveSubTab] = React.useState<"reviews" | "comments">("reviews");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const [reviews, setReviews] = React.useState<AdminReviewItem[]>(initialReviews);
  const [comments, setComments] = React.useState<AdminCommentItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  // Note dialog state
  const [actingItem, setActingItem] = React.useState<{
    id: string;
    type: "review" | "comment";
    targetStatus: ModerationStatus;
    title: string;
  } | null>(null);
  const [moderationNote, setModerationNote] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const fetchComments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminComments();
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync initial reviews
  React.useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  // Load comments when switching to comments tab
  React.useEffect(() => {
    if (activeSubTab === "comments") {
      fetchComments();
    }
  }, [activeSubTab, fetchComments]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (activeSubTab === "reviews") {
        await onRefresh();
      } else {
        await fetchComments();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyModeration = async (
    id: string,
    type: "review" | "comment",
    status: ModerationStatus,
    promptNote = false
  ) => {
    if (promptNote || status === "hidden" || status === "removed") {
      setActingItem({
        id,
        type,
        targetStatus: status,
        title: `${status === "hidden" ? "Hide" : "Remove"} ${type}`,
      });
      setModerationNote("");
      return;
    }

    try {
      if (type === "review") {
        await moderateReview(id, status);
        await onRefresh();
      } else {
        await moderateComment(id, status);
        await fetchComments();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to moderate item");
    }
  };

  const handleConfirmModerationWithNote = async () => {
    if (!actingItem) return;
    setIsSubmitting(true);

    try {
      if (actingItem.type === "review") {
        await moderateReview(actingItem.id, actingItem.targetStatus, moderationNote);
        await onRefresh();
      } else {
        await moderateComment(actingItem.id, actingItem.targetStatus, moderationNote);
        await fetchComments();
      }
      setActingItem(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to moderate item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (statusFilter !== "all" && r.moderation_status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchBook = r.book_title.toLowerCase().includes(q);
      const matchUser = r.username.toLowerCase().includes(q);
      const matchContent = r.content.toLowerCase().includes(q);
      if (!matchBook && !matchUser && !matchContent) return false;
    }
    return true;
  });

  const filteredComments = comments.filter((c) => {
    if (statusFilter !== "all" && c.moderation_status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchBook = c.book_title.toLowerCase().includes(q);
      const matchUser = c.username.toLowerCase().includes(q);
      const matchContent = c.content.toLowerCase().includes(q);
      if (!matchBook && !matchUser && !matchContent) return false;
    }
    return true;
  });

  const getStatusBadge = (status: ModerationStatus) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-2.5 h-2.5" />
            <span>Approved</span>
          </span>
        );
      case "flagged":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-2.5 h-2.5" />
            <span>Flagged</span>
          </span>
        );
      case "hidden":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
            <EyeOff className="w-2.5 h-2.5" />
            <span>Hidden</span>
          </span>
        );
      case "removed":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
            <Trash2 className="w-2.5 h-2.5" />
            <span>Removed</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Tab Switcher & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/80 bg-card/40">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-tab: Reviews vs Comments */}
          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg border border-border/60">
            <button
              onClick={() => setActiveSubTab("reviews")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === "reviews"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Book Reviews
            </button>
            <button
              onClick={() => setActiveSubTab("comments")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === "comments"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Comments
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-secondary/60 border border-border/80 text-foreground text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">All Moderation States</option>
            <option value="approved">Approved Only</option>
            <option value="flagged">Flagged Only</option>
            <option value="hidden">Hidden Only</option>
            <option value="removed">Removed Only</option>
          </select>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search ${activeSubTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/40 border border-border/70 rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="shrink-0 gap-1.5 text-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Content List */}
      {activeSubTab === "reviews" ? (
        filteredReviews.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border/80 bg-card/20 space-y-2">
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto" />
            <h4 className="text-sm font-semibold text-foreground">No Reviews Found</h4>
            <p className="text-xs text-muted-foreground">
              No book reviews match the selected moderation filters.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card/60 hover:border-primary/30 transition-all space-y-3 shadow-2xs"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                      {review.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">
                          @{review.username}
                        </span>
                        <span className="text-[11px] text-muted-foreground">on</span>
                        <span className="text-xs font-medium text-primary truncate max-w-xs">
                          {review.book_title}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(review.moderation_status)}
                    <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < review.rating ? "fill-amber-500" : "text-border"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="bg-secondary/20 rounded-lg p-3 border border-border/50 text-xs space-y-1">
                  {review.title && (
                    <h5 className="font-semibold text-foreground">{review.title}</h5>
                  )}
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {review.content}
                  </p>

                  {review.moderation_note && (
                    <div className="mt-2 pt-2 border-t border-border/60 text-[11px] text-muted-foreground italic">
                      Moderation Note: {review.moderation_note}
                    </div>
                  )}
                </div>

                {/* Footer Toolbar */}
                <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {new Date(review.created_at).toLocaleDateString()} • {review.likes_count} likes
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyModeration(review.id, "review", "approved")}
                      className={`text-xs h-7 cursor-pointer ${
                        review.moderation_status === "approved" ? "text-emerald-500 border-emerald-500/40" : ""
                      }`}
                    >
                      Approve
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyModeration(review.id, "review", "flagged")}
                      className={`text-xs h-7 cursor-pointer ${
                        review.moderation_status === "flagged" ? "text-amber-500 border-amber-500/40" : ""
                      }`}
                    >
                      Flag
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyModeration(review.id, "review", "hidden", true)}
                      className={`text-xs h-7 cursor-pointer ${
                        review.moderation_status === "hidden" ? "text-muted-foreground" : ""
                      }`}
                    >
                      Hide
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyModeration(review.id, "review", "removed", true)}
                      className="text-xs h-7 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10 cursor-pointer"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Comments Tab */
        filteredComments.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border/80 bg-card/20 space-y-2">
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto" />
            <h4 className="text-sm font-semibold text-foreground">No Comments Found</h4>
            <p className="text-xs text-muted-foreground">
              No reader comments match the current filters.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card/60 hover:border-primary/30 transition-all space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      @{comment.username}
                    </span>
                    <span className="text-[11px] text-muted-foreground">on {comment.book_title}</span>
                  </div>
                  {getStatusBadge(comment.moderation_status)}
                </div>

                <div className="bg-secondary/20 rounded-lg p-3 border border-border/50 text-xs">
                  <p className="text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
                  {comment.moderation_note && (
                    <div className="mt-2 pt-2 border-t border-border/60 text-[11px] text-muted-foreground italic">
                      Note: {comment.moderation_note}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyModeration(comment.id, "comment", "approved")}
                      className="text-xs h-7 cursor-pointer"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyModeration(comment.id, "comment", "hidden", true)}
                      className="text-xs h-7 cursor-pointer"
                    >
                      Hide
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyModeration(comment.id, "comment", "removed", true)}
                      className="text-xs h-7 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10 cursor-pointer"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Moderation Note Prompt Modal */}
      {actingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {actingItem.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Provide an internal explanation for this action. This will be stored in the immutable audit log.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Moderation Reason:
              </label>
              <textarea
                rows={3}
                value={moderationNote}
                onChange={(e) => setModerationNote(e.target.value)}
                placeholder="e.g. Unsolicited marketing, abusive language, spoilers..."
                className="w-full bg-secondary/40 border border-border text-foreground text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActingItem(null)}
                disabled={isSubmitting}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmModerationWithNote}
                disabled={isSubmitting}
                className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                {isSubmitting ? "Applying..." : "Confirm Action"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
