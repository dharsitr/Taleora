"use client";

import * as React from "react";
import {
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
  Clock,
  ShieldCheck,
  Search,
  MessageSquare,
  BookOpen,
  User,
} from "lucide-react";
import type { AdminReportItem, ReportStatus, ReportTargetType } from "@/types/admin";
import { resolveReport, dismissReport } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";

interface AdminReportsTabProps {
  reports: AdminReportItem[];
  onRefresh: () => Promise<void>;
}

export function AdminReportsTab({ reports, onRefresh }: AdminReportsTabProps) {
  const [statusFilter, setStatusFilter] = React.useState<string>("pending");
  const [targetTypeFilter, setTargetTypeFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);

  // Resolution Modal State
  const [selectedReport, setSelectedReport] = React.useState<AdminReportItem | null>(null);
  const [resolutionAction, setResolutionAction] = React.useState<string>("content_hidden");
  const [resolutionNotes, setResolutionNotes] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  // Dismiss Modal State
  const [dismissingReport, setDismissingReport] = React.useState<AdminReportItem | null>(null);
  const [dismissNotes, setDismissNotes] = React.useState<string>("");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (targetTypeFilter !== "all" && r.target_type !== targetTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchReporter = r.reporter_username?.toLowerCase().includes(q);
      const matchReason = r.reason.toLowerCase().includes(q);
      const matchDetails = r.details?.toLowerCase().includes(q);
      if (!matchReporter && !matchReason && !matchDetails) return false;
    }
    return true;
  });

  const handleConfirmResolution = async () => {
    if (!selectedReport) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      await resolveReport(selectedReport.id, resolutionAction, resolutionNotes);
      setSelectedReport(null);
      setResolutionNotes("");
      await onRefresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to resolve report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDismiss = async () => {
    if (!dismissingReport) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      await dismissReport(dismissingReport.id, dismissNotes);
      setDismissingReport(null);
      setDismissNotes("");
      await onRefresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to dismiss report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTargetIcon = (type: ReportTargetType) => {
    switch (type) {
      case "book":
        return <BookOpen className="w-3.5 h-3.5" />;
      case "user":
      case "author":
        return <User className="w-3.5 h-3.5" />;
      case "review":
      case "comment":
      default:
        return <MessageSquare className="w-3.5 h-3.5" />;
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case "actioned":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Actioned</span>
          </span>
        );
      case "dismissed":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
            <XCircle className="w-3 h-3" />
            <span>Dismissed</span>
          </span>
        );
      default:
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-foreground">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/80 bg-card/40">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          {["pending", "all", "actioned", "dismissed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {s}
            </button>
          ))}

          {/* Target Type Filter */}
          <div className="flex items-center gap-1.5 ml-0 sm:ml-2 pl-2 sm:border-l border-border/60">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="bg-secondary/60 border border-border/80 text-foreground text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">All Targets</option>
              <option value="review">Reviews</option>
              <option value="comment">Comments</option>
              <option value="book">Books</option>
              <option value="chapter">Chapters</option>
              <option value="user">Users</option>
              <option value="author">Authors</option>
            </select>
          </div>
        </div>

        {/* Right side: Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by reporter or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/40 border border-border/70 rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="shrink-0 gap-1.5 text-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Reports Queue List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border/80 bg-card/20 space-y-3">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">
            No Reports Matching Criteria
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {statusFilter === "pending"
              ? "All pending community reports have been resolved. The platform is running cleanly."
              : "No reports found for the selected status and target filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card/60 hover:border-primary/30 transition-all space-y-3.5 shadow-2xs"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary border border-border text-[11px] font-mono capitalize text-foreground">
                    {getTargetIcon(report.target_type)}
                    <span>{report.target_type}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[11px] font-medium text-red-600 dark:text-red-400 capitalize">
                    {report.reason}
                  </span>
                  {getStatusBadge(report.status)}
                </div>

                <div className="text-[11px] text-muted-foreground font-mono">
                  Submitted {new Date(report.created_at).toLocaleString()}
                </div>
              </div>

              {/* Body: Reporter & Details */}
              <div className="bg-secondary/20 rounded-lg p-3 border border-border/50 text-xs space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span>Reported by:</span>
                    <strong className="text-foreground">@{report.reporter_username}</strong>
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/70">
                    Target ID: {report.target_id.slice(0, 8)}...
                  </span>
                </div>

                {report.details ? (
                  <p className="text-foreground leading-relaxed italic bg-card/40 p-2.5 rounded border border-border/40">
                    &ldquo;{report.details}&rdquo;
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">No additional note submitted by reporter.</p>
                )}

                {/* Resolution Summary if already resolved */}
                {report.resolved_at && (
                  <div className="mt-2 pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted-foreground gap-1">
                    <span>
                      Resolved by <strong className="text-foreground">@{report.resolver_username || "Admin"}</strong>:{" "}
                      <span className="text-foreground font-medium underline decoration-primary/50">
                        {report.action_taken}
                      </span>
                      {report.resolution_notes && ` — "${report.resolution_notes}"`}
                    </span>
                    <span className="font-mono">
                      {new Date(report.resolved_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons for Pending Reports */}
              {report.status === "pending" && (
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDismissingReport(report);
                      setDismissNotes("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Dismiss
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedReport(report);
                      setResolutionNotes("");
                      setResolutionAction("content_hidden");
                    }}
                    className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                  >
                    Take Moderation Action
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolution Dialog Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Resolve Community Report
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Target: <strong className="capitalize">{selectedReport.target_type}</strong> • Reason:{" "}
                <strong className="capitalize">{selectedReport.reason}</strong>
              </p>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
                {actionError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">
                  Action to Take:
                </label>
                <select
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="w-full bg-secondary/40 border border-border text-foreground text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="content_hidden">Hide Violating Content</option>
                  <option value="content_removed">Permanently Remove Content</option>
                  <option value="user_suspended">Suspend User Account</option>
                  <option value="warning_issued">Issue Formal Guideline Warning</option>
                  <option value="content_approved">Approve Content (False Report)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">
                  Resolution Notes (Logged in immutable audit logs):
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explain why this action was taken..."
                  className="w-full bg-secondary/40 border border-border text-foreground text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReport(null)}
                disabled={isSubmitting}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmResolution}
                disabled={isSubmitting}
                className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                {isSubmitting ? "Recording Action..." : "Confirm & Resolve"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dismiss Dialog Modal */}
      {dismissingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Dismiss Report
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Dismiss this report if it does not violate Taleora guidelines.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Optional Dismissal Reason:
              </label>
              <input
                type="text"
                value={dismissNotes}
                onChange={(e) => setDismissNotes(e.target.value)}
                placeholder="e.g. Benign artistic expression, no guideline breach."
                className="w-full bg-secondary/40 border border-border text-foreground text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDismissingReport(null)}
                disabled={isSubmitting}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDismiss}
                disabled={isSubmitting}
                className="text-xs bg-secondary text-foreground hover:bg-secondary/80 cursor-pointer"
              >
                {isSubmitting ? "Dismissing..." : "Dismiss Report"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
