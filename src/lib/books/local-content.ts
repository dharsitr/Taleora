// Use dynamic runtime require to prevent Webpack/Turbopack from bundling or crawling content/books/ directory during build
function getFs(): typeof import("fs") | null {
  if (typeof window !== "undefined") return null;
  try {
    return eval("require")("fs");
  } catch {
    return null;
  }
}

function getPath(): typeof import("path") | null {
  if (typeof window !== "undefined") return null;
  try {
    return eval("require")("path");
  } catch {
    return null;
  }
}

/**
 * Interface for saved chapter file in local storage.
 */
export interface LocalChapterData {
  bookSlug: string;
  chapterSlug: string;
  chapterNumber: number;
  title: string;
  content: string;
}

function getContentDir(): string {
  const p = getPath();
  return p ? p.join(process.cwd(), "content", "books") : "";
}

/**
 * Sanitizes input slugs to prevent directory traversal attacks.
 */
function sanitizeSlug(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * Resolves safe path to chapter content JSON file.
 */
function getChapterFilePath(bookSlug: string, chapterSlug: string): string {
  const p = getPath();
  if (!p) return "";
  const safeBook = sanitizeSlug(bookSlug);
  const safeChapter = sanitizeSlug(chapterSlug);
  return p.join(getContentDir(), safeBook, `${safeChapter}.json`);
}

/**
 * Checks if local chapter file exists.
 */
export function hasLocalChapterContent(
  bookSlug: string,
  chapterSlug: string
): boolean {
  if (typeof window !== "undefined") return false;
  const f = getFs();
  if (!f) return false;
  try {
    const filePath = getChapterFilePath(bookSlug, chapterSlug);
    return f.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Reads chapter content from local storage.
 * Returns null if file does not exist or cannot be read.
 */
export function getLocalChapterContent(
  bookSlug: string,
  chapterSlug: string
): string | null {
  if (typeof window !== "undefined") return null;
  const f = getFs();
  if (!f) return null;
  try {
    const filePath = getChapterFilePath(bookSlug, chapterSlug);
    if (!f.existsSync(filePath)) return null;

    const raw = f.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as LocalChapterData;
    return parsed.content || null;
  } catch (err) {
    console.warn(`[LocalContent] Failed to read chapter ${bookSlug}/${chapterSlug}:`, err);
    return null;
  }
}

/**
 * Reads all local chapter files for a book if available.
 */
export function getLocalBookChapters(
  bookSlug: string
): LocalChapterData[] {
  if (typeof window !== "undefined") return [];
  const f = getFs();
  const p = getPath();
  if (!f || !p) return [];
  try {
    const safeBook = sanitizeSlug(bookSlug);
    const bookDir = p.join(getContentDir(), safeBook);
    if (!f.existsSync(bookDir)) return [];

    const files = f.readdirSync(bookDir).filter((file: string) => file.endsWith(".json"));
    const chapters: LocalChapterData[] = [];

    for (const file of files) {
      try {
        const raw = f.readFileSync(p.join(bookDir, file), "utf-8");
        const parsed = JSON.parse(raw) as LocalChapterData;
        if (parsed && parsed.content) {
          chapters.push(parsed);
        }
      } catch {
        // Continue with other chapters
      }
    }

    return chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
  } catch {
    return [];
  }
}
