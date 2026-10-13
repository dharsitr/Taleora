"use client";

import * as React from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
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

/**
 * Camera controller that smoothly transitions framing based on device dimensions,
 * active page on mobile, and desktop spreads.
 */
function ResponsiveCameraRig({
  targetX,
  targetZ,
  mouseOffset,
  prefersReducedMotion,
}: {
  targetX: number;
  targetZ: number;
  mouseOffset: { x: number; y: number };
  prefersReducedMotion?: boolean;
}) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const speed = prefersReducedMotion ? 14 : 5.2;
    const destX = targetX + mouseOffset.x;
    const destY = 0.1 + mouseOffset.y;
    const destZ = targetZ;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, destX, speed, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, destY, speed, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, destZ, speed, delta);
    camera.lookAt(camera.position.x, 0, 0);
  });

  return null;
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
  coverImageUrl,
  prefersReducedMotion = false,
}: BookCanvas3DProps) {
  // Viewport tracking for fluid responsive framing on mobile & laptop
  const [viewport, setViewport] = React.useState<{
    width: number;
    height: number;
    aspect: number;
  }>({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
    aspect: typeof window !== "undefined" ? window.innerWidth / Math.max(1, window.innerHeight) : 1.5,
  });

  React.useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewport({
        width: w,
        height: h,
        aspect: w / Math.max(1, h),
      });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const isMobileLayout = viewport.width < 768 || viewport.aspect < 1.15;

  // Subtle interactive parallax tilt based on mouse position (desktop only)
  const [mouseOffset, setMouseOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (coverState !== "open" || isMobileLayout) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      setMouseOffset({ x: nx * 0.08, y: -ny * 0.06 });
    },
    [coverState, isMobileLayout]
  );

  const handleMouseLeave = React.useCallback(() => {
    setMouseOffset({ x: 0, y: 0 });
  }, []);

  // Compute mathematically ideal camera distance and center X
  const cameraFraming = React.useMemo(() => {
    const tanFovHalf = Math.tan((34 * Math.PI) / 360); // ~0.3057
    const aspect = Math.max(0.35, viewport.aspect);

    if (coverState === "closed") {
      const closedWidth = 2.46;
      const closedHeight = 3.50;
      const zHeight = (closedHeight * 1.16) / (2 * tanFovHalf);
      const zWidth = (closedWidth * 1.25) / (2 * tanFovHalf * aspect);
      return {
        x: 0,
        z: Math.max(5.8, Math.max(zHeight, zWidth)),
      };
    }

    if (isMobileLayout) {
      // Mobile / Portrait: Focus on active reading page
      const pageWidth = 2.38;
      const pageHeight = 3.34;
      const zHeight = (pageHeight * 1.14) / (2 * tanFovHalf);
      const zWidth = (pageWidth * 1.18) / (2 * tanFovHalf * aspect);
      const activePageX = pageNumber % 2 === 1 ? -pageWidth / 2 : pageWidth / 2;
      return {
        x: activePageX,
        z: Math.max(5.6, Math.max(zHeight, zWidth)),
      };
    }

    // Laptop / Desktop: Center the two-page reading spread
    const spreadWidth = 4.92;
    const spreadHeight = 3.50;
    const zHeight = (spreadHeight * 1.15) / (2 * tanFovHalf);
    const zWidth = (spreadWidth * 1.15) / (2 * tanFovHalf * aspect);
    return {
      x: 0,
      z: Math.max(5.85, Math.max(zHeight, zWidth)),
    };
  }, [coverState, isMobileLayout, viewport.aspect, pageNumber]);

  return (
    <div
      className="relative w-full h-full flex-1 flex items-center justify-center select-none overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating Prev Page Chevron (Desktop only) */}
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

      {/* Floating Next Page Chevron (Desktop only) */}
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
      <div
        className={cn(
          "w-full h-full absolute inset-0 z-10",
          coverState === "closed" && "cursor-pointer"
        )}
        onClick={coverState === "closed" ? onOpenBook : undefined}
      >
        <Canvas
          shadows
          camera={{
            position: [cameraFraming.x, 0.1, cameraFraming.z],
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
          <ResponsiveCameraRig
            targetX={cameraFraming.x}
            targetZ={cameraFraming.z}
            mouseOffset={mouseOffset}
            prefersReducedMotion={prefersReducedMotion}
          />
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
            coverImageUrl={coverImageUrl}
            prefersReducedMotion={prefersReducedMotion}
            onOpenBook={onOpenBook}
          />
        </Canvas>
      </div>

      {/* Closed Book State Action Prompt Overlay */}
      {coverState === "closed" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-8 sm:pb-12 md:pb-16 pointer-events-none px-4">
          <button
            type="button"
            onClick={onOpenBook}
            className="pointer-events-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-zinc-950 font-serif font-bold text-sm sm:text-base shadow-2xl flex items-center gap-2.5 sm:gap-3 transition-all transform hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-amber-400/50"
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Open Book</span>
          </button>
        </div>
      )}

      {/* Interactive Page Margins for Click/Tap-to-Turn */}
      {coverState === "open" && !isTurning && (
        <>
          <div
            onClick={onPrevPage}
            className={cn(
              "absolute inset-y-0 left-0 w-1/3 sm:w-1/4 z-20 cursor-w-resize",
              !hasPrev && "pointer-events-none"
            )}
            title="Click to turn to previous page"
          />
          <div
            onClick={onNextPage}
            className={cn(
              "absolute inset-y-0 right-0 w-1/3 sm:w-1/4 z-20 cursor-e-resize",
              !hasNext && "pointer-events-none"
            )}
            title="Click to turn to next page"
          />
        </>
      )}
    </div>
  );
}
