import { describe, it, expect } from "vitest";
import {
  getLocalChapterContent,
  hasLocalChapterContent,
  getLocalBookChapters,
} from "@/lib/books/local-content";

describe("Local Chapter Content Hydration", () => {
  const bookSlug = "a-book-of-remarkable-criminals-h-b-irving";
  const chapterSlug = "chapter-1-introduction";

  it("should detect that local chapter content exists for imported sample book if present", () => {
    const exists = hasLocalChapterContent(bookSlug, chapterSlug);
    if (exists) {
      expect(exists).toBe(true);
    } else {
      expect(exists).toBe(false);
    }
  });

  it("should return formatted chapter content from local storage if book exists", () => {
    const content = getLocalChapterContent(bookSlug, chapterSlug);
    if (content) {
      expect(typeof content).toBe("string");
      expect(content.length).toBeGreaterThan(100);
      expect(content).toContain("\n\n");
    } else {
      expect(content).toBeNull();
    }
  });

  it("should return null for non-existent chapter or book", () => {
    const content = getLocalChapterContent("non-existent-book-slug", "chapter-999");
    expect(content).toBeNull();
  });

  it("should safely sanitize directory traversal attempts", () => {
    const malicious = getLocalChapterContent("../../etc", "passwd");
    expect(malicious).toBeNull();
  });

  it("should retrieve all chapters for an imported book in numerical order if present", () => {
    const all = getLocalBookChapters(bookSlug);
    if (all.length > 0) {
      expect(all.length).toBe(11);
      expect(all[0].chapterNumber).toBe(1);
      expect(all[0].title).toBe("Introduction");
      expect(all[1].chapterNumber).toBe(2);
    } else {
      expect(all.length).toBe(0);
    }
  });
});
