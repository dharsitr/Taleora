import { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  requireAdminOrModerator,
  getAdminOverviewMetrics,
  getAdminReports,
  getAdminBooks,
  getAdminUsers,
  getAdminReviews,
  getAdminAuditLogs,
} from "@/lib/admin/actions";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import type { ProfileRole } from "@/types/admin";

export const metadata: Metadata = {
  title: "Admin & Moderation Workspace | Taleora",
  description: "Administrative oversight, content moderation, report triage, and forensic audit logs.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let adminContext;
  try {
    adminContext = await requireAdminOrModerator();
  } catch (_err) {
    redirect("/login?next=/admin");
  }

  const { profile } = adminContext;

  // Fetch initial administrative payloads concurrently
  const [metrics, reports, books, users, reviews, logs] = await Promise.all([
    getAdminOverviewMetrics(),
    getAdminReports(),
    getAdminBooks(),
    getAdminUsers(),
    getAdminReviews(),
    getAdminAuditLogs(),
  ]);

  return (
    <AdminDashboard
      currentUserId={profile.id}
      currentUserRole={profile.role as ProfileRole}
      currentUsername={profile.username}
      initialMetrics={metrics}
      initialReports={reports}
      initialBooks={books}
      initialUsers={users}
      initialReviews={reviews}
      initialLogs={logs}
    />
  );
}
