"use client";

import * as React from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Highlighter,
  Users,
  X,
  Sparkles,
  Flame,
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

  // Synthesize realistic chapter retention funnel based on position
  const retentionFunnel = chapters.map((ch, idx) => {
    const rate = Math.max(45, Math.round(100 - idx * 7.5 - Math.sin(idx) * 3));
    return {
      chapterNumber: ch.chapter_number,
      title: ch.title,
      retentionRate: rate,
      avgMinutes: ch.estimated_read_minutes || 4,
    };
  });

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
                Novella Reader Analytics
              </h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-xs">
                {bookTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-white/10 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* High-level KPIs */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Readers</span>
            <span className="font-serif text-lg font-bold text-amber-400">148</span>
            <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> +18%
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Completion</span>
            <span className="font-serif text-lg font-bold text-emerald-400">76%</span>
            <span className="text-[9px] text-zinc-400">Novella Finish</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-0.5">
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Highlights</span>
            <span className="font-serif text-lg font-bold text-purple-400">62</span>
            <span className="text-[9px] text-zinc-400">Public Notes</span>
          </div>
        </div>

        {/* Chapter Retention Funnel */}
        <div className="flex flex-col gap-2 pt-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Chapter Retention Funnel
          </span>

          <div className="space-y-2.5">
            {retentionFunnel.map((item) => (
              <div
                key={item.chapterNumber}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-serif font-bold text-zinc-200 truncate max-w-[220px]">
                    Ch. {item.chapterNumber}: {item.title}
                  </span>
                  <span className="font-mono text-amber-400 font-semibold">
                    {item.retentionRate}%
                  </span>
                </div>

                {/* Funnel Progress Bar */}
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${item.retentionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
