"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CheckCircle2, BookOpen } from "lucide-react";
import { ChapterRow, HighlightColor, HighlightRow, ReaderSettings } from "@/types/books";
import { HIGHLIGHT_COLORS, parseParagraphHighlights } from "@/lib/books/highlights";
import { BookPage } from "./usePagePaginator";
import { cn } from "@/lib/utils";

interface BookCanvasProps {
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
}

interface SinglePageRenderProps {
  pageData: BookPage | null;
  displayPageNum: number;
  totalPages: number;
  bookTitle: string;
  chapterTitle: string;
  chapterNumber: number;
  settings: ReaderSettings;
  highlights: HighlightRow[];
  onSelectHighlight: (h: HighlightRow) => void;
  bookSlug: string;
  nextChapter: ChapterRow | null;
  side: "left" | "right" | "single";
  isFirstPageOfChapter?: boolean;
}

/**
 * Renders a single book page surface (used for base left/right and turning leaf faces)
 */
function SingleBookPageContent({
  pageData,
  displayPageNum,
  totalPages,
  bookTitle,
  chapterTitle,
  chapterNumber,
  settings,
  highlights,
  onSelectHighlight,
  bookSlug,
  nextChapter,
  side,
  isFirstPageOfChapter = false,
}: SinglePageRenderProps) {
  const fontClass =
    settings.fontFamily === "sans"
      ? "font-sans"
      : settings.fontFamily === "mono"
      ? "font-mono"
      : "font-serif";

  const isFinalPage = displayPageNum >= totalPages && totalPages > 0;

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden select-text">
      {/* Page Curvature Ambient Shadow Overlay */}
      {side === "left" && (
        <div className="absolute inset-0 book-page-left-curve z-20 pointer-events-none" />
      )}
      {side === "right" && (
        <div className="absolute inset-0 book-page-right-curve z-20 pointer-events-none" />
      )}

      {/* Running Top Page Header */}
      <header className="px-6 sm:px-9 pt-4 pb-2 flex items-center justify-between border-b border-current/10 text-[11px] font-medium tracking-wide uppercase opacity-70 select-none z-10">
        {side === "left" ? (
          <>
            <span className="truncate max-w-[65%] font-serif italic normal-case tracking-normal">
              {bookTitle}
            </span>
            <span className="text-[10px] tracking-wider opacity-60">
              Ch. {chapterNumber}
            </span>
          </>
        ) : (
          <>
            <span className="text-[10px] tracking-wider opacity-60">
              Chapter {chapterNumber}
            </span>
            <span className="truncate max-w-[65%] font-serif italic normal-case tracking-normal">
              {chapterTitle}
            </span>
          </>
        )}
      </header>

      {/* Prose Text Content */}
      <div className="flex-1 px-6 sm:px-9 py-5 overflow-hidden flex flex-col justify-start z-10 relative select-text pointer-events-auto">
        {/* Chapter Opening Header Banner (Page 1 only) */}
        {isFirstPageOfChapter && displayPageNum === 1 && (
          <div className="text-center pb-5 mb-4 border-b border-current/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Chapter {chapterNumber}
            </span>
            <h1
              className={cn(
                "text-lg sm:text-2xl font-bold tracking-tight mt-1 mb-1 leading-tight",
                fontClass
              )}
            >
              {chapterTitle}
            </h1>
            <div className="text-[10px] opacity-50 tracking-widest font-serif">
              ❦ · ❦ · ❦
            </div>
          </div>
        )}

        {/* Empty Page / End of Chapter filler */}
        {!pageData && isFinalPage ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground/70">
            <div className="font-serif italic text-sm mb-4">End of Chapter {chapterNumber}</div>
            {nextChapter ? (
              <Link
                href={`/read/${bookSlug}/${nextChapter.slug}`}
                className="px-4 py-2 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Continue to Chapter {nextChapter.chapter_number}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold">Story Completed</span>
              </div>
            )}
          </div>
        ) : (
          <article
            className={cn("flex flex-col gap-3.5 sm:gap-4 leading-relaxed select-text cursor-text pointer-events-auto", fontClass)}
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
            }}
          >
            {pageData?.chunks.map((chunk, cIdx) => {
              const pHighlights = highlights.filter(
                (h) => h.paragraph_index === chunk.paragraphIndex
              );

              const showDropCap = Boolean(chunk.isDropCap && chunk.text.length > 0);
              const firstLetter = showDropCap ? chunk.text.charAt(0) : "";
              const textToRender = showDropCap ? chunk.text.slice(1) : chunk.text;
              const fragments = parseParagraphHighlights(textToRender, pHighlights);

              return (
                <p
                  key={cIdx}
                  id={`p-${chunk.paragraphIndex}`}
                  data-paragraph-index={chunk.paragraphIndex}
                  className={cn(
                    "tracking-normal relative transition-all duration-150 select-text cursor-text pointer-events-auto",
                    chunk.isContinuedFromPrev && "indent-0 opacity-95",
                    !chunk.isContinuedFromPrev && !showDropCap && "indent-4 sm:indent-6"
                  )}
                >
                  {showDropCap && (
                    <span className="literary-drop-cap text-primary font-bold">
                      {firstLetter}
                    </span>
                  )}

                  {fragments.map((frag, fIdx) => {
                    if (!frag.highlight) {
                      return <React.Fragment key={fIdx}>{frag.text}</React.Fragment>;
                    }

                    const h = frag.highlight;
                    const colorConfig =
                      HIGHLIGHT_COLORS[h.color as HighlightColor] ||
                      HIGHLIGHT_COLORS.amber;

                    return (
                      <mark
                        key={fIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectHighlight(h);
                        }}
                        title={h.note ? `Note: ${h.note}` : "Click to view note or remove"}
                        className={cn(
                          colorConfig.markClass,
                          "inline relative cursor-pointer z-35 rounded-xs px-0.5 pointer-events-auto"
                        )}
                      >
                        {frag.text}
                        {h.note && (
                          <span
                            className="inline-block align-top ml-0.5 w-1.5 h-1.5 rounded-full bg-primary ring-1 ring-background"
                            title="Has attached note"
                          />
                        )}
                      </mark>
                    );
                  })}
                </p>
              );
            })}

            {/* End of Chapter banner on last page */}
            {isFinalPage && pageData && (
              <div className="pt-4 mt-2 border-t border-current/15 flex flex-col items-center text-center gap-2.5 select-none">
                <span className="text-[11px] font-serif italic opacity-60">
                  End of Chapter {chapterNumber}
                </span>

                {nextChapter ? (
                  <Link
                    href={`/read/${bookSlug}/${nextChapter.slug}`}
                    className="px-4 py-2 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs flex items-center gap-1.5 transition-all group cursor-pointer"
                  >
                    <span>Proceed to Chapter {nextChapter.chapter_number}</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 pt-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Story Completed</span>
                    </div>
                    <Link
                      href={`/books/${bookSlug}`}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 underline underline-offset-4"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Return to Book Overview</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </article>
        )}
      </div>

      {/* Running Bottom Page Footer */}
      <footer className="px-6 sm:px-9 py-2.5 border-t border-current/10 flex items-center justify-between text-[11px] font-mono opacity-65 select-none z-10">
        {side === "left" ? (
          <>
            <span className="font-semibold text-foreground">{displayPageNum}</span>
            <span className="text-[10px] tracking-wider uppercase font-sans opacity-60">
              {Math.round((displayPageNum / Math.max(1, totalPages)) * 100)}%
            </span>
          </>
        ) : (
          <>
            <span className="text-[10px] tracking-wider uppercase font-sans opacity-60">
              {Math.round((displayPageNum / Math.max(1, totalPages)) * 100)}%
            </span>
            <div className="flex items-center gap-1 font-semibold text-foreground">
              <span>{displayPageNum}</span>
              <span className="opacity-40">/</span>
              <span>{totalPages}</span>
            </div>
          </>
        )}
      </footer>
    </div>
  );
}

export const BookCanvas = React.forwardRef<HTMLDivElement, BookCanvasProps>(
  function BookCanvas(
    {
      pages,
      page,
      pageNumber,
      totalPages,
      bookTitle,
      chapterTitle,
      chapterNumber,
      settings,
      highlights,
      onSelectHighlight,
      onNextPage,
      onPrevPage,
      hasPrev,
      hasNext,
      isTurning,
      turnDirection,
      bookSlug,
      prevChapter: _prevChapter,
      nextChapter,
      coverState = "open",
      onOpenBook,
      authorName,
      coverImageUrl,
    },
    ref
  ) {
    // Detect viewport width for two-page spread support
    const [isDesktopScreen, setIsDesktopScreen] = React.useState(true);

    React.useEffect(() => {
      const checkWidth = () => {
        setIsDesktopScreen(window.innerWidth >= 768);
      };
      checkWidth();
      window.addEventListener("resize", checkWidth);
      return () => window.removeEventListener("resize", checkWidth);
    }, []);

    const isTwoPageMode =
      (settings.pageLayout === "spread" || !settings.pageLayout) && isDesktopScreen;

    // Theme Classes for Pages
    const paperClasses =
      settings.theme === "sepia"
        ? "bg-[#f5eedb] text-[#3e2e1e] border-[#e3d7bc]"
        : settings.theme === "dark"
        ? "bg-[#13171f] text-[#e2e8f0] border-[#1f2533]"
        : "bg-[#fbf9f5] text-[#1c222c] border-[#e7e1d6]";

    // Theme Classes for Book Cover Hardcover Rim
    const coverRimClasses =
      settings.theme === "sepia"
        ? "bg-[#382315] border-[#4a301d]"
        : settings.theme === "dark"
        ? "bg-[#0b0e14] border-[#161c28]"
        : "bg-[#2d221b] border-[#423328]";

    const widthClass =
      settings.width === "narrow"
        ? "max-w-4xl"
        : settings.width === "wide"
        ? "max-w-6xl"
        : "max-w-5xl";

    // Spreads calculation
    // Left page is always odd (1, 3, 5...), Right page is always even (2, 4, 6...)
    const effectiveLeftPageNum = isTwoPageMode
      ? pageNumber % 2 === 0
        ? Math.max(1, pageNumber - 1)
        : pageNumber
      : pageNumber;
    const effectiveRightPageNum = effectiveLeftPageNum + 1;

    const leftPageData =
      pages[effectiveLeftPageNum - 1] || (effectiveLeftPageNum === 1 ? page : null);
    const rightPageData = isTwoPageMode ? pages[effectiveRightPageNum - 1] || null : null;

    // Next page preview data for smooth 3D flip revealing under layer
    const nextLeftPageNum = effectiveLeftPageNum + 2;
    const nextRightPageNum = effectiveRightPageNum + 2;
    const nextRightPageData = pages[nextRightPageNum - 1] || null;

    // Prev page preview data for smooth 3D flip
    const prevLeftPageNum = Math.max(1, effectiveLeftPageNum - 2);
    const prevLeftPageData = pages[prevLeftPageNum - 1] || null;
    const prevRightPageNum = effectiveLeftPageNum - 1;
    const prevRightPageData = pages[prevRightPageNum - 1] || null;

    // 1. CLOSED BOOK VIEW (Initial Entry from Start Reading)
    if (coverState === "closed") {
      return (
        <div className="relative w-full flex-1 flex items-center justify-center p-4 sm:p-6 book-perspective overflow-hidden">
          <div
            ref={ref}
            onClick={onOpenBook}
            className={cn(
              "relative w-full max-w-sm sm:max-w-md h-[calc(100vh-140px)] min-h-[480px] max-h-[720px] rounded-2xl p-6 sm:p-8 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 book-cover-casing border group hover:scale-[1.01] select-none overflow-hidden",
              coverRimClasses
            )}
            title="Click to Open Book"
          >
            {/* Uploaded Cover Image Artwork */}
            {coverImageUrl && (
              <>
                <Image
                  src={coverImageUrl}
                  alt={bookTitle}
                  fill
                  priority
                  unoptimized={!coverImageUrl.includes(".supabase.co") && !coverImageUrl.startsWith("/")}
                  className="absolute inset-0 w-full h-full object-cover object-center rounded-2xl pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/40 rounded-2xl pointer-events-none" />
              </>
            )}

            {/* Stacked Pages on Right Edge */}
            <div className="absolute inset-y-3 right-0 w-3.5 rounded-r-md book-pages-stack-right pointer-events-none" />
            {/* Leather spine on Left Edge */}
            <div className="absolute inset-y-0 left-0 w-6 bg-black/25 rounded-l-2xl border-r border-white/5 pointer-events-none" />
            {/* Silk Ribbon Bookmark hanging from Top */}
            <div className="absolute top-0 right-14 z-30 book-ribbon pointer-events-none" />
            {/* Inner Gold Foil Frame */}
            <div className="absolute inset-4 sm:inset-5 rounded-xl book-cover-foil-border pointer-events-none" />

            {/* Top Label */}
            <div className="pt-4 z-10">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-amber-500/90 drop-shadow-sm">
                Taleora Edition
              </span>
            </div>

            {/* Center Book Title & Embellishments */}
            <div className="flex flex-col items-center gap-3 z-10 px-4 my-auto">
              <div className="text-amber-500/70 text-xs tracking-widest font-serif drop-shadow-sm">
                ❦ · ❦ · ❦
              </div>
              <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-amber-100 drop-shadow-lg leading-snug">
                {bookTitle}
              </h1>
              <p className="text-xs sm:text-sm font-serif italic text-amber-200/90 mt-1 drop-shadow-sm">
                By {authorName || "Author"}
              </p>
              <div className="mt-2 text-[11px] font-mono uppercase tracking-wider text-amber-400/80 drop-shadow-sm">
                Chapter {chapterNumber} · {chapterTitle}
              </div>
            </div>

            {/* Bottom Open Book Action Button */}
            <div className="pb-4 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBook?.();
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-zinc-950 font-serif font-bold text-xs sm:text-sm shadow-xl flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-amber-400/50"
              >
                <BookOpen className="w-4 h-4" />
                <span>Open Book</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full flex-1 flex items-center justify-center p-2 sm:p-4 md:p-6 select-text book-perspective overflow-hidden">
        {/* Floating Prev Page Chevron (Left Margin) */}
        <button
          type="button"
          onClick={onPrevPage}
          disabled={!hasPrev || isTurning}
          aria-label="Previous Page"
          title="Previous Page (← or Left Click)"
          className={cn(
            "hidden md:flex absolute left-3 lg:left-6 z-40 w-11 h-11 rounded-full items-center justify-center border transition-all duration-200 cursor-pointer shadow-lg",
            "border-border/80 bg-background/90 hover:bg-background hover:scale-105 active:scale-95 text-foreground/80 hover:text-foreground backdrop-blur-xs",
            (!hasPrev || isTurning) && "opacity-25 pointer-events-none"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Floating Next Page Chevron (Right Margin) */}
        <button
          type="button"
          onClick={onNextPage}
          disabled={!hasNext || isTurning}
          aria-label="Next Page"
          title="Next Page (→, Space, or Right Click)"
          className={cn(
            "hidden md:flex absolute right-3 lg:right-6 z-40 w-11 h-11 rounded-full items-center justify-center border transition-all duration-200 cursor-pointer shadow-lg",
            "border-border/80 bg-background/90 hover:bg-background hover:scale-105 active:scale-95 text-foreground/80 hover:text-foreground backdrop-blur-xs",
            (!hasNext || isTurning) && "opacity-25 pointer-events-none"
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Physical Book Cover Casing */}
        <div
          ref={ref}
          className={cn(
            "relative w-full h-[calc(100vh-130px)] sm:h-[calc(100vh-145px)] min-h-[480px] max-h-[820px] rounded-2xl p-1.5 sm:p-2.5 transition-all duration-300 flex items-center justify-center book-cover-casing border",
            coverRimClasses,
            widthClass
          )}
        >
          {/* Stacked Pages Edges (Layered Paper Thickness) */}
          <div className="absolute inset-y-2 left-0 w-2.5 rounded-l-md book-pages-stack-left pointer-events-none" />
          <div className="absolute inset-y-2 right-0 w-2.5 rounded-r-md book-pages-stack-right pointer-events-none" />

          {/* Book Inner Spread Container */}
          <div className="relative w-full h-full flex rounded-xl overflow-hidden book-preserve-3d shadow-inner">
            {/* Silk Ribbon Bookmark at the Top Spine */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 book-ribbon pointer-events-none" />

            {/* TWO-PAGE SPREAD VIEW (Desktop & Tablets) */}
            {isTwoPageMode ? (
              <div className="relative w-full h-full flex book-preserve-3d">
                {/* 1. Base Left Page (Hidden during cover animations to prevent duplicate page) */}
                <div
                  onClick={(e) => {
                    // Only turn page if clicking blank margin, NOT text or during selection
                    const sel = window.getSelection();
                    if (sel && sel.toString().trim().length > 0) return;
                    const target = e.target as HTMLElement;
                    if (target.closest("article, p, mark, h1, h2, a, button, input, header, footer")) return;
                    if (!isTurning) onPrevPage();
                  }}
                  className={cn(
                    "relative w-1/2 h-full border-r border-current/10 overflow-hidden transition-opacity duration-200",
                    (coverState === "opening" || coverState === "closing") ? "opacity-0 pointer-events-none" : "opacity-100",
                    paperClasses
                  )}
                >
                  <SingleBookPageContent
                    pageData={
                      isTurning && turnDirection === "prev"
                        ? prevLeftPageData
                        : leftPageData
                    }
                    displayPageNum={
                      isTurning && turnDirection === "prev"
                        ? prevLeftPageNum
                        : effectiveLeftPageNum
                    }
                    totalPages={totalPages}
                    bookTitle={bookTitle}
                    chapterTitle={chapterTitle}
                    chapterNumber={chapterNumber}
                    settings={settings}
                    highlights={highlights}
                    onSelectHighlight={onSelectHighlight}
                    bookSlug={bookSlug}
                    nextChapter={nextChapter}
                    side="left"
                    isFirstPageOfChapter={effectiveLeftPageNum === 1}
                  />
                </div>

                {/* Center Spine Crease & Inward Gutter Shadow */}
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-10 sm:w-14 z-20 book-spine-crease pointer-events-none" />

                {/* 2. Base Right Page */}
                <div
                  onClick={(e) => {
                    const sel = window.getSelection();
                    if (sel && sel.toString().trim().length > 0) return;
                    const target = e.target as HTMLElement;
                    if (target.closest("article, p, mark, h1, h2, a, button, input, header, footer")) return;
                    if (!isTurning) onNextPage();
                  }}
                  className={cn(
                    "relative w-1/2 h-full border-l border-current/10 overflow-hidden",
                    paperClasses
                  )}
                >
                  <SingleBookPageContent
                    pageData={
                      isTurning && turnDirection === "next"
                        ? nextRightPageData
                        : rightPageData
                    }
                    displayPageNum={
                      isTurning && turnDirection === "next"
                        ? nextRightPageNum
                        : effectiveRightPageNum
                    }
                    totalPages={totalPages}
                    bookTitle={bookTitle}
                    chapterTitle={chapterTitle}
                    chapterNumber={chapterNumber}
                    settings={settings}
                    highlights={highlights}
                    onSelectHighlight={onSelectHighlight}
                    bookSlug={bookSlug}
                    nextChapter={nextChapter}
                    side="right"
                  />
                </div>

                {/* 3. 3D SWINGING COVER LEAF (Folds left page over right page to cleanly close or open) */}
                {(coverState === "opening" || coverState === "closing") && (
                  <div
                    className={cn(
                      "absolute top-0 bottom-0 left-0 w-1/2 z-40 book-preserve-3d pointer-events-none",
                      coverState === "opening" ? "animate-open-cover-leaf" : "animate-close-cover-leaf"
                    )}
                    style={{ transformOrigin: "100% 50%" }}
                  >
                    {/* Front Face (0deg): Current Left Page (Faces reader when open) */}
                    <div
                      className={cn(
                        "absolute inset-0 w-full h-full book-backface-hidden overflow-hidden border-r border-current/10 shadow-2xl",
                        paperClasses
                      )}
                    >
                      <SingleBookPageContent
                        pageData={leftPageData}
                        displayPageNum={effectiveLeftPageNum}
                        totalPages={totalPages}
                        bookTitle={bookTitle}
                        chapterTitle={chapterTitle}
                        chapterNumber={chapterNumber}
                        settings={settings}
                        highlights={highlights}
                        onSelectHighlight={onSelectHighlight}
                        bookSlug={bookSlug}
                        nextChapter={nextChapter}
                        side="left"
                        isFirstPageOfChapter={effectiveLeftPageNum === 1}
                      />
                    </div>

                    {/* Back Face (180deg): Physical Front Cover (Faces reader when closed) */}
                    <div
                      className={cn(
                        "absolute inset-0 w-full h-full book-backface-hidden overflow-hidden rounded-r-xl p-8 flex flex-col justify-between items-center text-center shadow-2xl border",
                        coverRimClasses
                      )}
                      style={{ transform: "rotateY(180deg)" }}
                    >
                      {coverImageUrl && (
                        <>
                          <Image
                            src={coverImageUrl}
                            alt={bookTitle}
                            fill
                            unoptimized={!coverImageUrl.includes(".supabase.co") && !coverImageUrl.startsWith("/")}
                            className="absolute inset-0 w-full h-full object-cover object-center rounded-r-xl pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/40 rounded-r-xl pointer-events-none" />
                        </>
                      )}
                      <div className="absolute inset-4 rounded-xl book-cover-foil-border pointer-events-none" />
                      <div className="absolute top-0 right-10 z-30 book-ribbon pointer-events-none" />
                      <div className="pt-6 select-none text-[10px] uppercase tracking-widest text-amber-500/90 z-10">
                        Taleora Edition
                      </div>
                      <div className="flex flex-col items-center gap-2 my-auto px-4 select-none z-10">
                        <h2 className="font-serif text-2xl font-bold text-amber-100 drop-shadow-md">
                          {bookTitle}
                        </h2>
                        <p className="text-xs font-serif italic text-amber-200/90">
                          By {authorName || "Author"}
                        </p>
                      </div>
                      <div className="pb-6 select-none text-[10px] font-mono uppercase tracking-wider text-amber-400/80 z-10">
                        Chapter {chapterNumber}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. PHYSICAL 3D TURNING LEAF (Active only during page turn animation) */}
                {isTurning && turnDirection === "next" && (
                  <div
                    className="absolute top-0 bottom-0 left-1/2 w-1/2 z-35 book-preserve-3d animate-flip-leaf-next pointer-events-none"
                    style={{ transformOrigin: "0% 50%" }}
                  >
                    {/* Front Face: Current Right Page (Turns away from reader) */}
                    <div
                      className={cn(
                        "absolute inset-0 w-full h-full book-backface-hidden overflow-hidden border-l border-current/10 shadow-2xl",
                        paperClasses
                      )}
                    >
                      <SingleBookPageContent
                        pageData={rightPageData}
                        displayPageNum={effectiveRightPageNum}
                        totalPages={totalPages}
                        bookTitle={bookTitle}
                        chapterTitle={chapterTitle}
                        chapterNumber={chapterNumber}
                        settings={settings}
                        highlights={highlights}
                        onSelectHighlight={onSelectHighlight}
                        bookSlug={bookSlug}
                        nextChapter={nextChapter}
                        side="right"
                      />
                      {/* Dynamic shading on turning front face */}
                      <div className="absolute inset-0 bg-black/10 animate-turning-shadow pointer-events-none" />
                    </div>

                    {/* Back Face: Next Left Page (Lands facing reader on left side) */}
                    <div
                      className={cn(
                        "absolute inset-0 w-full h-full book-backface-hidden overflow-hidden border-r border-current/10 shadow-2xl",
                        paperClasses
                      )}
                      style={{ transform: "rotateY(180deg)" }}
                    >
                      <SingleBookPageContent
                        pageData={pages[nextLeftPageNum - 1] || null}
                        displayPageNum={nextLeftPageNum}
                        totalPages={totalPages}
                        bookTitle={bookTitle}
                        chapterTitle={chapterTitle}
                        chapterNumber={chapterNumber}
                        settings={settings}
                        highlights={highlights}
                        onSelectHighlight={onSelectHighlight}
                        bookSlug={bookSlug}
                        nextChapter={nextChapter}
                        side="left"
                      />
                      {/* Dynamic shading on turning back face */}
                      <div className="absolute inset-0 bg-black/10 animate-turning-shadow pointer-events-none" />
                    </div>
                  </div>
                )}

                {isTurning && turnDirection === "prev" && (
                  <div
                    className="absolute top-0 bottom-0 right-1/2 w-1/2 z-35 book-preserve-3d animate-flip-leaf-prev pointer-events-none"
                    style={{ transformOrigin: "100% 50%" }}
                  >
                    {/* Front Face: Current Left Page (Turns back to the right) */}
                    <div
                      className={cn(
                        "absolute inset-0 w-full h-full book-backface-hidden overflow-hidden border-r border-current/10 shadow-2xl",
                        paperClasses
                      )}
                    >
                      <SingleBookPageContent
                        pageData={leftPageData}
                        displayPageNum={effectiveLeftPageNum}
                        totalPages={totalPages}
                        bookTitle={bookTitle}
                        chapterTitle={chapterTitle}
                        chapterNumber={chapterNumber}
                        settings={settings}
                        highlights={highlights}
                        onSelectHighlight={onSelectHighlight}
                        bookSlug={bookSlug}
                        nextChapter={nextChapter}
                        side="left"
                      />
                      <div className="absolute inset-0 bg-black/10 animate-turning-shadow pointer-events-none" />
                    </div>

                    {/* Back Face: Previous Right Page (Lands facing reader on right side) */}
                    <div
                      className={cn(
                        "absolute inset-0 w-full h-full book-backface-hidden overflow-hidden border-l border-current/10 shadow-2xl",
                        paperClasses
                      )}
                      style={{ transform: "rotateY(180deg)" }}
                    >
                      <SingleBookPageContent
                        pageData={prevRightPageData}
                        displayPageNum={prevRightPageNum}
                        totalPages={totalPages}
                        bookTitle={bookTitle}
                        chapterTitle={chapterTitle}
                        chapterNumber={chapterNumber}
                        settings={settings}
                        highlights={highlights}
                        onSelectHighlight={onSelectHighlight}
                        bookSlug={bookSlug}
                        nextChapter={nextChapter}
                        side="right"
                      />
                      <div className="absolute inset-0 bg-black/10 animate-turning-shadow pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* SINGLE PAGE VIEW (Mobile / Narrow Screens or User Option) */
              <div className="relative w-full h-full book-preserve-3d">
                <div className={cn("relative w-full h-full overflow-hidden", paperClasses)}>
                  {/* Left Spine Crease */}
                  <div className="absolute inset-y-0 left-0 w-8 z-20 book-spine-crease pointer-events-none" />

                  <SingleBookPageContent
                    pageData={page}
                    displayPageNum={pageNumber}
                    totalPages={totalPages}
                    bookTitle={bookTitle}
                    chapterTitle={chapterTitle}
                    chapterNumber={chapterNumber}
                    settings={settings}
                    highlights={highlights}
                    onSelectHighlight={onSelectHighlight}
                    bookSlug={bookSlug}
                    nextChapter={nextChapter}
                    side="single"
                    isFirstPageOfChapter={pageNumber === 1}
                  />
                </div>

                {/* 3D Page Curl for Single Page Mode */}
                {isTurning && turnDirection === "next" && (
                  <div
                    className="absolute inset-0 z-35 book-preserve-3d animate-flip-leaf-next pointer-events-none"
                    style={{ transformOrigin: "0% 50%" }}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 w-full h-full book-backface-hidden overflow-hidden shadow-2xl",
                        paperClasses
                      )}
                    >
                      <SingleBookPageContent
                        pageData={page}
                        displayPageNum={pageNumber}
                        totalPages={totalPages}
                        bookTitle={bookTitle}
                        chapterTitle={chapterTitle}
                        chapterNumber={chapterNumber}
                        settings={settings}
                        highlights={highlights}
                        onSelectHighlight={onSelectHighlight}
                        bookSlug={bookSlug}
                        nextChapter={nextChapter}
                        side="single"
                      />
                      <div className="absolute inset-0 bg-black/15 animate-turning-shadow pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* 3D SWINGING COVER LEAF (Single page mode) */}
                {(coverState === "opening" || coverState === "closing") && (
                  <div
                    className={cn(
                      "absolute inset-0 z-40 book-preserve-3d pointer-events-none",
                      coverState === "opening" ? "animate-open-cover-single" : "animate-close-cover-single"
                    )}
                    style={{ transformOrigin: "0% 50%" }}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 w-full h-full book-backface-hidden overflow-hidden rounded-xl p-8 flex flex-col justify-between items-center text-center shadow-2xl border",
                        coverRimClasses
                      )}
                    >
                      {coverImageUrl && (
                        <>
                          <Image
                            src={coverImageUrl}
                            alt={bookTitle}
                            fill
                            unoptimized={!coverImageUrl.includes(".supabase.co") && !coverImageUrl.startsWith("/")}
                            className="absolute inset-0 w-full h-full object-cover object-center rounded-xl pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/40 rounded-xl pointer-events-none" />
                        </>
                      )}
                      <div className="absolute inset-4 rounded-xl book-cover-foil-border pointer-events-none" />
                      <div className="absolute top-0 right-10 z-30 book-ribbon pointer-events-none" />
                      <div className="pt-6 select-none text-[10px] uppercase tracking-widest text-amber-500/90 z-10">
                        Taleora Edition
                      </div>
                      <div className="flex flex-col items-center gap-2 my-auto px-4 select-none z-10">
                        <h2 className="font-serif text-2xl font-bold text-amber-100 drop-shadow-md">
                          {bookTitle}
                        </h2>
                        <p className="text-xs font-serif italic text-amber-200/90">
                          By {authorName || "Author"}
                        </p>
                      </div>
                      <div className="pb-6 select-none text-[10px] font-mono uppercase tracking-wider text-amber-400/80 z-10">
                        Chapter {chapterNumber}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
