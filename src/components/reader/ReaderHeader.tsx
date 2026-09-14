"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  List,
  Sliders,
  Maximize2,
  Minimize2,
  Bookmark,
  Highlighter,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReaderHeaderProps {
  bookSlug: string;
  bookTitle: string;
  chapterTitle: string;
  chapterNumber: number;
  totalChapters: number;
  zenMode: boolean;
  onToggleZenMode: () => void;
  onOpenChapters: () => void;
  onOpenSettings: () => void;
  onOpenAnnotations?: () => void;
  onBookmarkCurrent?: () => void;
  isBookmarked?: boolean;
  annotationsCount?: number;
  onExitReader?: () => void;
  isOffline?: boolean;
}

export function ReaderHeader({
  bookSlug,
  bookTitle,
  chapterTitle,
  chapterNumber,
  totalChapters,
  zenMode,
  onToggleZenMode,
  onOpenChapters,
  onOpenSettings,
  onOpenAnnotations,
  onBookmarkCurrent,
  isBookmarked = false,
  annotationsCount = 0,
  onExitReader,
  isOffline = false,
}: ReaderHeaderProps) {
  return (
    <>
      {/* Top Header Bar */}
      <header
        className={cn(
          "sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md transition-all duration-300",
          zenMode ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        )}
      >
        <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 max-w-6xl mx-auto">
          {/* Left: Exit Reader / Back to Book */}
          {onExitReader ? (
            <button
              type="button"
              onClick={onExitReader}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
              title="Close Book & Return"
            >
              <div className="w-8 h-8 rounded-lg border border-border/80 flex items-center justify-center group-hover:bg-secondary transition-colors">
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              </div>
              <span className="hidden sm:inline font-serif font-semibold text-foreground/90 line-clamp-1 max-w-[200px]">
                {bookTitle}
              </span>
            </button>
          ) : (
            <Link
              href={`/books/${bookSlug}`}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
              title="Exit Reader to Book Details"
            >
              <div className="w-8 h-8 rounded-lg border border-border/80 flex items-center justify-center group-hover:bg-secondary transition-colors">
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              </div>
              <span className="hidden sm:inline font-serif font-semibold text-foreground/90 line-clamp-1 max-w-[200px]">
                {bookTitle}
              </span>
            </Link>
          )}

          {/* Center: Current Chapter Title */}
          <div className="flex flex-col items-center text-center px-2 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Chapter {chapterNumber} of {totalChapters}
              </span>
              {isOffline && (
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.2 rounded-md">
                  <WifiOff className="w-2.5 h-2.5" />
                  <span>Offline</span>
                </span>
              )}
            </div>
            <span className="font-serif text-xs sm:text-sm font-bold text-foreground line-clamp-1 max-w-[240px] sm:max-w-md">
              {chapterTitle}
            </span>
          </div>

          {/* Right: Controls & Drawer Triggers */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Bookmark Current Position */}
            {onBookmarkCurrent && (
              <button
                type="button"
                onClick={onBookmarkCurrent}
                title={isBookmarked ? "Position Bookmarked" : "Bookmark Current Position"}
                aria-label="Bookmark Current Position"
                className={cn(
                  "w-9 h-9 rounded-lg border border-border/80 flex items-center justify-center transition-colors cursor-pointer",
                  isBookmarked
                    ? "bg-primary/15 text-primary border-primary/40"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Bookmark
                  className={cn(
                    "w-4 h-4 transition-transform active:scale-125",
                    isBookmarked && "fill-current text-primary"
                  )}
                />
              </button>
            )}

            {/* Bookmarks & Highlights Drawer Button */}
            {onOpenAnnotations && (
              <button
                type="button"
                onClick={onOpenAnnotations}
                title="Annotations, Bookmarks & Highlights"
                aria-label="Annotations and Bookmarks"
                className="w-9 h-9 rounded-lg border border-border/80 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer relative"
              >
                <Highlighter className="w-4 h-4" />
                {annotationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {annotationsCount > 9 ? "9+" : annotationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Table of Contents Button */}
            <button
              type="button"
              onClick={onOpenChapters}
              title="Table of Contents"
              aria-label="Table of Contents"
              className="w-9 h-9 rounded-lg border border-border/80 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            >
              <List className="w-4 h-4" />
            </button>

            {/* Reader Appearance Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              title="Reading Appearance (Font, Size, Theme)"
              aria-label="Reading Appearance"
              className="w-9 h-9 rounded-lg border border-border/80 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Zen Mode Button */}
            <button
              type="button"
              onClick={onToggleZenMode}
              title="Toggle Zen Mode (F)"
              aria-label="Toggle Zen Mode"
              className="w-9 h-9 rounded-lg border border-border/80 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Floating Zen Mode Restorer button when header is hidden */}
      {zenMode && (
        <button
          type="button"
          onClick={onToggleZenMode}
          title="Exit Zen Mode (Esc or F)"
          aria-label="Exit Zen Mode"
          className="fixed top-4 right-4 z-40 px-3 py-1.5 rounded-full border border-border/80 bg-background/80 backdrop-blur-md text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 shadow-md transition-all opacity-40 hover:opacity-100 cursor-pointer"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit Zen</span>
        </button>
      )}
    </>
  );
}
