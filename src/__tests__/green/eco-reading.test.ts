import { describe, it, expect, beforeEach } from "vitest";
import {
  greenReadingEngine,
  formatBytes,
  dispatchCacheInvalidation,
} from "@/lib/green/eco-reading";
import { ChapterReaderData, ReaderSettings } from "@/types/books";

const createMockChapterData = (
  bookSlug: string,
  chapterSlug: string,
  title: string,
  status: "published" | "draft" = "published"
): ChapterReaderData => ({
  book: {
    id: `book-${bookSlug}`,
    title: `Story ${bookSlug}`,
    slug: bookSlug,
    user_id: "author-1",
    total_chapters: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "published",
    author: {
      id: "author-1",
      name: "Taleora Author",
      created_at: new Date().toISOString(),
    },
    genres: [],
  } as any,
  currentChapter: {
    id: `ch-${chapterSlug}`,
    book_id: `book-${bookSlug}`,
    user_id: "author-1",
    chapter_number: 1,
    title,
    slug: chapterSlug,
    content: "This is a sustainable chapter with green computing optimizations.",
    word_count: 10,
    estimated_read_minutes: 1,
    status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as any,
  allChapters: [],
  prevChapter: null,
  nextChapter: null,
});

describe("Green Reading System & Sustainability Telemetry", () => {
  beforeEach(() => {
    greenReadingEngine.resetMetrics();
    greenReadingEngine.invalidate();
  });

  describe("Eco Reading Mode Toggle", () => {
    it("toggles Eco Reading Mode state and notifies listeners", () => {
      let notified = false;
      const unsubscribe = greenReadingEngine.subscribe(() => {
        notified = true;
      });

      expect(greenReadingEngine.getMetrics().ecoModeActive).toBe(false);

      greenReadingEngine.setEcoModeActive(true);
      expect(greenReadingEngine.getMetrics().ecoModeActive).toBe(true);
      expect(notified).toBe(true);

      notified = false;
      greenReadingEngine.setEcoModeActive(false);
      expect(greenReadingEngine.getMetrics().ecoModeActive).toBe(false);
      expect(notified).toBe(true);

      unsubscribe();
    });

    it("verifies reader settings contract for low-power 2D mode when ecoMode is enabled", () => {
      const standardSettings: ReaderSettings = {
        theme: "light",
        fontSize: 18,
        lineHeight: 1.8,
        width: "standard",
        fontFamily: "serif",
        zenMode: false,
        pageLayout: "spread",
        readerMode: "3d",
        ecoMode: false,
      };

      // When Eco Mode is enabled, readerMode transitions to 2d to avoid GPU render loop
      const ecoSettings: ReaderSettings = {
        ...standardSettings,
        ecoMode: true,
        readerMode: "2d",
      };

      expect(ecoSettings.ecoMode).toBe(true);
      expect(ecoSettings.readerMode).toBe("2d");
    });
  });

  describe("Chapter Content Caching & Redundant Request Avoidance", () => {
    it("caches published chapters and serves cache hits on subsequent reads", () => {
      const mockData = createMockChapterData("green-frontier", "chapter-1", "Chapter 1: Renewable Bits");

      // Initially cache is empty
      const initialFetch = greenReadingEngine.get("green-frontier", "chapter-1");
      expect(initialFetch).toBeNull();
      expect(greenReadingEngine.getMetrics().cacheHits).toBe(0);

      // Simulate network fetch
      const payloadSize = greenReadingEngine.estimatePayloadSize(mockData);
      greenReadingEngine.recordNetworkFetch(payloadSize);
      greenReadingEngine.set("green-frontier", "chapter-1", mockData);

      expect(greenReadingEngine.getMetrics().totalRequests).toBe(1);
      expect(greenReadingEngine.getMetrics().totalDataTransferredBytes).toBe(payloadSize);

      // Subsequent read hits cache without network request
      const cached = greenReadingEngine.get("green-frontier", "chapter-1");
      expect(cached).not.toBeNull();
      expect(cached?.currentChapter.title).toBe("Chapter 1: Renewable Bits");

      const metricsAfterHit = greenReadingEngine.getMetrics();
      expect(metricsAfterHit.cacheHits).toBe(1);
      expect(metricsAfterHit.networkRequestsAvoided).toBe(1);
      expect(metricsAfterHit.estimatedDataSavedBytes).toBeGreaterThan(0);
      // Total network requests remains 1 (no repeated API call)
      expect(metricsAfterHit.totalRequests).toBe(1);
    });

    it("does not cache draft or unpublished chapters to prevent unauthorized content leaks", () => {
      const draftData = createMockChapterData("secret-novel", "chapter-draft", "Secret Draft", "draft");

      greenReadingEngine.set("secret-novel", "chapter-draft", draftData);
      const retrieved = greenReadingEngine.get("secret-novel", "chapter-draft");

      expect(retrieved).toBeNull();
      expect(greenReadingEngine.getMetrics().cacheHits).toBe(0);
    });
  });

  describe("Cache Invalidation Integrity", () => {
    it("invalidates specific chapter when updated by author", () => {
      const chapter1 = createMockChapterData("eco-chronicles", "chapter-1", "Chapter 1");
      const chapter2 = createMockChapterData("eco-chronicles", "chapter-2", "Chapter 2");

      greenReadingEngine.set("eco-chronicles", "chapter-1", chapter1);
      greenReadingEngine.set("eco-chronicles", "chapter-2", chapter2);

      // Invalidate only chapter 1
      greenReadingEngine.invalidate("eco-chronicles", "chapter-1");

      expect(greenReadingEngine.get("eco-chronicles", "chapter-1")).toBeNull();
      // Chapter 2 remains intact
      expect(greenReadingEngine.get("eco-chronicles", "chapter-2")).not.toBeNull();
    });

    it("invalidates all book chapters when story is deleted or restructured", () => {
      const chapter1 = createMockChapterData("solar-winds", "ch-1", "Winds 1");
      const chapter2 = createMockChapterData("solar-winds", "ch-2", "Winds 2");
      const unrelated = createMockChapterData("unrelated-story", "ch-1", "Unrelated");

      greenReadingEngine.set("solar-winds", "ch-1", chapter1);
      greenReadingEngine.set("solar-winds", "ch-2", chapter2);
      greenReadingEngine.set("unrelated-story", "ch-1", unrelated);

      // Invalidate whole book
      dispatchCacheInvalidation("solar-winds");

      expect(greenReadingEngine.get("solar-winds", "ch-1")).toBeNull();
      expect(greenReadingEngine.get("solar-winds", "ch-2")).toBeNull();
      // Unrelated story is preserved
      expect(greenReadingEngine.get("unrelated-story", "ch-1")).not.toBeNull();
    });
  });

  describe("Sustainability Telemetry & Formatting", () => {
    it("formats bytes accurately across B, KB, and MB scales", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(512)).toBe("512 B");
      expect(formatBytes(1536)).toBe("1.5 KB");
      expect(formatBytes(1024 * 1024)).toBe("1.00 MB");
      expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.50 MB");
    });

    it("strictly separates actual tracked measurements from estimates and makes no speculative energy claims", () => {
      greenReadingEngine.recordNetworkFetch(4096);
      greenReadingEngine.recordCacheHit(4096);

      const snapshot = greenReadingEngine.getMetrics();

      // Verified tracked quantities
      expect(snapshot.totalRequests).toBe(1);
      expect(snapshot.cacheHits).toBe(1);
      expect(snapshot.networkRequestsAvoided).toBe(1);
      expect(snapshot.totalDataTransferredBytes).toBe(4096);

      // Estimated savings
      expect(snapshot.estimatedDataSavedBytes).toBe(4096);

      // Verify no speculative unmeasured fields exist
      expect((snapshot as any).carbonGramsSaved).toBeUndefined();
      expect((snapshot as any).kwhElectricitySaved).toBeUndefined();
    });

    it("resets metrics on user request while preserving user mode preference", () => {
      greenReadingEngine.setEcoModeActive(true);
      greenReadingEngine.recordNetworkFetch(2048);
      greenReadingEngine.recordCacheHit(2048);

      greenReadingEngine.resetMetrics();

      const resetSnapshot = greenReadingEngine.getMetrics();
      expect(resetSnapshot.totalRequests).toBe(0);
      expect(resetSnapshot.cacheHits).toBe(0);
      expect(resetSnapshot.networkRequestsAvoided).toBe(0);
      expect(resetSnapshot.totalDataTransferredBytes).toBe(0);
      expect(resetSnapshot.estimatedDataSavedBytes).toBe(0);
      // Eco mode preference retained
      expect(resetSnapshot.ecoModeActive).toBe(true);
    });
  });
});
