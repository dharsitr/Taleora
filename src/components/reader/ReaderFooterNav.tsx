"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, BookOpen } from "lucide-react";
import { ChapterRow } from "@/types/books";
import { Button } from "@/components/ui/Button";

interface ReaderFooterNavProps {
  bookSlug: string;
  prevChapter: ChapterRow | null;
  nextChapter: ChapterRow | null;
}

export function ReaderFooterNav({
  bookSlug,
  prevChapter,
  nextChapter,
}: ReaderFooterNavProps) {
  return (
    <div className="flex flex-col gap-8 pt-12 pb-20 border-t border-border/70 mt-16 select-none">
      {/* Literary Asterism Ornament */}
      <div className="flex items-center justify-center gap-3 text-muted-foreground/60">
        <span className="w-12 h-px bg-border/60" />
        <span className="font-serif text-lg tracking-widest text-primary/80">
          ❦ · ❦ · ❦
        </span>
        <span className="w-12 h-px bg-border/60" />
      </div>

      {/* Navigation Buttons Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Previous Chapter */}
        {prevChapter ? (
          <Link
            href={`/read/${bookSlug}/${prevChapter.slug}`}
            className="flex-1 p-4 rounded-xl border border-border bg-card/80 hover:bg-secondary hover:border-primary/40 transition-all flex items-center gap-3 text-left group"
          >
            <div className="w-9 h-9 rounded-lg border border-border bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/40 shrink-0 transition-colors">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Previous Chapter
              </span>
              <span className="font-serif text-xs sm:text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                Ch. {prevChapter.chapter_number} · {prevChapter.title}
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex-1 hidden sm:block" />
        )}

        {/* Next Chapter or Book Completion */}
        {nextChapter ? (
          <Link
            href={`/read/${bookSlug}/${nextChapter.slug}`}
            className="flex-1 p-4 rounded-xl border border-border bg-card/80 hover:bg-secondary hover:border-primary/40 transition-all flex items-center justify-between gap-3 text-right group"
          >
            <div className="flex flex-col min-w-0 text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Next Chapter
              </span>
              <span className="font-serif text-xs sm:text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                Ch. {nextChapter.chapter_number} · {nextChapter.title}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg border border-border bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/40 shrink-0 transition-colors">
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ) : (
          <div className="flex-1 p-6 rounded-xl border border-primary/40 bg-primary/5 flex flex-col items-center text-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-primary" />
            <div className="flex flex-col">
              <h4 className="font-serif text-base font-bold text-foreground">
                Final Chapter Finished
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                You have reached the conclusion of this story.
              </p>
            </div>
            <Link href={`/books/${bookSlug}`}>
              <Button size="sm" variant="outline" className="gap-2 mt-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Return to Book Overview</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
