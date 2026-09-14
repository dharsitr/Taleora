import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveOfflineBook } from "@/lib/offline/db";
import { OfflineBook, OfflineChapter } from "@/types/offline";

describe("Offline Storage & Client Data Security Suite", () => {
  let mockBooksStore: Map<string, any>;
  let mockChaptersStore: Map<string, any>;
  let mockPutBook: any;
  let mockPutChapter: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBooksStore = new Map();
    mockChaptersStore = new Map();

    mockPutBook = vi.fn((book: any) => {
      mockBooksStore.set(book.id, book);
    });

    mockPutChapter = vi.fn((ch: any) => {
      mockChaptersStore.set(ch.id, ch);
    });

    const mockDb = {
      transaction: vi.fn().mockImplementation((_stores: string[], _mode: string) => {
        const tx: any = {
          objectStore: vi.fn((storeName: string) => {
            if (storeName === "books") {
              return { put: mockPutBook };
            }
            if (storeName === "chapters") {
              return { put: mockPutChapter };
            }
            return { put: vi.fn() };
          }),
        };

        // Trigger oncomplete synchronously in test microtask
        setTimeout(() => {
          if (tx.oncomplete) tx.oncomplete();
        }, 0);

        return tx;
      }),
    };

    // Mock window & indexedDB
    (global as any).window = {
      indexedDB: {
        open: vi.fn().mockReturnValue({
          addEventListener: vi.fn(),
          result: mockDb,
          onsuccess: null,
          onerror: null,
        }),
      },
      dispatchEvent: vi.fn(),
      CustomEvent: class CustomEvent {
        constructor(public type: string, public init?: any) {}
      },
    };

    // Mock openOfflineDb
    vi.spyOn(window.indexedDB, "open").mockImplementation(() => {
      const req: any = {
        set onsuccess(cb: any) {
          setTimeout(() => cb({ target: { result: mockDb } }), 0);
        },
        result: mockDb,
      };
      return req;
    });
  });

  it("sanitizes malicious script tags and event handlers in offline book metadata", async () => {
    const maliciousBook: OfflineBook = {
      id: "book-evil-1",
      title: "Clean Title <script>alert('xss')</script>",
      slug: "clean-title",
      subtitle: "Dangerous Subtitle <img src=x onerror=steal()>",
      description: "Book description\0with null bytes and <script>attack()</script>",
      cover_image_url: "https://example.com/cover.jpg",
      cover_gradient: null,
      status: "ready",
      author: {
        id: "author-1",
        name: "Author Name",
        slug: "author-name",
        avatar_url: null,
      },
      genres: [],
      downloaded_at: new Date().toISOString(),
      total_chapters: 1,
      size_bytes: 1024,
    };

    const maliciousChapters: OfflineChapter[] = [
      {
        id: "ch-1",
        book_id: "book-evil-1",
        chapter_number: 1,
        title: "Chapter One <script>fetch('//hacker.com')</script>",
        slug: "chapter-one",
        content: "Once upon a time in a distant land...\0<script>payload()</script>\nParagraph 2",
        word_count: 50,
        estimated_read_minutes: 1,
      },
    ];

    await saveOfflineBook(maliciousBook, maliciousChapters);

    // Verify stored book was sanitized
    const savedBook = mockBooksStore.get("book-evil-1");
    expect(savedBook).toBeDefined();
    expect(savedBook.title).not.toContain("<script>");
    expect(savedBook.title).toBe("Clean Title");
    expect(savedBook.subtitle).not.toContain("onerror");
    expect(savedBook.subtitle).not.toContain("steal");
    expect(savedBook.description).not.toContain("\0");
    expect(savedBook.description).not.toContain("<script>");

    // Verify stored chapters were sanitized
    const savedChapter = mockChaptersStore.get("ch-1");
    expect(savedChapter).toBeDefined();
    expect(savedChapter.title).not.toContain("<script>");
    expect(savedChapter.content).not.toContain("\0");
    expect(savedChapter.content).not.toContain("<script>");
    expect(savedChapter.content).toContain("Once upon a time in a distant land...");
    expect(savedChapter.content).toContain("Paragraph 2");
  });
});
