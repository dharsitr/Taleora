"use client";

import * as React from "react";
import { Check, Clock, Cloud, AlertCircle, RefreshCw } from "lucide-react";
import { AutosaveStatus } from "@/lib/stores/studio-store";
import { cn } from "@/lib/utils";

interface AutosaveBadgeProps {
  status: AutosaveStatus;
  isDirty: boolean;
  lastSavedAt: number | null;
  className?: string;
}

export function AutosaveBadge({
  status,
  isDirty,
  lastSavedAt,
  className,
}: AutosaveBadgeProps) {
  const formattedTime = React.useMemo(() => {
    if (!lastSavedAt) return null;
    return new Date(lastSavedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [lastSavedAt]);

  if (status === "saving") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 animate-pulse",
          className
        )}
      >
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>Saving draft...</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
          className
        )}
      >
        <AlertCircle className="w-3 h-3" />
        <span>Autosave error</span>
      </div>
    );
  }

  if (isDirty) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span>Unsaved edits</span>
      </div>
    );
  }

  if (formattedTime) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
          className
        )}
      >
        <Check className="w-3 h-3" />
        <span>Saved locally ({formattedTime})</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-secondary/60 text-muted-foreground border border-border/60",
        className
      )}
    >
      <Cloud className="w-3 h-3 text-muted-foreground/70" />
      <span>Synced</span>
    </div>
  );
}
