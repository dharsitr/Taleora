"use client";

import * as React from "react";
import { History, ArrowRight, Trash2 } from "lucide-react";
import { LocalDraftBackup } from "@/lib/stores/studio-store";
import { Button } from "@/components/ui/Button";

interface DraftRecoveryBannerProps {
  backup: LocalDraftBackup;
  onRestore: () => void;
  onDiscard: () => void;
}

export function DraftRecoveryBanner({
  backup,
  onRestore,
  onDiscard,
}: DraftRecoveryBannerProps) {
  const formattedTime = new Date(backup.updatedAt).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-950 dark:text-amber-200 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 mt-0.5">
          <History className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold font-serif text-foreground">
            Unsaved Local Draft Backup Detected
          </span>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            A backup from <strong>{formattedTime}</strong> ({backup.wordCount} words) was recovered from your device.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <Button
          type="button"
          size="sm"
          onClick={onRestore}
          className="h-8 px-3 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
        >
          <span>Restore Draft</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
        <button
          type="button"
          onClick={onDiscard}
          className="h-8 px-2.5 rounded-lg border border-border text-muted-foreground hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-500/10 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          title="Discard Backup"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Discard</span>
        </button>
      </div>
    </div>
  );
}
