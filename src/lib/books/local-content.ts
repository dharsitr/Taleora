import fs from "fs";
import path from "path";

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

const CONTENT_DIR = path.join(process.cwd(), "content", "books");

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
  const safeBook = sanitizeSlug(bookSlug);
  const safeChapter = sanitizeSlug(chapterSlug);
  return path.join(CONTENT_DIR, safeBook, `${safeChapter}.json`);
}

/**
 * Checks if local chapter file exists.
 */
export function hasLocalChapterContent(
  bookSlug: string,
  chapterSlug: string
): boolean {
  if (typeof window !== "undefined") return false;
  try {
    const filePath = getChapterFilePath(bookSlug, chapterSlug);
    return fs.existsSync(filePath);
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
  try {
    const filePath = getChapterFilePath(bookSlug, chapterSlug);
    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, "utf-8");
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
  try {
    const safeBook = sanitizeSlug(bookSlug);
    const bookDir = path.join(CONTENT_DIR, safeBook);
    if (!fs.existsSync(bookDir)) return [];

    const files = fs.readdirSync(bookDir).filter((f) => f.endsWith(".json"));
    const chapters: LocalChapterData[] = [];

    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(bookDir, file), "utf-8");
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
