"use client";

import * as React from "react";
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Lock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { AdminAuditLogDisplayItem } from "@/types/admin";
import { Button } from "@/components/ui/Button";

interface AdminAuditLogsTabProps {
  logs: AdminAuditLogDisplayItem[];
  onRefresh: () => Promise<void>;
}

export function AdminAuditLogsTab({ logs, onRefresh }: AdminAuditLogsTabProps) {
  const [targetFilter, setTargetFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [expandedLogId, setExpandedLogId] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (targetFilter !== "all" && log.target_type !== targetFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchActor = log.actor_username.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchTarget = log.target_title?.toLowerCase().includes(q);
      const matchReason = log.reason?.toLowerCase().includes(q);
      if (!matchActor && !matchAction && !matchTarget && !matchReason) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Immutability & Security Notice */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.03] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground">
              Append-Only Forensic Record
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Strict Supabase Row Level Security (RLS) prohibits any UPDATE or DELETE operations on audit logs. All actions remain permanently immutable.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/80 bg-card/40">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="bg-secondary/60 border border-border/80 text-foreground text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">All Targets</option>
              <option value="book">Books</option>
              <option value="chapter">Chapters</option>
              <option value="user">Users</option>
              <option value="author">Authors</option>
              <option value="review">Reviews</option>
              <option value="comment">Comments</option>
              <option value="report">Reports</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search actor, action, or note..."
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

      {/* Logs Table / List */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border/80 bg-card/20 space-y-2">
          <Activity className="w-8 h-8 text-muted-foreground mx-auto" />
          <h4 className="text-sm font-semibold text-foreground">No Audit Logs Found</h4>
          <p className="text-xs text-muted-foreground">
            No logged administrative events match the filter parameters.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card/40 overflow-hidden shadow-2xs">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                className="p-4 hover:bg-card/70 transition-colors space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                      {log.actor_username[0].toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">
                          @{log.actor_username}
                        </span>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {log.action}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          on <strong className="capitalize text-foreground">{log.target_type}</strong>
                          {log.target_title && ` ("${log.target_title}")`}
                        </span>
                      </div>

                      {log.reason && (
                        <p className="text-xs text-muted-foreground italic mt-0.5">
                          &ldquo;{log.reason}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Toggle raw details payload"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details JSON viewer */}
                {isExpanded && log.details && (
                  <div className="mt-2 p-3 rounded-lg bg-secondary/30 border border-border/60 text-[11px] font-mono text-muted-foreground overflow-x-auto">
                    <pre>{JSON.stringify(log.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
