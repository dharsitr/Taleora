"use client";

import * as React from "react";
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  RefreshCw,
  Lock,
  Unlock,
  Feather,
  Flame,
  Award,
} from "lucide-react";
import type { AdminUserItem, ProfileRole } from "@/types/admin";
import {
  suspendUser,
  unsuspendUser,
  updateUserRole,
  verifyAuthor,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";

interface AdminUsersTabProps {
  users: AdminUserItem[];
  currentUserId: string;
  currentUserRole: ProfileRole;
  onRefresh: () => Promise<void>;
}

export function AdminUsersTab({
  users,
  currentUserId,
  currentUserRole,
  onRefresh,
}: AdminUsersTabProps) {
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);

  // Suspension Modal State
  const [suspendingUser, setSuspendingUser] = React.useState<AdminUserItem | null>(null);
  const [suspensionReason, setSuspensionReason] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  // Role Change Modal State
  const [roleUser, setRoleUser] = React.useState<AdminUserItem | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<ProfileRole>("user");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter === "active" && u.is_suspended) return false;
    if (statusFilter === "suspended" && !u.is_suspended) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUsername = u.username.toLowerCase().includes(q);
      const matchName = u.full_name?.toLowerCase().includes(q);
      if (!matchUsername && !matchName) return false;
    }
    return true;
  });

  const handleConfirmSuspend = async () => {
    if (!suspendingUser) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      await suspendUser(
        suspendingUser.id,
        suspensionReason || "Account suspended by administrator"
      );
      setSuspendingUser(null);
      setSuspensionReason("");
      await onRefresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to suspend user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnsuspend = async (user: AdminUserItem) => {
    if (!confirm(`Restore access for @${user.username}?`)) return;
    try {
      await unsuspendUser(user.id);
      await onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to unsuspend user");
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!roleUser) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      await updateUserRole(roleUser.id, selectedRole);
      setRoleUser(null);
      await onRefresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAuthorVerification = async (user: AdminUserItem) => {
    if (!user.author_id) return;
    try {
      await verifyAuthor(user.author_id, !user.author_verified);
      await onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle author verification");
    }
  };

  const getRoleBadge = (role: ProfileRole) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
            <ShieldAlert className="w-2.5 h-2.5" />
            <span>Admin</span>
          </span>
        );
      case "moderator":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <ShieldCheck className="w-2.5 h-2.5" />
            <span>Moderator</span>
          </span>
        );
      case "user":
      default:
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
            Reader
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/80 bg-card/40">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg border border-border/60">
            {["all", "active", "suspended"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all cursor-pointer ${
                  statusFilter === s
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-secondary/60 border border-border/80 text-foreground text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="user">Readers</option>
            <option value="moderator">Moderators</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search username or name..."
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

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border/80 bg-card/20 space-y-2">
          <Users className="w-8 h-8 text-muted-foreground mx-auto" />
          <h4 className="text-sm font-semibold text-foreground">No Users Found</h4>
          <p className="text-xs text-muted-foreground">
            No member accounts match the current filter selection.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card/40 overflow-hidden shadow-2xs">
          {filteredUsers.map((user) => {
            const isSelf = user.id === currentUserId;
            const canManageRoles = currentUserRole === "admin";

            return (
              <div
                key={user.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  user.is_suspended ? "bg-red-500/[0.03]" : "hover:bg-card/70"
                }`}
              >
                {/* User Info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground shrink-0 shadow-2xs">
                    {user.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      user.username[0].toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        @{user.username}
                      </span>
                      {user.full_name && (
                        <span className="text-xs text-muted-foreground truncate">
                          ({user.full_name})
                        </span>
                      )}
                      {getRoleBadge(user.role)}
                      {user.is_author && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          <Feather className="w-2.5 h-2.5" />
                          <span>Author</span>
                          {user.author_verified && (
                            <CheckCircle className="w-2.5 h-2.5 text-primary" />
                          )}
                        </span>
                      )}
                      {user.is_suspended && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Suspended</span>
                        </span>
                      )}
                      {isSelf && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-foreground">
                          You
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center gap-3 font-mono">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" />
                        <span>{user.streak_days}d streak</span>
                      </span>
                      <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>

                    {user.is_suspended && user.suspension_reason && (
                      <p className="text-[11px] text-red-600 dark:text-red-400 italic mt-1 bg-red-500/10 p-1.5 rounded border border-red-500/20">
                        Reason: {user.suspension_reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Author Verification Toggle */}
                  {user.is_author && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAuthorVerification(user)}
                      className="text-xs h-8 gap-1 text-foreground/80 hover:text-foreground cursor-pointer"
                    >
                      <Award className="w-3 h-3 text-primary" />
                      <span>{user.author_verified ? "Unverify" : "Verify"}</span>
                    </Button>
                  )}

                  {/* Change Role (Super Admin only) */}
                  {canManageRoles && !isSelf && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRoleUser(user);
                        setSelectedRole(user.role);
                      }}
                      className="text-xs h-8 gap-1 cursor-pointer"
                    >
                      <Shield className="w-3 h-3" />
                      <span>Change Role</span>
                    </Button>
                  )}

                  {/* Suspend / Unsuspend */}
                  {!isSelf && (
                    <>
                      {user.is_suspended ? (
                        <Button
                          size="sm"
                          onClick={() => handleUnsuspend(user)}
                          className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 cursor-pointer"
                        >
                          <Unlock className="w-3 h-3" />
                          <span>Unsuspend</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSuspendingUser(user);
                            setSuspensionReason("");
                          }}
                          className="text-xs h-8 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10 gap-1 cursor-pointer"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Suspend</span>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* User Suspension Modal */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Suspend Account: @{suspendingUser.username}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Suspending this user will instantly revoke their access to Taleora, deactivate their publishing studio, and hide their public contributions.
              </p>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600">
                {actionError}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Suspension Reason (Logged for audit):
              </label>
              <textarea
                rows={3}
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="State the reason for suspending this account..."
                className="w-full bg-secondary/40 border border-border text-foreground text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSuspendingUser(null)}
                disabled={isSubmitting}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmSuspend}
                disabled={isSubmitting}
                className="text-xs bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                {isSubmitting ? "Suspending..." : "Confirm Suspension"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Role Update Modal */}
      {roleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Assign Role for @{roleUser.username}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Granting Moderator or Administrator access bestows privileged access to sensitive user data, manuscripts, and reports.
              </p>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600">
                {actionError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground block mb-1">
                Select Platform Role:
              </label>

              <div className="space-y-2">
                {[
                  { role: "user" as const, title: "Standard Reader", desc: "Regular reader and optional author privileges." },
                  { role: "moderator" as const, title: "Content Moderator", desc: "Can triage reports, review chapters, and moderate reviews." },
                  { role: "admin" as const, title: "Super Administrator", desc: "Full administrative authority over accounts, roles, and catalog." },
                ].map((item) => (
                  <label
                    key={item.role}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedRole === item.role
                        ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20"
                        : "border-border/70 hover:bg-secondary/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role-select"
                      value={item.role}
                      checked={selectedRole === item.role}
                      onChange={() => setSelectedRole(item.role)}
                      className="mt-0.5 text-primary focus:ring-primary cursor-pointer"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">{item.title}</h4>
                      <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoleUser(null)}
                disabled={isSubmitting}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmRoleChange}
                disabled={isSubmitting}
                className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                {isSubmitting ? "Updating..." : "Save Role"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
