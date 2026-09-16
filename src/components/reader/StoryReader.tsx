"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChapterReaderData,
  ReaderSettings,
  BookmarkWithDetails,
  HighlightColor,
  HighlightRow,
} from "@/types/books";
import { useAuth } from "@/lib/auth/use-auth";
import {
  getUserBookmarks,
  createBookmark,
  deleteBookmark,
  getChapterHighlights,
  createHighlight,
  updateHighlightNote,
  deleteHighlight,
} from "@/lib/books/queries";
import {
  saveHybridReadingProgress,
  recordHybridReadingSession,
} from "@/lib/offline/sync";
import { ReaderHeader } from "./ReaderHeader";
import { ReaderProgressBar } from "./ReaderProgressBar";
import { ReaderSettingsDrawer } from "./ReaderSettingsDrawer";
import { ChapterDrawer } from "./ChapterDrawer";
import { HighlightToolbar } from "./HighlightToolbar";
import { HighlightNoteModal } from "./HighlightNoteModal";
import { ReaderBookmarksDrawer } from "./ReaderBookmarksDrawer";
import { BookCanvas } from "./BookCanvas";
import { usePagePaginator, splitContentIntoParagraphs } from "./usePagePaginator";
import { cn } from "@/lib/utils";

interface StoryReaderProps {
  data: ChapterReaderData;
  isOfflineInitial?: boolean;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: "light",
  fontSize: 18,
  lineHeight: 1.8,
  width: "standard",
  fontFamily: "serif",
  zenMode: false,
  pageLayout: "spread",
};

const STORAGE_KEY = "taleora-reader-settings";

function subscribeReaderSettings(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("taleora-reader-settings-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("taleora-reader-settings-change", callback);
  };
}

function getSettingsSnapshot(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function getServerSettingsSnapshot(): string {
  return "";
}

function useReaderSettings(): [
  ReaderSettings,
  (newSettings: Partial<ReaderSettings>) => void
] {
  const raw = React.useSyncExternalStore(
    subscribeReaderSettings,
    getSettingsSnapshot,
    getServerSettingsSnapshot
  );

  const [localOverrides, setLocalOverrides] = React.useState<
    Partial<ReaderSettings>
  >({});

  const settings = React.useMemo(() => {
    let saved: Partial<ReaderSettings> = {};
    if (raw) {
      try {
        saved = JSON.parse(raw);
      } catch {
        // Ignore JSON parse error
      }
    }
    return { ...DEFAULT_SETTINGS, ...saved, ...localOverrides };
  }, [raw, localOverrides]);

  const updateSettings = React.useCallback(
    (newSettings: Partial<ReaderSettings>) => {
      setLocalOverrides((prev) => ({ ...prev, ...newSettings }));
      try {
        const current = localStorage.getItem(STORAGE_KEY);
        const parsed = current ? JSON.parse(current) : {};
        const merged = { ...parsed, ...newSettings };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new Event("taleora-reader-settings-change"));
      } catch {
        // Ignore write errors
      }
    },
    []
  );

  return [settings, updateSettings];
}

export function StoryReader({ data, isOfflineInitial = false }: StoryReaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isOffline, setIsOffline] = React.useState(isOfflineInitial);

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const [activeChapterId, setActiveChapterId] = React.useState(data.currentChapter.id);

  React.useEffect(() => {
    setActiveChapterId(data.currentChapter.id);
  }, [data.currentChapter.id]);

  const { book, allChapters } = data;
  const currentChapter = React.useMemo(() => {
    return allChapters.find((c) => c.id === activeChapterId) || data.currentChapter;
  }, [allChapters, activeChapterId, data.currentChapter]);

  const currentIdx = React.useMemo(() => {
    return allChapters.findIndex((c) => c.id === currentChapter.id);
  }, [allChapters, currentChapter.id]);

  const prevChapter = currentIdx > 0 ? allChapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < allChapters.length - 1 ? allChapters[currentIdx + 1] : null;

  const navigateToChapter = React.useCallback(
    (targetChapter: typeof currentChapter) => {
      if (isOffline || (typeof navigator !== "undefined" && !navigator.onLine)) {
        setActiveChapterId(targetChapter.id);
        if (typeof window !== "undefined") {
          window.history.pushState(null, "", `/read/${book.slug}/${targetChapter.slug}`);
        }
      } else {
        router.push(`/read/${book.slug}/${targetChapter.slug}`);
      }
    },
    [isOffline, book.slug, router]
  );

  const [settings, handleUpdateSettings] = useReaderSettings();
  const [chapterDrawerOpen, setChapterDrawerOpen] = React.useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = React.useState(false);
  const [annotationsDrawerOpen, setAnnotationsDrawerOpen] = React.useState(false);

  // Annotations state
  const [bookmarks, setBookmarks] = React.useState<BookmarkWithDetails[]>([]);
  const [highlights, setHighlights] = React.useState<HighlightRow[]>([]);
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [isBookmarking, setIsBookmarking] = React.useState(false);

  // Selection & Toolbar state
  const [toolbarPosition, setToolbarPosition] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const [pendingSelection, setPendingSelection] = React.useState<{
    paragraphIndex: number;
    startOffset: number;
    endOffset: number;
    text: string;
  } | null>(null);

  // Note Modal state
  const [noteModalOpen, setNoteModalOpen] = React.useState(false);
  const [activeHighlightForModal, setActiveHighlightForModal] =
    React.useState<HighlightRow | null>(null);

  // 3D Page Turn Animation State
  const [isTurning, setIsTurning] = React.useState<boolean>(false);
  const [turnDirection, setTurnDirection] = React.useState<"next" | "prev" | null>(null);

  // Book Cover Physical State ("closed" = showing cover, "opening" = 3D swinging open, "open" = reading pages, "closing" = 3D swinging shut)
  const [bookCoverState, setBookCoverState] = React.useState<
    "closed" | "opening" | "open" | "closing"
  >(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("p") || (params.get("page") && Number(params.get("page")) > 1)) {
        return "open";
      }
    }
    return "closed";
  });

  const handleOpenBook = React.useCallback(() => {
    setBookCoverState("opening");
    setTimeout(() => {
      setBookCoverState("open");
    }, 560);
  }, []);

  const handleCloseAndExit = React.useCallback(() => {
    if (bookCoverState === "closed" || bookCoverState === "closing") {
      router.push(`/books/${book.slug}`);
      return;
    }
    setBookCoverState("closing");
    setTimeout(() => {
      setBookCoverState("closed");
      setTimeout(() => {
        router.push(`/books/${book.slug}`);
      }, 180);
    }, 560);
  }, [bookCoverState, router, book.slug]);

  // Canvas Container Ref for Dynamic Measurement
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Read initial query params for deep linking (?p=paragraph or ?page=X)
  const initialParams = React.useMemo(() => {
    if (typeof window === "undefined") return { pIndex: null, pageIndex: null };
    const params = new URLSearchParams(window.location.search);
    const p = params.get("p");
    const page = params.get("page");

    // Also check cached page in localStorage if not specified in URL
    let cachedPage: number | null = null;
    try {
      const stored = localStorage.getItem(`taleora-reading-page-${book.id}-${currentChapter.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.page && typeof parsed.page === "number") {
          cachedPage = parsed.page;
        }
      }
    } catch {
      // Ignore read errors
    }

    return {
      pIndex: p !== null ? parseInt(p, 10) : null,
      pageIndex: page !== null ? parseInt(page, 10) : cachedPage,
    };
  }, [book.id, currentChapter.id]);

  // Dynamic chapter text hydration if server did not include it
  const [chapterContent, setChapterContent] = React.useState(
    currentChapter.content || ""
  );
  const [isFetchingContent, setIsFetchingContent] = React.useState(
    !currentChapter.content || currentChapter.content.trim() === ""
  );

  React.useEffect(() => {
    if (currentChapter.content && currentChapter.content.trim() !== "") {
      setChapterContent(currentChapter.content);
      setIsFetchingContent(false);
      return;
    }

    let isMounted = true;
    setIsFetchingContent(true);

    import("@/lib/books/chapter-storage")
      .then(({ getChapterContentWithFallback }) => {
        getChapterContentWithFallback(book.slug, currentChapter.slug)
          .then((text) => {
            if (isMounted && text) {
              setChapterContent(text);
            }
          })
          .finally(() => {
            if (isMounted) setIsFetchingContent(false);
          });
      })
      .catch(() => {
        if (isMounted) setIsFetchingContent(false);
      });

    return () => {
      isMounted = false;
    };
  }, [book.slug, currentChapter.slug, currentChapter.content]);

  // Hook up Pagination Engine
  const {
    pages,
    currentPage,
    totalPages,
    currentPageData,
    goToPage,
    jumpToParagraph,
  } = usePagePaginator({
    content: chapterContent,
    settings,
    containerRef,
    initialParagraphIndex: initialParams.pIndex,
    initialPageIndex: initialParams.pageIndex,
  });

  // Calculate Chapter & Book Progress
  const progressPercentage = React.useMemo(() => {
    if (totalPages <= 1) return 100;
    return Math.min(100, Math.max(0, Math.round((currentPage / totalPages) * 100)));
  }, [currentPage, totalPages]);

  // Load Bookmarks for the current book
  React.useEffect(() => {
    if (!user) return;
    let isMounted = true;

    getUserBookmarks(user.id, book.id)
      .then((res) => {
        if (isMounted) {
          setBookmarks(res);
        }
      })
      .catch((err) => console.error("Error loading bookmarks:", err));

    return () => {
      isMounted = false;
    };
  }, [user, book.id]);

  // Load Highlights for current chapter
  React.useEffect(() => {
    if (!user) return;
    let isMounted = true;

    getChapterHighlights(user.id, currentChapter.id)
      .then((res) => {
        if (isMounted) {
          setHighlights(res);
        }
      })
      .catch((err) => console.error("Error loading highlights:", err));

    return () => {
      isMounted = false;
    };
  }, [user, currentChapter.id]);

  // Handle Deep Linking from query param (?p=index) once paginated
  React.useEffect(() => {
    if (initialParams.pIndex !== null && pages.length > 0) {
      jumpToParagraph(initialParams.pIndex);
      setTimeout(() => {
        const el = document.getElementById(`p-${initialParams.pIndex}`);
        if (el) {
          el.classList.add("bg-primary/20", "rounded-md", "transition-colors");
          setTimeout(() => el.classList.remove("bg-primary/20"), 2500);
        }
      }, 200);
    }
  }, [initialParams.pIndex, pages.length, jumpToParagraph]);

  // Detect if reader is in two-page spread mode
  const [isDesktopScreen, setIsDesktopScreen] = React.useState(true);
  React.useEffect(() => {
    const check = () => setIsDesktopScreen(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isTwoPage =
    (settings.pageLayout === "spread" || !settings.pageLayout) && isDesktopScreen;

  // Page Turn Actions with 3D Flip
  const handleNextPage = React.useCallback(() => {
    if (isTurning) return;

    const effectivePage = isTwoPage
      ? currentPage % 2 === 0
        ? Math.max(1, currentPage - 1)
        : currentPage
      : currentPage;

    const step = isTwoPage ? 2 : 1;
    const targetPage = effectivePage + step;

    if (effectivePage < totalPages && (isTwoPage ? effectivePage + 1 <= totalPages : true)) {
      setTurnDirection("next");
      setIsTurning(true);
      setTimeout(() => {
        goToPage(Math.min(totalPages, targetPage));
        setIsTurning(false);
      }, 580);
    } else if (nextChapter) {
      navigateToChapter(nextChapter);
    }
  }, [
    isTurning,
    isTwoPage,
    currentPage,
    totalPages,
    goToPage,
    nextChapter,
    navigateToChapter,
  ]);

  const handlePrevPage = React.useCallback(() => {
    if (isTurning) return;

    const effectivePage = isTwoPage
      ? currentPage % 2 === 0
        ? Math.max(1, currentPage - 1)
        : currentPage
      : currentPage;

    const step = isTwoPage ? 2 : 1;
    const targetPage = effectivePage - step;

    if (effectivePage > 1) {
      setTurnDirection("prev");
      setIsTurning(true);
      setTimeout(() => {
        goToPage(Math.max(1, targetPage));
        setIsTurning(false);
      }, 580);
    } else if (prevChapter) {
      navigateToChapter(prevChapter);
    }
  }, [
    isTurning,
    isTwoPage,
    currentPage,
    goToPage,
    prevChapter,
    navigateToChapter,
  ]);

  // Sync Reading Progress with Supabase and localStorage (debounced)
  React.useEffect(() => {
    // Cache current page position in localStorage
    try {
      localStorage.setItem(
        `taleora-reading-page-${book.id}-${currentChapter.id}`,
        JSON.stringify({
          page: currentPage,
          totalPages,
          percentage: progressPercentage,
          timestamp: Date.now(),
        })
      );
    } catch {
      // Ignore cache write error
    }

    if (!user) return;

    const timer = setTimeout(() => {
      const chapterIndex = currentChapter.chapter_number - 1;
      const totalChapters = Math.max(1, book.total_chapters || allChapters.length);
      const chapterWeight = 100 / totalChapters;
      const chapterFraction = (currentPage / totalPages) * chapterWeight;
      const totalProgress = Math.min(
        100,
        chapterIndex * chapterWeight + chapterFraction
      );

      const isBookCompleted =
        currentChapter.chapter_number === allChapters.length &&
        currentPage === totalPages;

      if (user) {
        saveHybridReadingProgress(
          user.id,
          book.id,
          currentChapter.id,
          totalProgress,
          isBookCompleted,
          currentPage
        );
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    user,
    book.id,
    book.total_chapters,
    currentChapter,
    allChapters.length,
    currentPage,
    totalPages,
    progressPercentage,
  ]);

  // Active Reading Session Tracker (Phase 10)
  const accumulatedSecondsRef = React.useRef<number>(0);
  const sessionPagesTurnedRef = React.useRef<number>(0);
  const lastPageRef = React.useRef<number>(currentPage);

  // Track page turns during active reading
  React.useEffect(() => {
    if (currentPage !== lastPageRef.current) {
      sessionPagesTurnedRef.current += Math.max(1, Math.abs(currentPage - lastPageRef.current));
      lastPageRef.current = currentPage;
    }
  }, [currentPage]);

  // Track active time and periodically sync reading sessions
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let isActive = true;

    const onVisibilityChange = () => {
      isActive = document.visibilityState === "visible";
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    interval = setInterval(() => {
      if (isActive && bookCoverState === "open") {
        accumulatedSecondsRef.current += 5;

        // Every 45s of active reading, record session to database
        if (accumulatedSecondsRef.current >= 45 && user) {
          const secondsToSync = accumulatedSecondsRef.current;
          const pagesToSync = sessionPagesTurnedRef.current;
          accumulatedSecondsRef.current = 0;
          sessionPagesTurnedRef.current = 0;

          recordHybridReadingSession(
            user.id,
            book.id,
            currentChapter.id,
            secondsToSync,
            Math.max(1, pagesToSync)
          );
        }
      }
    }, 5000);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      // On unmount / chapter change, sync any remaining accumulated time (>= 10s)
      if (accumulatedSecondsRef.current >= 10 && user) {
        recordHybridReadingSession(
          user.id,
          book.id,
          currentChapter.id,
          accumulatedSecondsRef.current,
          Math.max(1, sessionPagesTurnedRef.current)
        );
      }
    };
  }, [user, book.id, currentChapter.id, bookCoverState]);

  // Touch Swipe Detection for Mobile / Tablet Reading
  const touchCoords = React.useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchCoords.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, []);

  const handleTouchEnd = React.useCallback(
    (e: React.TouchEvent) => {
      if (!touchCoords.current) return;
      const deltaX = e.changedTouches[0].clientX - touchCoords.current.x;
      const deltaY = e.changedTouches[0].clientY - touchCoords.current.y;

      // Horizontal swipe threshold: at least 45px distance and dominantly horizontal
      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
        if (deltaX < 0) {
          // Swipe left -> Next Page
          handleNextPage();
        } else {
          // Swipe right -> Previous Page
          handlePrevPage();
        }
      }

      touchCoords.current = null;
    },
    [handleNextPage, handlePrevPage]
  );

  // Keyboard Navigation: Arrows, PageUp/PageDown, Space, Zen mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        chapterDrawerOpen ||
        settingsDrawerOpen ||
        annotationsDrawerOpen ||
        noteModalOpen
      ) {
        return;
      }

      // If book is closed, space/enter opens the book
      if (bookCoverState === "closed") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpenBook();
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          handleCloseAndExit();
          return;
        }
        return;
      }

      if (bookCoverState !== "open") {
        return;
      }

      // Next Page: ArrowRight, PageDown, Space, 'd', 'l'
      if (
        (e.key === "ArrowRight" && !e.shiftKey) ||
        e.key === "PageDown" ||
        (e.key === " " && !e.shiftKey) ||
        e.key === "d" ||
        e.key === "D" ||
        e.key === "l" ||
        e.key === "L"
      ) {
        e.preventDefault();
        handleNextPage();
      }
      // Previous Page: ArrowLeft, PageUp, Shift+Space, 'a', 'h'
      else if (
        (e.key === "ArrowLeft" && !e.shiftKey) ||
        e.key === "PageUp" ||
        (e.key === " " && e.shiftKey) ||
        e.key === "a" ||
        e.key === "A" ||
        e.key === "h" ||
        e.key === "H"
      ) {
        e.preventDefault();
        handlePrevPage();
      }
      // Home: First Page
      else if (e.key === "Home") {
        e.preventDefault();
        goToPage(1);
      }
      // End: Last Page
      else if (e.key === "End") {
        e.preventDefault();
        goToPage(totalPages);
      }
      // Chapter Navigation: Shift + ArrowRight / Shift + ArrowLeft
      else if (e.key === "ArrowRight" && e.shiftKey && nextChapter) {
        e.preventDefault();
        navigateToChapter(nextChapter);
      } else if (e.key === "ArrowLeft" && e.shiftKey && prevChapter) {
        e.preventDefault();
        navigateToChapter(prevChapter);
      }
      // Zen Mode: 'f' / 'F'
      else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        handleUpdateSettings({ zenMode: !settings.zenMode });
      }
      // Escape: exit Zen mode or clear active selection
      else if (e.key === "Escape") {
        if (settings.zenMode) {
          handleUpdateSettings({ zenMode: false });
        }
        setToolbarPosition(null);
        setPendingSelection(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    chapterDrawerOpen,
    settingsDrawerOpen,
    annotationsDrawerOpen,
    noteModalOpen,
    bookCoverState,
    handleOpenBook,
    handleCloseAndExit,
    settings.zenMode,
    nextChapter,
    prevChapter,
    book.slug,
    router,
    handleNextPage,
    handlePrevPage,
    goToPage,
    totalPages,
    handleUpdateSettings,
    navigateToChapter,
  ]);

  // Handle Text Selection in Active Book Page
  const handleTextSelection = React.useCallback(() => {
    if (typeof window === "undefined") return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 2) {
      setToolbarPosition(null);
      setPendingSelection(null);
      return;
    }

    if (selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    // Find ancestor paragraph with data-paragraph-index
    let node: Node | null = range.commonAncestorContainer;
    let paragraphEl: HTMLElement | null = null;

    while (node && node !== document.body) {
      if (node instanceof HTMLElement && node.hasAttribute("data-paragraph-index")) {
        paragraphEl = node;
        break;
      }
      node = node.parentNode;
    }

    if (!paragraphEl) {
      let startNode: Node | null = range.startContainer;
      while (startNode && startNode !== document.body) {
        if (startNode instanceof HTMLElement && startNode.hasAttribute("data-paragraph-index")) {
          paragraphEl = startNode;
          break;
        }
        startNode = startNode.parentNode;
      }
    }

    if (!paragraphEl) {
      return;
    }

    const pIndexAttr = paragraphEl.getAttribute("data-paragraph-index");
    if (pIndexAttr === null) return;
    const paragraphIndex = parseInt(pIndexAttr, 10);

    const paragraphs = splitContentIntoParagraphs(currentChapter.content);
    const paragraphText = paragraphs[paragraphIndex] || "";

    // Robust matching for startOffset & endOffset
    let startOffset = paragraphText.indexOf(selectedText);
    let endOffset = startOffset !== -1 ? startOffset + selectedText.length : 0;

    if (startOffset === -1) {
      const cleanSel = selectedText.trim();
      startOffset = paragraphText.indexOf(cleanSel);
      if (startOffset !== -1) {
        endOffset = startOffset + cleanSel.length;
      } else {
        const normalizedP = paragraphText.replace(/\s+/g, " ");
        const normalizedSel = cleanSel.replace(/\s+/g, " ");
        const normIdx = normalizedP.indexOf(normalizedSel);
        if (normIdx !== -1) {
          startOffset = normIdx;
          endOffset = normIdx + cleanSel.length;
        } else {
          const words = cleanSel.split(/\s+/).filter(Boolean);
          if (words.length > 0) {
            const firstWord = words[0];
            const fIdx = paragraphText.indexOf(firstWord);
            if (fIdx !== -1) {
              startOffset = fIdx;
              endOffset = fIdx + cleanSel.length;
            } else {
              startOffset = 0;
              endOffset = cleanSel.length;
            }
          } else {
            startOffset = 0;
            endOffset = cleanSel.length;
          }
        }
      }
    }

    const rect = range.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setToolbarPosition({
        x: Math.max(100, Math.min(window.innerWidth - 100, rect.left + rect.width / 2)),
        y: Math.max(60, rect.top),
      });
      setPendingSelection({
        paragraphIndex,
        startOffset,
        endOffset,
        text: selectedText,
      });
    }
  }, [currentChapter.content]);

  // Global mouseup / mousedown listener for robust text selection & dismiss
  React.useEffect(() => {
    const onMouseUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[role='toolbar']") || target.closest("[role='dialog']")) {
        return;
      }
      setTimeout(() => {
        handleTextSelection();
      }, 40);
    };

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[role='toolbar']") || target.closest("[role='dialog']")) {
        return;
      }
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setToolbarPosition(null);
        setPendingSelection(null);
      }
    };

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [handleTextSelection]);

  // Bookmark Current Page Position
  const handleBookmarkCurrentPosition = async () => {
    if (!user) {
      alert("Please log in to save bookmarks.");
      return;
    }

    setIsBookmarking(true);
    try {
      const activeChunk = currentPageData?.chunks[0];
      const activePIndex = activeChunk?.paragraphIndex ?? 0;
      const activeSnippet =
        activeChunk?.text.slice(0, 140) ||
        currentChapter.content.slice(0, 140) ||
        "";

      const newBookmark = await createBookmark(
        user.id,
        book.id,
        currentChapter.id,
        activePIndex,
        progressPercentage,
        activeSnippet,
        `Ch. ${currentChapter.chapter_number} · Page ${currentPage}`
      );

      if (newBookmark) {
        setBookmarks((prev) => [
          {
            ...newBookmark,
            book,
            chapter: currentChapter,
          },
          ...prev,
        ]);
        setIsBookmarked(true);
        setTimeout(() => setIsBookmarked(false), 3000);
      }
    } finally {
      setIsBookmarking(false);
    }
  };

  // Apply Highlight from Text Selection
  const handleApplyHighlight = async (
    color: HighlightColor,
    openNote: boolean = false
  ) => {
    if (!pendingSelection) return;

    const { paragraphIndex, startOffset, endOffset, text } = pendingSelection;

    const tempId = `hl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimisticHighlight: HighlightRow = {
      id: tempId,
      user_id: user?.id || "guest",
      book_id: book.id,
      chapter_id: currentChapter.id,
      paragraph_index: paragraphIndex,
      start_offset: startOffset,
      end_offset: endOffset,
      selected_text: text,
      color,
      note: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistically update local highlights immediately
    setHighlights((prev) => [...prev, optimisticHighlight]);
    window.getSelection()?.removeAllRanges();
    setToolbarPosition(null);
    setPendingSelection(null);

    if (openNote) {
      setActiveHighlightForModal(optimisticHighlight);
      setNoteModalOpen(true);
    }

    if (user) {
      try {
        const created = await createHighlight(
          user.id,
          book.id,
          currentChapter.id,
          paragraphIndex,
          startOffset,
          endOffset,
          text,
          color
        );

        if (created) {
          setHighlights((prev) =>
            prev.map((h) => (h.id === tempId ? created : h))
          );
        }
      } catch (err) {
        console.error("Failed to sync highlight to database:", err);
      }
    }
  };

  // Highlight Actions
  const handleHighlightClick = (h: HighlightRow) => {
    setActiveHighlightForModal(h);
    setNoteModalOpen(true);
  };

  const handleSaveNote = async (
    highlightId: string,
    note: string | null,
    color: HighlightColor
  ) => {
    setHighlights((prev) =>
      prev.map((h) =>
        h.id === highlightId ? { ...h, note: note || null, color } : h
      )
    );

    if (user && !highlightId.startsWith("hl-")) {
      const updated = await updateHighlightNote(highlightId, user.id, note, color);
      if (updated) {
        setHighlights((prev) =>
          prev.map((h) => (h.id === highlightId ? updated : h))
        );
      }
    }
  };

  const handleDeleteHighlight = async (highlightId: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== highlightId));

    if (user && !highlightId.startsWith("hl-")) {
      await deleteHighlight(highlightId, user.id);
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!user) return;
    const ok = await deleteBookmark(bookmarkId, user.id);
    if (ok) {
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    }
  };

  // Theme Wrapper Classes
  const themeClasses =
    settings.theme === "sepia"
      ? "bg-[#ede4cb] text-[#3d2e1e]"
      : settings.theme === "dark"
      ? "bg-[#08090d] text-[#e2e8f0]"
      : "bg-[#f3eee5] text-[#1c222c]";

  return (
    <div
      className={cn(
        "h-screen w-screen overflow-hidden flex flex-col transition-colors duration-300 relative",
        themeClasses
      )}
      onMouseUp={handleTextSelection}
      onTouchStart={handleTouchStart}
      onTouchEnd={(e) => {
        handleTouchEnd(e);
        handleTextSelection();
      }}
    >
      {/* Top Reading Progress & Floating HUD */}
      <ReaderProgressBar
        progressPercentage={progressPercentage}
        chapterNumber={currentChapter.chapter_number}
        totalChapters={allChapters.length}
        estimatedMinutes={currentChapter.estimated_read_minutes}
        visible={!settings.zenMode && bookCoverState === "open"}
        pageNumber={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />

      {/* Reader Top Bar */}
      <ReaderHeader
        bookSlug={book.slug}
        bookTitle={book.title}
        chapterTitle={currentChapter.title}
        chapterNumber={currentChapter.chapter_number}
        totalChapters={allChapters.length}
        zenMode={settings.zenMode}
        onToggleZenMode={() =>
          handleUpdateSettings({ zenMode: !settings.zenMode })
        }
        onOpenChapters={() => setChapterDrawerOpen(true)}
        onOpenSettings={() => setSettingsDrawerOpen(true)}
        onOpenAnnotations={() => setAnnotationsDrawerOpen(true)}
        onBookmarkCurrent={handleBookmarkCurrentPosition}
        isBookmarked={isBookmarked}
        annotationsCount={bookmarks.length + highlights.length}
        onExitReader={handleCloseAndExit}
        isOffline={isOffline}
      />

      {/* Main Book-Style Paginated Canvas */}
      <main className="flex-1 w-full flex flex-col justify-center items-center overflow-hidden relative">
        {isFetchingContent && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <p className="font-serif text-sm text-muted-foreground animate-pulse">
                Opening {currentChapter.title}...
              </p>
            </div>
          </div>
        )}
        <BookCanvas
          ref={containerRef}
          pages={pages}
          page={currentPageData}
          pageNumber={currentPage}
          totalPages={totalPages}
          bookTitle={book.title}
          chapterTitle={currentChapter.title}
          chapterNumber={currentChapter.chapter_number}
          settings={settings}
          highlights={highlights}
          onSelectHighlight={handleHighlightClick}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          hasPrev={currentPage > 1 || Boolean(prevChapter)}
          hasNext={
            (isTwoPage
              ? currentPage + 1 < totalPages
              : currentPage < totalPages) || Boolean(nextChapter)
          }
          isTurning={isTurning}
          turnDirection={turnDirection}
          bookSlug={book.slug}
          prevChapter={prevChapter}
          nextChapter={nextChapter}
          coverState={bookCoverState}
          onOpenBook={handleOpenBook}
          authorName={book.author?.name}
          coverImageUrl={book.cover_image_url || undefined}
        />
      </main>

      {/* Floating Highlight Toolbar */}
      <HighlightToolbar
        position={toolbarPosition}
        onHighlight={handleApplyHighlight}
        onClose={() => {
          setToolbarPosition(null);
          setPendingSelection(null);
        }}
      />

      {/* Highlight Note Modal */}
      <HighlightNoteModal
        highlight={activeHighlightForModal}
        isOpen={noteModalOpen}
        onClose={() => {
          setNoteModalOpen(false);
          setActiveHighlightForModal(null);
        }}
        onSaveNote={handleSaveNote}
        onDeleteHighlight={handleDeleteHighlight}
      />

      {/* Annotations & Bookmarks Drawer */}
      <ReaderBookmarksDrawer
        isOpen={annotationsDrawerOpen}
        onClose={() => setAnnotationsDrawerOpen(false)}
        bookmarks={bookmarks}
        highlights={highlights}
        currentBookSlug={book.slug}
        currentChapterId={currentChapter.id}
        onDeleteBookmark={handleDeleteBookmark}
        onDeleteHighlight={handleDeleteHighlight}
        onSelectHighlight={handleHighlightClick}
        onAddBookmarkNow={handleBookmarkCurrentPosition}
        isBookmarking={isBookmarking}
        onJumpToLocation={(paragraphIndex) => jumpToParagraph(paragraphIndex)}
      />

      {/* Table of Contents Drawer */}
      <ChapterDrawer
        isOpen={chapterDrawerOpen}
        onClose={() => setChapterDrawerOpen(false)}
        chapters={allChapters}
        currentChapterId={currentChapter.id}
        bookSlug={book.slug}
        bookTitle={book.title}
        onSelectChapter={navigateToChapter}
      />

      {/* Reader Appearance Settings Modal */}
      <ReaderSettingsDrawer
        isOpen={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
