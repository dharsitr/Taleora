"use client";

import * as React from "react";
import {
  Users,
  BookOpen,
  Feather,
  AlertTriangle,
  ShieldAlert,
  MessageSquare,
  Activity,
  ArrowRight,
  CheckCircle2,
  Lock,
  EyeOff,
} from "lucide-react";
import type { AdminOverviewMetrics, AdminAuditLogDisplayItem, AdminTab } from "@/types/admin";
import { Button } from "@/components/ui/Button";

interface AdminOverviewTabProps {
  metrics: AdminOverviewMetrics;
  recentLogs: AdminAuditLogDisplayItem[];
  onSelectTab: (tab: AdminTab) => void;
}

export function AdminOverviewTab({
  metrics,
  recentLogs,
  onSelectTab,
}: AdminOverviewTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Pending Reports Urgent Banner */}
      {metrics.pendingReports > 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 sm:p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  Action Required: {metrics.pendingReports} Community Report{metrics.pendingReports > 1 ? "s" : ""} Pending Review
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Readers and authors have submitted flags regarding content safety, spoilers, or guideline violations.
                </p>
              </div>
            </div>
            <Button
              onClick={() => onSelectTab("reports")}
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 self-start sm:self-center gap-2 cursor-pointer shadow-sm"
              size="sm"
            >
              <span>Triage Queue</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3.5 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Queue clear: All community reports have been reviewed and resolved.</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3.5">
          Platform Scale & Moderation Vitals
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Total Users */}
          <div
            onClick={() => onSelectTab("users")}
            className="group p-4 rounded-xl border border-border/80 bg-card/60 hover:bg-card hover:border-primary/40 transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Community Members</span>
              <Users className="w-4 h-4 group-hover:text-primary transition-colors" />
            </div>
            <div className="text-2xl font-serif font-bold text-foreground">
              {metrics.totalUsers}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span>{metrics.suspendedUsers} suspended</span>
              {metrics.suspendedUsers > 0 && (
                <Lock className="w-3 h-3 text-red-500 inline" />
              )}
            </div>
          </div>

          {/* Published Books */}
          <div
            onClick={() => onSelectTab("books")}
            className="group p-4 rounded-xl border border-border/80 bg-card/60 hover:bg-card hover:border-primary/40 transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Story Manuscripts</span>
              <BookOpen className="w-4 h-4 group-hover:text-primary transition-colors" />
            </div>
            <div className="text-2xl font-serif font-bold text-foreground">
              {metrics.totalBooks}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span>{metrics.suspendedBooks} suspended</span>
              {metrics.suspendedBooks > 0 && (
                <EyeOff className="w-3 h-3 text-amber-500 inline" />
              )}
            </div>
          </div>

          {/* Total Authors */}
          <div
            onClick={() => onSelectTab("users")}
            className="group p-4 rounded-xl border border-border/80 bg-card/60 hover:bg-card hover:border-primary/40 transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Registered Authors</span>
              <Feather className="w-4 h-4 group-hover:text-primary transition-colors" />
            </div>
            <div className="text-2xl font-serif font-bold text-foreground">
              {metrics.totalAuthors}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Verified creators on Taleora
            </div>
          </div>

          {/* Pending Reports */}
          <div
            onClick={() => onSelectTab("reports")}
            className={`group p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
              metrics.pendingReports > 0
                ? "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15"
                : "border-border/80 bg-card/60 hover:bg-card hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Pending Reports</span>
              <AlertTriangle className={`w-4 h-4 ${metrics.pendingReports > 0 ? "text-amber-500" : ""}`} />
            </div>
            <div className={`text-2xl font-serif font-bold ${metrics.pendingReports > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
              {metrics.pendingReports}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Requires moderator decision
            </div>
          </div>

          {/* Flagged Reviews */}
          <div
            onClick={() => onSelectTab("reviews")}
            className="group p-4 rounded-xl border border-border/80 bg-card/60 hover:bg-card hover:border-primary/40 transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Flagged Reviews</span>
              <MessageSquare className="w-4 h-4 group-hover:text-primary transition-colors" />
            </div>
            <div className="text-2xl font-serif font-bold text-foreground">
              {metrics.flaggedReviews}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Hidden or under review
            </div>
          </div>

          {/* Suspended Content */}
          <div
            onClick={() => onSelectTab("books")}
            className="group p-4 rounded-xl border border-border/80 bg-card/60 hover:bg-card hover:border-primary/40 transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Suspended Stories</span>
              <ShieldAlert className="w-4 h-4 text-red-500 group-hover:text-red-600 transition-colors" />
            </div>
            <div className="text-2xl font-serif font-bold text-foreground">
              {metrics.suspendedBooks}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Concealed from public catalog
            </div>
          </div>

          {/* 24h Moderation Actions */}
          <div
            onClick={() => onSelectTab("logs")}
            className="group p-4 rounded-xl border border-border/80 bg-card/60 hover:bg-card hover:border-primary/40 transition-all cursor-pointer shadow-2xs col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">24h Audit Actions</span>
              <Activity className="w-4 h-4 group-hover:text-primary transition-colors" />
            </div>
            <div className="text-2xl font-serif font-bold text-foreground">
              {metrics.auditActions24h}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Recorded in immutable audit log
            </div>
          </div>
        </div>
      </div>

      {/* Operational Workspaces Quick Links */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3.5">
          Administrative Workspaces
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => onSelectTab("reports")}
            className="p-5 rounded-xl border border-border/70 bg-card/40 hover:bg-card/80 hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {metrics.pendingReports} open
                </span>
              </div>
              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Community Reports & Triage
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Review flagged reviews, comments, and story submissions. Apply resolutions or dismissals with immutable logs.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary mt-4">
              <span>Inspect reports</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => onSelectTab("books")}
            className="p-5 rounded-xl border border-border/70 bg-card/40 hover:bg-card/80 hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {metrics.totalBooks} stories
                </span>
              </div>
              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Story & Chapter Management
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Promote stories with Featured or Trending flags, inspect manuscript chapters, and suspend violating content.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary mt-4">
              <span>Manage catalog</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => onSelectTab("users")}
            className="p-5 rounded-xl border border-border/70 bg-card/40 hover:bg-card/80 hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-accent/15 text-accent-foreground flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {metrics.totalUsers} users
                </span>
              </div>
              <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Users & Author Privileges
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Grant moderator roles, verify author identity badges, and suspend bad actors across the platform.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary mt-4">
              <span>Supervise accounts</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Audit Activity Feed */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Recent Forensic Audit Activity
          </h3>
          <button
            onClick={() => onSelectTab("logs")}
            className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>View all logs</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-border/60 bg-card/30 text-muted-foreground text-xs">
            No administrative actions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card/40 overflow-hidden">
            {recentLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                    {log.actor_username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      <span className="text-primary font-semibold">@{log.actor_username}</span>{" "}
                      executed{" "}
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-secondary text-foreground">
                        {log.action}
                      </span>{" "}
                      on <span className="capitalize">{log.target_type}</span>
                      {log.target_title && ` ("${log.target_title}")`}
                    </p>
                    {log.reason && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                        &ldquo;{log.reason}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono shrink-0">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
                  {new Date(log.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
