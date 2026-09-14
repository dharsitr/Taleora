"use client";

import * as React from "react";
import Link from "next/link";
import { X, BookOpen, Clock, FileText, Check } from "lucide-react";
import { ChapterRow } from "@/types/books";
import { cn } from "@/lib/utils";

interface ChapterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ChapterRow[];
  currentChapterId: string;
  bookSlug: string;
  bookTitle: string;
  onSelectChapter?: (chapter: ChapterRow) => void;
}

export function ChapterDrawer({
  isOpen,
  onClose,
  chapters,
  currentChapterId,
  bookSlug,
  bookTitle,
  onSelectChapter,
}: ChapterDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm sm:max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-250"
        role="dialog"
        aria-label="Table of Contents"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-border/70 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Table of Contents</span>
            </div>
            <h3 className="font-serif text-base font-bold text-foreground line-clamp-1 mt-0.5">
              {bookTitle}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close chapter list"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-border/50">
          {chapters.map((chapter) => {
            const isCurrent = chapter.id === currentChapterId;

            return (
              <Link
                key={chapter.id}
                href={`/read/${bookSlug}/${chapter.slug}`}
                onClick={(e) => {
                  if (onSelectChapter) {
                    e.preventDefault();
                    onSelectChapter(chapter);
                  }
                  onClose();
                }}
                className={cn(
                  "flex items-start gap-3.5 p-3.5 rounded-xl transition-all block group",
                  isCurrent
                    ? "bg-primary/10 border border-primary/30 text-primary"
                    : "hover:bg-secondary/60 text-foreground"
                )}
              >
                {/* Chapter Number Badge */}
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                  )}
                >
                  {isCurrent ? <Check className="w-3.5 h-3.5" /> : chapter.chapter_number}
                </div>

                {/* Chapter Metadata */}
                <div className="flex flex-col flex-1 min-w-0">
                  <span
                    className={cn(
                      "font-serif text-sm font-semibold line-clamp-1",
                      isCurrent ? "text-primary font-bold" : "text-foreground"
                    )}
                  >
                    {chapter.title}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{chapter.estimated_read_minutes}m</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>{chapter.word_count.toLocaleString()}w</span>
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary ml-auto">
                        Reading Now
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-border/70 text-center text-xs text-muted-foreground">
          Sequential reading order · {chapters.length} total chapters
        </div>
      </div>
    </div>
  );
}
