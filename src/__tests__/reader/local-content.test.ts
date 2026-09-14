import { describe, it, expect } from "vitest";
import {
  getLocalChapterContent,
  hasLocalChapterContent,
  getLocalBookChapters,
} from "@/lib/books/local-content";

describe("Local Chapter Content Hydration", () => {
  const bookSlug = "a-book-of-remarkable-criminals-h-b-irving";
  const chapterSlug = "chapter-1-introduction";

  it("should detect that local chapter content exists for imported sample book", () => {
    const exists = hasLocalChapterContent(bookSlug, chapterSlug);
    expect(exists).toBe(true);
  });

  it("should return formatted chapter content from local storage", () => {
    const content = getLocalChapterContent(bookSlug, chapterSlug);
    expect(content).toBeTruthy();
    expect(typeof content).toBe("string");
    expect(content!.length).toBeGreaterThan(100);
    // Should contain paragraphs separated by newlines
    expect(content).toContain("\n\n");
  });

  it("should return null for non-existent chapter or book", () => {
    const content = getLocalChapterContent("non-existent-book-slug", "chapter-999");
    expect(content).toBeNull();
  });

  it("should safely sanitize directory traversal attempts", () => {
    const malicious = getLocalChapterContent("../../etc", "passwd");
    expect(malicious).toBeNull();
  });

  it("should retrieve all chapters for an imported book in numerical order", () => {
    const all = getLocalBookChapters(bookSlug);
    expect(all.length).toBe(11);
    expect(all[0].chapterNumber).toBe(1);
    expect(all[0].title).toBe("Introduction");
    expect(all[1].chapterNumber).toBe(2);
  });
});
