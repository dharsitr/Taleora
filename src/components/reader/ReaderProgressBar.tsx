"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReaderProgressBarProps {
  progressPercentage: number;
  chapterNumber: number;
  totalChapters: number;
  estimatedMinutes: number;
  visible?: boolean;
  pageNumber?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function ReaderProgressBar({
  progressPercentage,
  chapterNumber,
  totalChapters,
  estimatedMinutes,
  visible = true,
  pageNumber,
  totalPages,
  onPageChange,
}: ReaderProgressBarProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const fractionRemaining = 1 - progressPercentage / 100;
  const minutesRemaining = Math.max(
    1,
    Math.round((estimatedMinutes || 10) * fractionRemaining)
  );

  return (
    <>
      {/* Top Persistent Progress Strip */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 h-1 z-50 bg-transparent transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
      >
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
        />
      </div>

      {/* Floating Bottom HUD Indicator */}
      <div
        className={cn(
          "fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 transition-all duration-300 pointer-events-auto select-none",
          visible ? "opacity-90 translate-y-0 hover:opacity-100" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 py-2 rounded-full border border-border/80 bg-background/90 backdrop-blur-md text-xs text-muted-foreground shadow-lg">
          <span className="font-semibold text-foreground">
            Ch. {chapterNumber} of {totalChapters}
          </span>

          {mounted && pageNumber !== undefined && totalPages !== undefined && (
            <>
              <span className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1 font-mono text-[11px] sm:text-xs">
                {onPageChange && (
                  <button
                    type="button"
                    disabled={Boolean(pageNumber <= 1)}
                    onClick={() => onPageChange(pageNumber - 1)}
                    className="hover:text-primary disabled:opacity-30 px-1 cursor-pointer font-bold text-sm"
                    title="Previous Page"
                  >
                    ‹
                  </button>
                )}
                <span className="font-bold text-primary">
                  Page {pageNumber} / {totalPages}
                </span>
                {onPageChange && (
                  <button
                    type="button"
                    disabled={Boolean(pageNumber >= totalPages)}
                    onClick={() => onPageChange(pageNumber + 1)}
                    className="hover:text-primary disabled:opacity-30 px-1 cursor-pointer font-bold text-sm"
                    title="Next Page"
                  >
                    ›
                  </button>
                )}
              </div>
            </>
          )}


          <span className="h-3 w-px bg-border" />
          <span className="flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3" />
            <span>~{minutesRemaining}m left</span>
          </span>
        </div>
      </div>
    </>
  );
}

