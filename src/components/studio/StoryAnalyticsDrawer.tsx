"use client";

import * as React from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Highlighter,
  Users,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ChapterRow } from "@/types/books";
import { cn } from "@/lib/utils";

interface StoryAnalyticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  chapters: ChapterRow[];
}

export function StoryAnalyticsDrawer({
  isOpen,
  onClose,
  bookTitle,
  chapters,
}: StoryAnalyticsDrawerProps) {
  if (!isOpen) return null;

  const totalWords = chapters.reduce((acc, c) => acc + (c.word_count || 0), 0);
  const totalEstMinutes = chapters.reduce((acc, c) => acc + (c.estimated_read_minutes || 0), 0);
  const publishedCount = chapters.filter((c) => c.status === "published").length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg h-full bg-[#0D0F14] border-l border-white/10 shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-300 gap-5 text-foreground overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-white">
                Story Manuscript Analytics
              </h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-xs">
                {bookTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Top Metrics Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" /> Total Words
            </span>
            <span className="font-serif text-2xl font-bold text-white">
              {totalWords.toLocaleString()}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" /> Read Duration
            </span>
            <span className="font-serif text-2xl font-bold text-white">
              {totalEstMinutes} mins
            </span>
          </div>
        </div>

        {/* Chapter Breakdown */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Chapter Index &amp; Lengths
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {publishedCount} Published / {chapters.length} Total
            </span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {chapters.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-8">
                No chapters written yet.
              </p>
            ) : (
              chapters.map((ch) => (
                <div
                  key={ch.id}
                  className="p-3 rounded-xl bg-zinc-900/40 border border-white/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center font-mono text-[10px] text-zinc-400 shrink-0">
                      {ch.chapter_number}
                    </span>
                    <span className="font-serif text-white truncate max-w-[180px] sm:max-w-[220px]">
                      {ch.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-zinc-400 font-mono text-[11px]">
                    <span>{(ch.word_count || 0).toLocaleString()} words</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                      {ch.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
