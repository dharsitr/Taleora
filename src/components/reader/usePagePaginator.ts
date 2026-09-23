"use client";

import * as React from "react";
import { ReaderSettings } from "@/types/books";

export interface PageChunk {
  paragraphIndex: number;
  text: string;
  isDropCap?: boolean;
  isContinuedFromPrev?: boolean;
  isContinuedOnNext?: boolean;
  startCharOffset: number;
}

export interface BookPage {
  pageNumber: number; // 1-indexed: 1, 2, ..., totalPages
  chunks: PageChunk[];
  startParagraphIndex: number;
  endParagraphIndex: number;
}

interface UsePagePaginatorOptions {
  content: string;
  settings: ReaderSettings;
  containerRef: React.RefObject<HTMLDivElement | null>;
  initialParagraphIndex?: number | null;
  initialPageIndex?: number | null;
}

/**
 * Extracts paragraphs from content, correctly supporting double newlines or single newlines.
 */
export function splitContentIntoParagraphs(content: string): string[] {
  if (!content) return [];
  if (content.includes("\n\n")) {
    return content.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
  }
  return content.split(/\r?\n/).map((p) => p.trim()).filter(Boolean);
}

/**
 * Splits text into sentences cleanly at punctuation boundaries without cutting words.
 */
function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  // Match sentence ending with punctuation followed by space or end of string
  const matches = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g);
  if (matches && matches.length > 0) {
    return matches.map((s) => s.trim()).filter(Boolean);
  }
  return [text];
}

export function usePagePaginator({
  content,
  settings,
  containerRef,
  initialParagraphIndex = null,
  initialPageIndex = null,
}: UsePagePaginatorOptions) {
  const [pages, setPages] = React.useState<BookPage[]>([]);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [isPaginating, setIsPaginating] = React.useState<boolean>(true);

  // Active anchor paragraph index to preserve reading position across font/window reflows
  const activeAnchorRef = React.useRef<{
    paragraphIndex: number;
    fraction: number;
  }>({
    paragraphIndex: initialParagraphIndex ?? 0,
    fraction: 0,
  });

  // Reset anchor and page to 1 when navigating to a new chapter's content
  const prevContentRef = React.useRef(content);
  React.useEffect(() => {
    if (prevContentRef.current !== content) {
      prevContentRef.current = content;
      activeAnchorRef.current = {
        paragraphIndex: initialParagraphIndex ?? 0,
        fraction: 0,
      };
      setCurrentPage(initialPageIndex ?? 1);
    }
  }, [content, initialParagraphIndex, initialPageIndex]);

  const paragraphs = React.useMemo(() => {
    return splitContentIntoParagraphs(content);
  }, [content]);

  // Core Pagination Engine
  const paginate = React.useCallback(() => {
    if (!containerRef.current || paragraphs.length === 0) {
      setPages([
        {
          pageNumber: 1,
          chunks: paragraphs.map((p, idx) => ({
            paragraphIndex: idx,
            text: p,
            startCharOffset: 0,
          })),
          startParagraphIndex: 0,
          endParagraphIndex: Math.max(0, paragraphs.length - 1),
        },
      ]);
      setIsPaginating(false);
      return;
    }

    const container = containerRef.current;
    // Available width and height for prose content inside the book page
    const clientWidth = container.clientWidth;
    const clientHeight = container.clientHeight;

    if (clientWidth <= 0 || clientHeight <= 0) {
      return;
    }

    // Detect if reading in two-page spread mode
    const isTwoPage = (settings.pageLayout === "spread" || !settings.pageLayout) && clientWidth >= 768;

    // Available width for prose content on an individual book page (accommodates larger padding)
    const horizontalPadding = isTwoPage
      ? (clientWidth >= 1280 ? 104 : clientWidth >= 1024 ? 92 : 76)
      : (clientWidth >= 640 ? 76 : 48);

    const availableWidth = isTwoPage
      ? Math.max(260, Math.floor((clientWidth - 40) / 2) - horizontalPadding)
      : Math.max(280, clientWidth - horizontalPadding);

    // Reserve vertical space for running page header (~44px), running page footer (~44px), and page padding (~48px)
    const availableHeight = Math.max(280, clientHeight - 110);

    // Font classes & styles matching Reader settings
    const fontClass =
      settings.fontFamily === "sans"
        ? "font-sans"
        : settings.fontFamily === "mono"
        ? "font-mono"
        : "font-serif";

    // Create offscreen measurement container with identical styles
    const measureSandbox = document.createElement("div");
    measureSandbox.setAttribute("aria-hidden", "true");
    measureSandbox.className = `${fontClass} select-none invisible`;
    measureSandbox.style.position = "absolute";
    measureSandbox.style.left = "-9999px";
    measureSandbox.style.top = "-9999px";
    measureSandbox.style.width = `${availableWidth}px`;
    measureSandbox.style.fontSize = `${settings.fontSize}px`;
    measureSandbox.style.lineHeight = `${settings.lineHeight}`;
    measureSandbox.style.wordBreak = "break-word";
    measureSandbox.style.overflowWrap = "break-word";
    document.body.appendChild(measureSandbox);

    try {
      const paragraphSpacing = Math.round(settings.fontSize * 1.15); // ~gap between paragraphs
      const calculatedPages: BookPage[] = [];

      let currentChunks: PageChunk[] = [];
      let currentHeight = 0;
      let pageNum = 1;

      const finishCurrentPage = () => {
        if (currentChunks.length > 0) {
          const firstChunk = currentChunks[0];
          const lastChunk = currentChunks[currentChunks.length - 1];
          calculatedPages.push({
            pageNumber: pageNum,
            chunks: currentChunks,
            startParagraphIndex: firstChunk.paragraphIndex,
            endParagraphIndex: lastChunk.paragraphIndex,
          });
          pageNum++;
          currentChunks = [];
          currentHeight = 0;
        }
      };

      for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
        const text = paragraphs[pIdx];
        const isChapterOpening = pIdx === 0 && pageNum === 1;

        // Measure entire paragraph
        measureSandbox.innerText = text;
        let pHeight = measureSandbox.getBoundingClientRect().height;
        if (isChapterOpening) {
          // Drop cap on first page has extra decorative breathing room
          pHeight += settings.fontSize * 1.2;
        }

        const addedMargin = currentChunks.length > 0 ? paragraphSpacing : 0;

        // Case A: Entire paragraph fits on current page
        if (currentHeight + addedMargin + pHeight <= availableHeight) {
          currentChunks.push({
            paragraphIndex: pIdx,
            text,
            isDropCap: isChapterOpening,
            startCharOffset: 0,
          });
          currentHeight += addedMargin + pHeight;
        }
        // Case B: Does not fit on current page, but fits on a fresh page
        else if (pHeight <= availableHeight) {
          finishCurrentPage();
          currentChunks.push({
            paragraphIndex: pIdx,
            text,
            isDropCap: pIdx === 0 && pageNum === 1,
            startCharOffset: 0,
          });
          currentHeight = pHeight;
        }
        // Case C: Huge paragraph exceeding the full height of an entire page
        // Split cleanly by sentences so NO words are severed
        else {
          const sentences = splitIntoSentences(text);
          let currentSentenceSlice: string[] = [];
          let currentSentenceStartOffset = 0;
          let isContinuing = false;

          for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
            const candidateSentences = [...currentSentenceSlice, sentences[sIdx]].join(" ");
            measureSandbox.innerText = candidateSentences;
            const candidateHeight = measureSandbox.getBoundingClientRect().height;
            const candidateMargin = currentChunks.length > 0 ? paragraphSpacing : 0;

            if (currentHeight + candidateMargin + candidateHeight <= availableHeight) {
              currentSentenceSlice.push(sentences[sIdx]);
            } else {
              // Current page is full; flush existing sentence slice if any
              if (currentSentenceSlice.length > 0) {
                const chunkText = currentSentenceSlice.join(" ");
                currentChunks.push({
                  paragraphIndex: pIdx,
                  text: chunkText,
                  isDropCap: isChapterOpening && !isContinuing,
                  isContinuedFromPrev: isContinuing,
                  isContinuedOnNext: true,
                  startCharOffset: currentSentenceStartOffset,
                });
                currentSentenceStartOffset += chunkText.length + 1;
                isContinuing = true;
                currentSentenceSlice = [];
              }
              finishCurrentPage();
              currentSentenceSlice.push(sentences[sIdx]);
              measureSandbox.innerText = sentences[sIdx];
              currentHeight = measureSandbox.getBoundingClientRect().height;
            }
          }

          if (currentSentenceSlice.length > 0) {
            const chunkText = currentSentenceSlice.join(" ");
            measureSandbox.innerText = chunkText;
            const remHeight = measureSandbox.getBoundingClientRect().height;
            currentChunks.push({
              paragraphIndex: pIdx,
              text: chunkText,
              isContinuedFromPrev: isContinuing,
              isContinuedOnNext: false,
              startCharOffset: currentSentenceStartOffset,
            });
            currentHeight += (currentChunks.length > 1 ? paragraphSpacing : 0) + remHeight;
          }
        }
      }

      finishCurrentPage();

      const finalPages = calculatedPages.length > 0 ? calculatedPages : [
        {
          pageNumber: 1,
          chunks: paragraphs.map((p, idx) => ({
            paragraphIndex: idx,
            text: p,
            startCharOffset: 0,
          })),
          startParagraphIndex: 0,
          endParagraphIndex: Math.max(0, paragraphs.length - 1),
        },
      ];

      setPages(finalPages);

      // Restore user position after re-pagination:
      // Find the page containing the saved anchor paragraph
      const targetAnchor = activeAnchorRef.current.paragraphIndex;
      let matchedPage = 1;

      for (let i = 0; i < finalPages.length; i++) {
        const p = finalPages[i];
        if (targetAnchor >= p.startParagraphIndex && targetAnchor <= p.endParagraphIndex) {
          matchedPage = p.pageNumber;
          break;
        }
      }

      setCurrentPage((prev) => {
        if (initialPageIndex && prev === 1) {
          return Math.min(finalPages.length, Math.max(1, initialPageIndex));
        }
        return Math.min(finalPages.length, Math.max(1, matchedPage));
      });

      setIsPaginating(false);
    } finally {
      if (measureSandbox.parentNode) {
        document.body.removeChild(measureSandbox);
      }
    }
  }, [
    containerRef,
    paragraphs,
    settings.fontSize,
    settings.lineHeight,
    settings.fontFamily,
    settings.pageLayout,
    initialPageIndex,
  ]);

  // Trigger pagination on mount and settings change
  React.useEffect(() => {
    // Allow DOM to settle before measuring
    const timer = setTimeout(() => {
      setIsPaginating(true);
      paginate();
    }, 40);
    return () => clearTimeout(timer);
  }, [paginate]);


  // Handle ResizeObserver for responsive screen dimensions
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let resizeTimer: NodeJS.Timeout;
    const observer = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        paginate();
      }, 100);
    });

    observer.observe(el);
    return () => {
      clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [containerRef, paginate]);

  // Keep track of active paragraph on current page for reflow anchor preservation
  React.useEffect(() => {
    const currentPageObj = pages[currentPage - 1];
    if (currentPageObj) {
      activeAnchorRef.current = {
        paragraphIndex: currentPageObj.startParagraphIndex,
        fraction: pages.length > 1 ? (currentPage - 1) / (pages.length - 1) : 0,
      };
    }
  }, [currentPage, pages]);

  // Navigation Methods
  const totalPages = Math.max(1, pages.length);

  const goToNextPage = React.useCallback((): boolean => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
      return true;
    }
    return false; // Already at end
  }, [currentPage, totalPages]);

  const goToPrevPage = React.useCallback((): boolean => {
    if (currentPage > 1) {
      setCurrentPage((prev) => Math.max(1, prev - 1));
      return true;
    }
    return false; // Already at beginning
  }, [currentPage]);

  const goToPage = React.useCallback(
    (pageNum: number) => {
      const clamped = Math.min(totalPages, Math.max(1, pageNum));
      setCurrentPage(clamped);
    },
    [totalPages]
  );

  const jumpToParagraph = React.useCallback(
    (paragraphIndex: number) => {
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (
          paragraphIndex >= page.startParagraphIndex &&
          paragraphIndex <= page.endParagraphIndex
        ) {
          setCurrentPage(page.pageNumber);
          return page.pageNumber;
        }
      }
      return 1;
    },
    [pages]
  );

  return {
    pages,
    currentPage,
    totalPages,
    currentPageData: pages[currentPage - 1] || null,
    isPaginating,
    goToNextPage,
    goToPrevPage,
    goToPage,
    jumpToParagraph,
    rePaginate: paginate,
  };
}
