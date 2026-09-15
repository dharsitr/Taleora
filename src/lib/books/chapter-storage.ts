import { env } from "@/lib/env";

// In-memory cache for book chapters during runtime/session
const memoryCache = new Map<string, Record<string, string>>();

/**
 * Fetches and decompresses all chapters for a given book slug.
 * Works universally on both Server (Node.js/Next.js SSR) and Client (browser).
 */
export async function fetchBookChaptersFromStorage(
  bookSlug: string
): Promise<Record<string, string> | null> {
  if (memoryCache.has(bookSlug)) {
    return memoryCache.get(bookSlug)!;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    env.supabaseUrl ||
    "https://tqcxnzmfcgortjkjlisu.supabase.co";

  const url = `${supabaseUrl}/storage/v1/object/public/book-chapters/${bookSlug}.json`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 }, // Cache on server for 24 hours
    });
    if (!res.ok) return null;

    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let jsonText = "";

    // Check gzip magic bytes (0x1f, 0x8b)
    if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
      if (typeof DecompressionStream !== "undefined") {
        const stream = new Response(buf).body?.pipeThrough(
          new DecompressionStream("gzip")
        );
        jsonText = await new Response(stream).text();
      } else {
        // Node fallback if DecompressionStream is not defined
        const zlib = await import("zlib");
        jsonText = zlib.gunzipSync(Buffer.from(buf)).toString("utf-8");
      }
    } else {
      jsonText = new TextDecoder().decode(buf);
    }

    const chapters = JSON.parse(jsonText) as Record<string, string>;
    memoryCache.set(bookSlug, chapters);
    return chapters;
  } catch (err) {
    console.warn(`[ChapterStorage] Failed to fetch chapters for ${bookSlug}:`, err);
    return null;
  }
}

/**
 * Retrieves a single chapter content, using local disk cache first (if on server),
 * falling back to Supabase Cloud Storage.
 */
export async function getChapterContentWithFallback(
  bookSlug: string,
  chapterSlug: string
): Promise<string | null> {
  // 1. If on server, check local file system first
  if (typeof window === "undefined") {
    try {
      const { getLocalChapterContent } = await import("./local-content");
      const local = getLocalChapterContent(bookSlug, chapterSlug);
      if (local) return local;
    } catch {
      // Continue to storage
    }
  }

  // 2. Fetch from Supabase Cloud Storage
  const chapters = await fetchBookChaptersFromStorage(bookSlug);
  if (chapters && chapters[chapterSlug]) {
    return chapters[chapterSlug];
  }

  return null;
}
