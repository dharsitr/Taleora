"use client";

import * as React from "react";
import {
  GitCommit,
  History,
  RotateCcw,
  Sparkles,
  Check,
  X,
  Users,
  FileText,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface DraftSnapshot {
  id: string;
  timestamp: string;
  label: string;
  authorName: string;
  wordCount: number;
  content: string;
}

interface DraftDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterTitle: string;
  currentContent: string;
  onRestoreSnapshot: (content: string) => void;
}

export function DraftDiffModal({
  isOpen,
  onClose,
  chapterTitle,
  currentContent,
  onRestoreSnapshot,
}: DraftDiffModalProps) {
  const [snapshots, setSnapshots] = React.useState<DraftSnapshot[]>([
    {
      id: "snap-1",
      timestamp: "10 minutes ago",
      label: "Auto-saved revision",
      authorName: "You",
      wordCount: 1420,
      content: currentContent + "\n\n(Early draft fragment before edits)",
    },
    {
      id: "snap-2",
      timestamp: "1 hour ago",
      label: "Opening scene refinement",
      authorName: "Co-writer Elena",
      wordCount: 1390,
      content: currentContent.slice(0, Math.floor(currentContent.length * 0.8)),
    },
    {
      id: "snap-3",
      timestamp: "Yesterday, 9:30 PM",
      label: "First rough draft",
      authorName: "You",
      wordCount: 1100,
      content: currentContent.slice(0, Math.floor(currentContent.length * 0.5)),
    },
  ]);

  const [selectedSnapshot, setSelectedSnapshot] = React.useState<DraftSnapshot>(snapshots[0]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-card/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                Writer&apos;s Room &amp; Version History
              </h2>
              <p className="text-xs text-muted-foreground">
                {chapterTitle} · Visual Draft Diff &amp; Rollback
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden min-h-[420px]">
          {/* Left: Snapshot List */}
          <div className="border-r border-border p-4 overflow-y-auto space-y-2 bg-secondary/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Draft Snapshots
            </span>
            {snapshots.map((snap) => (
              <button
                key={snap.id}
                type="button"
                onClick={() => setSelectedSnapshot(snap)}
                className={cn(
                  "w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1",
                  selectedSnapshot.id === snap.id
                    ? "bg-card border-primary/40 shadow-xs"
                    : "border-border/60 hover:bg-card/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xs font-bold text-foreground truncate">
                    {snap.label}
                  </span>
                  <span className="text-[9px] text-primary font-mono">{snap.wordCount} words</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{snap.timestamp}</span>
                  <span>·</span>
                  <span>{snap.authorName}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Side-by-side or Draft Viewer */}
          <div className="col-span-2 p-5 overflow-y-auto flex flex-col justify-between bg-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Previewing: {selectedSnapshot.label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Captured {selectedSnapshot.timestamp} by {selectedSnapshot.authorName}
                </span>
              </div>

              {/* Text Body */}
              <div className="p-4 rounded-2xl bg-background border border-border/70 font-serif text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {selectedSnapshot.content}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border flex items-center justify-between mt-4">
              <span className="text-xs text-muted-foreground italic">
                Restoring will replace the current editor buffer.
              </span>
              <Button
                size="sm"
                onClick={() => {
                  onRestoreSnapshot(selectedSnapshot.content);
                  onClose();
                }}
                className="gap-2 cursor-pointer shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore This Draft</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
