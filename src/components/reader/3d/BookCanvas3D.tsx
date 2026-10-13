"use client";

import * as React from "react";
import { Canvas } from "@react-three/fiber";
import { BookScene3D } from "./BookScene3D";
import { BookPage } from "../usePagePaginator";
import { ChapterRow, HighlightRow, ReaderSettings } from "@/types/books";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCanvas3DProps {
  pages: BookPage[];
  page: BookPage | null;
  pageNumber: number;
  totalPages: number;
  bookTitle: string;
  chapterTitle: string;
  chapterNumber: number;
  settings: ReaderSettings;
  highlights: HighlightRow[];
  onSelectHighlight: (h: HighlightRow) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  isTurning: boolean;
  turnDirection: "next" | "prev" | null;
  bookSlug: string;
  prevChapter: ChapterRow | null;
  nextChapter: ChapterRow | null;
  coverState?: "closed" | "opening" | "open" | "closing";
  onOpenBook?: () => void;
  authorName?: string;
  coverImageUrl?: string | null;
  prefersReducedMotion?: boolean;
}

export function BookCanvas3D({
  pages,
  pageNumber,
  totalPages,
  bookTitle,
  chapterTitle,
  chapterNumber,
  settings,
  highlights,
  onSelectHighlight: _onSelectHighlight,
  onNextPage,
  onPrevPage,
  hasPrev,
  hasNext,
  isTurning,
  turnDirection,
  bookSlug: _bookSlug,
  prevChapter: _prevChapter,
  nextChapter: _nextChapter,
  coverState = "open",
  onOpenBook,
  authorName,
  coverImageUrl: _coverImageUrl,
  prefersReducedMotion = false,
}: BookCanvas3DProps) {
  // Mobile / desktop screen detection for camera distance
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Subtle interactive parallax tilt based on mouse position
  const [mouseOffset, setMouseOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (coverState !== "open") return;
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      // Gentle subtle tilt (max ~0.08 radians)
      setMouseOffset({ x: nx * 0.08, y: -ny * 0.06 });
    },
    [coverState]
  );

  const handleMouseLeave = React.useCallback(() => {
    setMouseOffset({ x: 0, y: 0 });
  }, []);

  const cameraZ = isMobile ? 6.8 : 5.1;

  return (
    <div
      className="relative w-full h-full flex-1 flex items-center justify-center select-none overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating Prev Page Chevron */}
      {coverState === "open" && (
        <button
          type="button"
          onClick={onPrevPage}
          disabled={!hasPrev || isTurning}
          aria-label="Previous Page"
          title="Previous Page (← or Left Arrow)"
          className={cn(
            "hidden md:flex absolute left-4 lg:left-6 xl:left-8 z-40 w-12 h-12 rounded-full items-center justify-center border transition-all duration-200 cursor-pointer shadow-xl",
            "border-border/80 bg-background/90 hover:bg-background hover:scale-105 active:scale-95 text-foreground/80 hover:text-foreground backdrop-blur-md",
            (!hasPrev || isTurning) && "opacity-20 pointer-events-none"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Floating Next Page Chevron */}
      {coverState === "open" && (
        <button
          type="button"
          onClick={onNextPage}
          disabled={!hasNext || isTurning}
          aria-label="Next Page"
          title="Next Page (→, Space, or Right Arrow)"
          className={cn(
            "hidden md:flex absolute right-4 lg:right-6 xl:right-8 z-40 w-12 h-12 rounded-full items-center justify-center border transition-all duration-200 cursor-pointer shadow-xl",
            "border-border/80 bg-background/90 hover:bg-background hover:scale-105 active:scale-95 text-foreground/80 hover:text-foreground backdrop-blur-md",
            (!hasNext || isTurning) && "opacity-20 pointer-events-none"
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Three.js + React Three Fiber WebGL Canvas */}
      <div className="w-full h-full absolute inset-0 z-10">
        <Canvas
          shadows
          camera={{
            position: [mouseOffset.x, mouseOffset.y, cameraZ],
            fov: 34,
            near: 0.1,
            far: 50,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1}
        >
          <BookScene3D
            pages={pages}
            pageNumber={pageNumber}
            totalPages={totalPages}
            bookTitle={bookTitle}
            chapterTitle={chapterTitle}
            chapterNumber={chapterNumber}
            settings={settings}
            highlights={highlights}
            isTurning={isTurning}
            turnDirection={turnDirection}
            coverState={coverState}
            authorName={authorName}
            prefersReducedMotion={prefersReducedMotion}
          />
        </Canvas>
      </div>

      {/* Closed Book State Action Prompt Overlay */}
      {coverState === "closed" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-12 sm:pb-16 pointer-events-none">
          <button
            type="button"
            onClick={onOpenBook}
            className="pointer-events-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-zinc-950 font-serif font-bold text-sm sm:text-base shadow-2xl flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-amber-400/50"
          >
            <BookOpen className="w-5 h-5" />
            <span>Open Book</span>
          </button>
        </div>
      )}

      {/* Interactive Page Margins for Click-to-Turn */}
      {coverState === "open" && !isTurning && (
        <>
          <div
            onClick={onPrevPage}
            className={cn(
              "absolute inset-y-0 left-0 w-1/4 z-20 cursor-w-resize",
              !hasPrev && "pointer-events-none"
            )}
            title="Click to turn to previous page"
          />
          <div
            onClick={onNextPage}
            className={cn(
              "absolute inset-y-0 right-0 w-1/4 z-20 cursor-e-resize",
              !hasNext && "pointer-events-none"
            )}
            title="Click to turn to next page"
          />
        </>
      )}
    </div>
  );
}
