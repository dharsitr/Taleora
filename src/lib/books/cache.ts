import { storyCache } from "@/lib/network/cache";
import {
  AuthorStats,
  AuthorStoryWithCounts,
  AuthorRow,
  BookDetail,
  BookWithAuthorAndGenres,
  BookmarkWithDetails,
  ChapterReaderData,
  GenreWithCount,
  HighlightWithDetails,
  LibraryItem,
} from "@/types/books";

// In-memory user-scoped caches (strictly keyed by userId, never shared across users)
interface UserCacheStore {
  library: Map<string, { data: LibraryItem[]; timestamp: number }>;
  bookmarks: Map<string, { data: BookmarkWithDetails[]; timestamp: number }>;
  highlights: Map<string, { data: HighlightWithDetails[]; timestamp: number }>;
  studio: Map<
    string,
    {
      author: AuthorRow | null;
      stats: AuthorStats;
      stories: AuthorStoryWithCounts[];
      timestamp: number;
    }
  >;
  discoverSections?: {
    trending: BookWithAuthorAndGenres[];
    featured: BookWithAuthorAndGenres[];
    genres: GenreWithCount[];
    timestamp: number;
  };
}

const globalForUserCache = globalThis as unknown as {
  taleoraUserCache?: UserCacheStore;
};

const userCache: UserCacheStore =
  globalForUserCache.taleoraUserCache ||
  (globalForUserCache.taleoraUserCache = {
    library: new Map(),
    bookmarks: new Map(),
    highlights: new Map(),
    studio: new Map(),
  });

const USER_CACHE_TTL_MS = 60 * 1000; // 60 seconds SWR window
const DISCOVER_SECTIONS_TTL_MS = 120 * 1000; // 2 minutes

// --- Public Story Cache (backed by storyCache with ETag/LRU) ---

export function getCachedBooks(cacheKey: string): BookWithAuthorAndGenres[] | null {
  const entry = storyCache.get<BookWithAuthorAndGenres[]>(cacheKey);
  return entry ? entry.data : null;
}

export function setCachedBooks(
  cacheKey: string,
  books: BookWithAuthorAndGenres[],
  ttlSeconds = 60
) {
  storyCache.set(cacheKey, books, ttlSeconds);
}

export function getCachedTrending(limit: number): BookWithAuthorAndGenres[] | null {
  const entry = storyCache.get<BookWithAuthorAndGenres[]>(`books:trending:${limit}`);
  return entry ? entry.data : null;
}

export function setCachedTrending(limit: number, books: BookWithAuthorAndGenres[]) {
  storyCache.set(`books:trending:${limit}`, books, 120);
}

export function getCachedFeatured(limit: number): BookWithAuthorAndGenres[] | null {
  const entry = storyCache.get<BookWithAuthorAndGenres[]>(`books:featured:${limit}`);
  return entry ? entry.data : null;
}

export function setCachedFeatured(limit: number, books: BookWithAuthorAndGenres[]) {
  storyCache.set(`books:featured:${limit}`, books, 120);
}

export function getCachedGenres(): GenreWithCount[] | null {
  const entry = storyCache.get<GenreWithCount[]>("genres:stats");
  return entry ? entry.data : null;
}

export function setCachedGenres(genres: GenreWithCount[]) {
  storyCache.set("genres:stats", genres, 300);
}

export function getCachedBookDetail(slugOrId: string): BookDetail | null {
  const entry = storyCache.get<BookDetail>(`book:detail:${slugOrId}`);
  return entry ? entry.data : null;
}

export function setCachedBookDetail(slugOrId: string, book: BookDetail) {
  storyCache.set(`book:detail:${slugOrId}`, book, 120);
}

export function getCachedChapterReader(
  bookSlug: string,
  chapterSlug?: string
): ChapterReaderData | null {
  const key = `chapter:reader:${bookSlug}:${chapterSlug || "first"}`;
  const entry = storyCache.get<ChapterReaderData>(key);
  return entry ? entry.data : null;
}

export function setCachedChapterReader(
  bookSlug: string,
  chapterSlug: string | undefined,
  data: ChapterReaderData
) {
  const key = `chapter:reader:${bookSlug}:${chapterSlug || "first"}`;
  storyCache.set(key, data, 120);
}

export function invalidatePublicStoryCaches(bookSlug?: string) {
  if (bookSlug) {
    storyCache.invalidate(`book:detail:${bookSlug}`);
    storyCache.invalidate(`chapter:reader:${bookSlug}`);
  }
  storyCache.invalidate("books:query");
  storyCache.invalidate("books:trending");
  storyCache.invalidate("books:featured");
  storyCache.invalidate("genres:stats");
  userCache.discoverSections = undefined;
}

// --- Discover Sections Cache (client-side SWR) ---

export function getCachedDiscoverSections(): {
  trending: BookWithAuthorAndGenres[];
  featured: BookWithAuthorAndGenres[];
  genres: GenreWithCount[];
} | null {
  if (!userCache.discoverSections) return null;
  if (Date.now() - userCache.discoverSections.timestamp > DISCOVER_SECTIONS_TTL_MS) {
    return null;
  }
  return {
    trending: userCache.discoverSections.trending,
    featured: userCache.discoverSections.featured,
    genres: userCache.discoverSections.genres,
  };
}

export function setCachedDiscoverSections(data: {
  trending: BookWithAuthorAndGenres[];
  featured: BookWithAuthorAndGenres[];
  genres: GenreWithCount[];
}) {
  userCache.discoverSections = {
    ...data,
    timestamp: Date.now(),
  };
}

// --- User-Scoped Library Cache ---

export function getUserLibraryCache(userId: string): LibraryItem[] | null {
  const entry = userCache.library.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > USER_CACHE_TTL_MS) return null;
  return entry.data;
}

export function setUserLibraryCache(userId: string, items: LibraryItem[]) {
  userCache.library.set(userId, { data: items, timestamp: Date.now() });
}

export function invalidateUserLibraryCache(userId?: string) {
  if (userId) {
    userCache.library.delete(userId);
  } else {
    userCache.library.clear();
  }
}

// --- User-Scoped Bookmarks & Highlights Cache ---

export function getUserBookmarksCache(userId: string): BookmarkWithDetails[] | null {
  const entry = userCache.bookmarks.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > USER_CACHE_TTL_MS) return null;
  return entry.data;
}

export function setUserBookmarksCache(userId: string, items: BookmarkWithDetails[]) {
  userCache.bookmarks.set(userId, { data: items, timestamp: Date.now() });
}

export function getUserHighlightsCache(userId: string): HighlightWithDetails[] | null {
  const entry = userCache.highlights.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > USER_CACHE_TTL_MS) return null;
  return entry.data;
}

export function setUserHighlightsCache(userId: string, items: HighlightWithDetails[]) {
  userCache.highlights.set(userId, { data: items, timestamp: Date.now() });
}

export function invalidateUserArchivesCache(userId?: string) {
  if (userId) {
    userCache.bookmarks.delete(userId);
    userCache.highlights.delete(userId);
  } else {
    userCache.bookmarks.clear();
    userCache.highlights.clear();
  }
}

// --- Author Studio Cache ---

export function getAuthorStudioCache(userId: string): {
  author: AuthorRow | null;
  stats: AuthorStats;
  stories: AuthorStoryWithCounts[];
} | null {
  const entry = userCache.studio.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > USER_CACHE_TTL_MS) return null;
  return {
    author: entry.author,
    stats: entry.stats,
    stories: entry.stories,
  };
}

export function setAuthorStudioCache(
  userId: string,
  data: {
    author: AuthorRow | null;
    stats: AuthorStats;
    stories: AuthorStoryWithCounts[];
  }
) {
  userCache.studio.set(userId, { ...data, timestamp: Date.now() });
}

export function invalidateAuthorStudioCache(userId?: string) {
  if (userId) {
    userCache.studio.delete(userId);
  } else {
    userCache.studio.clear();
  }
}
