import { Tables } from "@/types/database.types";

export type BookRow = Tables<"books">;
export type AuthorRow = Tables<"authors">;
export type GenreRow = Tables<"genres">;
export type ChapterRow = Tables<"chapters">;
export type ReadingProgressRow = Tables<"reading_progress">;
export type BookmarkRow = Tables<"bookmarks">;
export type HighlightRow = Tables<"highlights">;
export type HighlightColor = "amber" | "emerald" | "sky" | "rose" | "violet";

export interface BookWithAuthorAndGenres extends BookRow {
  author: AuthorRow;
  genres: GenreRow[];
}

export interface BookDetail extends BookRow {
  author: AuthorRow;
  genres: GenreRow[];
  chapters: ChapterRow[];
}

export interface LibraryItem extends ReadingProgressRow {
  book: BookWithAuthorAndGenres;
  current_chapter?: ChapterRow | null;
}

export interface BookmarkWithDetails extends BookmarkRow {
  book: BookWithAuthorAndGenres;
  chapter: ChapterRow;
}

export interface HighlightWithDetails extends HighlightRow {
  book: BookWithAuthorAndGenres;
  chapter: ChapterRow;
}

export type BookSortOption =
  | "featured"
  | "rating"
  | "popular"
  | "popularity"
  | "newest"
  | "updated"
  | "title";

export interface BookFilterOptions {
  search?: string;
  genreSlug?: string;
  minRating?: number;
  dateRange?: "all" | "month" | "year";
  tag?: string;
  sort?: BookSortOption;
  limit?: number;
}

export interface GenreWithCount extends GenreRow {
  bookCount: number;
}

export type ReaderTheme = "light" | "dark" | "sepia";
export type ReaderFontFamily = "serif" | "sans" | "mono";
export type ReaderWidth = "narrow" | "standard" | "wide";
export type ReaderPageLayout = "spread" | "single";

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: number; // 14 to 24
  lineHeight: number; // 1.5 to 2.25
  width: ReaderWidth;
  fontFamily: ReaderFontFamily;
  zenMode: boolean;
  pageLayout: ReaderPageLayout;
}

export interface ChapterReaderData {
  book: BookWithAuthorAndGenres;
  currentChapter: ChapterRow;
  allChapters: ChapterRow[];
  prevChapter: ChapterRow | null;
  nextChapter: ChapterRow | null;
}

export type BookStatus = "draft" | "published" | "archived";
export type ChapterStatus = "draft" | "published" | "scheduled" | "archived";
export type ScheduleType =
  | "immediate"
  | "specific_date"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "custom";
export type ReleaseCadence =
  | "immediate"
  | "manual"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "custom";

export interface AuthorStats {
  totalStories: number;
  publishedChapters: number;
  scheduledChapters: number;
  draftChapters: number;
  totalWords: number;
}

export interface CreateBookInput {
  title: string;
  subtitle?: string | null;
  slug?: string;
  description?: string | null;
  genreIds?: string[];
  tags?: string[];
  cover_image_url?: string | null;
  cover_gradient?: string | null;
  cover_accent?: string | null;
  status?: BookStatus;
  release_schedule?: ReleaseCadence;
}

export interface UpdateBookInput {
  title?: string;
  subtitle?: string | null;
  slug?: string;
  description?: string | null;
  genreIds?: string[];
  tags?: string[];
  cover_image_url?: string | null;
  cover_gradient?: string | null;
  cover_accent?: string | null;
  status?: BookStatus;
  release_schedule?: ReleaseCadence;
}

export interface CreateChapterInput {
  title: string;
  slug?: string;
  content: string;
  chapter_number?: number;
  status: ChapterStatus;
  schedule_type?: ScheduleType;
  scheduled_for?: string | null;
}

export interface UpdateChapterInput {
  title?: string;
  slug?: string;
  content?: string;
  chapter_number?: number;
  status?: ChapterStatus;
  schedule_type?: ScheduleType;
  scheduled_for?: string | null;
}

export interface AuthorStoryWithCounts extends BookWithAuthorAndGenres {
  chaptersCount: number;
  publishedChaptersCount: number;
  scheduledChaptersCount: number;
  draftChaptersCount: number;
  totalWords: number;
}
