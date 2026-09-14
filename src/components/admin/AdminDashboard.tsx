"use client";

import * as React from "react";
import {
  Shield,
  LayoutDashboard,
  AlertTriangle,
  BookOpen,
  Users,
  MessageSquare,
  Activity,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import type {
  AdminOverviewMetrics,
  AdminReportItem,
  AdminBookItem,
  AdminUserItem,
  AdminReviewItem,
  AdminAuditLogDisplayItem,
  AdminTab,
  ProfileRole,
} from "@/types/admin";
import {
  getAdminOverviewMetrics,
  getAdminReports,
  getAdminBooks,
  getAdminUsers,
  getAdminReviews,
  getAdminAuditLogs,
} from "@/lib/admin/actions";
import { AdminOverviewTab } from "./AdminOverviewTab";
import { AdminReportsTab } from "./AdminReportsTab";
import { AdminBooksTab } from "./AdminBooksTab";
import { AdminUsersTab } from "./AdminUsersTab";
import { AdminReviewsTab } from "./AdminReviewsTab";
import { AdminAuditLogsTab } from "./AdminAuditLogsTab";

interface AdminDashboardProps {
  currentUserId: string;
  currentUserRole: ProfileRole;
  currentUsername: string;
  initialMetrics: AdminOverviewMetrics;
  initialReports: AdminReportItem[];
  initialBooks: AdminBookItem[];
  initialUsers: AdminUserItem[];
  initialReviews: AdminReviewItem[];
  initialLogs: AdminAuditLogDisplayItem[];
}

export function AdminDashboard({
  currentUserId,
  currentUserRole,
  currentUsername,
  initialMetrics,
  initialReports,
  initialBooks,
  initialUsers,
  initialReviews,
  initialLogs,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = React.useState<AdminTab>("overview");
  const [metrics, setMetrics] = React.useState<AdminOverviewMetrics>(initialMetrics);
  const [reports, setReports] = React.useState<AdminReportItem[]>(initialReports);
  const [books, setBooks] = React.useState<AdminBookItem[]>(initialBooks);
  const [users, setUsers] = React.useState<AdminUserItem[]>(initialUsers);
  const [reviews, setReviews] = React.useState<AdminReviewItem[]>(initialReviews);
  const [logs, setLogs] = React.useState<AdminAuditLogDisplayItem[]>(initialLogs);

  const refreshAllData = async () => {
    try {
      const [m, r, b, u, rev, l] = await Promise.all([
        getAdminOverviewMetrics(),
        getAdminReports(),
        getAdminBooks(),
        getAdminUsers(),
        getAdminReviews(),
        getAdminAuditLogs(),
      ]);
      setMetrics(m);
      setReports(r);
      setBooks(b);
      setUsers(u);
      setReviews(rev);
      setLogs(l);
    } catch (err) {
      console.error("Failed to refresh administrative data:", err);
    }
  };

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: "reports",
      label: "Community Reports",
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: metrics.pendingReports > 0 ? metrics.pendingReports : undefined,
    },
    { id: "books", label: "Books & Stories", icon: <BookOpen className="w-4 h-4" /> },
    { id: "users", label: "Users & Authors", icon: <Users className="w-4 h-4" /> },
    { id: "reviews", label: "Reviews & Comments", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "logs", label: "Audit Logs", icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Header Banner */}
      <div className="border-b border-border/80 bg-card/40 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Title & Back Link */}
            <div className="flex items-center gap-3.5">
              <Link
                href="/"
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Return to Taleora"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <h1 className="text-lg font-serif font-bold tracking-tight text-foreground">
                    Taleora Moderation & Governance
                  </h1>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Administrative oversight, content moderation, report triage, and forensic audit logs.
                </p>
              </div>
            </div>

            {/* Current Admin Account Badge */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/80 bg-secondary/40 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-foreground">@{currentUsername}</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-semibold uppercase text-[10px] text-primary">
                  {currentUserRole}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-4 mt-2 border-t border-border/60 scrollbar-none">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {typeof tab.badge === "number" && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-white text-primary"
                          : "bg-amber-500 text-white animate-pulse"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tab Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === "overview" && (
          <AdminOverviewTab
            metrics={metrics}
            recentLogs={logs}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === "reports" && (
          <AdminReportsTab
            reports={reports}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === "books" && (
          <AdminBooksTab
            books={books}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === "users" && (
          <AdminUsersTab
            users={users}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === "reviews" && (
          <AdminReviewsTab
            initialReviews={reviews}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === "logs" && (
          <AdminAuditLogsTab
            logs={logs}
            onRefresh={refreshAllData}
          />
        )}
      </main>
    </div>
  );
}
