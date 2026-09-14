// Taleora Mobile - Unified TypeScript Definitions

export type BookStatus = "draft" | "published" | "archived";
export type ChapterStatus = "draft" | "published" | "scheduled" | "archived";
export type HighlightColor = "amber" | "emerald" | "sky" | "rose" | "violet";
export type ThemeMode = "light" | "dark" | "sepia";
export type ReaderFontFamily = "serif" | "sans" | "mono";

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface Author {
  id: string;
  user_id?: string;
  display_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  website?: string | null;
  twitter_handle?: string | null;
  is_verified?: boolean;
}

export interface Book {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  cover_gradient?: string | null;
  synopsis?: string | null;
  status: BookStatus;
  featured: boolean;
  trending: boolean;
  total_chapters: number;
  average_rating: number;
  ratings_count: number;
  tags?: string[] | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  author: Author;
  genres: Genre[];
}

export interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  slug: string;
  content: string;
  word_count: number;
  estimated_read_minutes: number;
  status: ChapterStatus;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookDetail extends Book {
  chapters: Chapter[];
}

export interface ChapterReaderData {
  book: Book;
  currentChapter: Chapter;
  allChapters: Chapter[];
  prevChapter: Chapter | null;
  nextChapter: Chapter | null;
}

export interface ReadingProgress {
  id?: string;
  user_id: string;
  book_id: string;
  current_chapter_id: string | null;
  progress_percentage: number;
  is_completed: boolean;
  updated_at: string;
  book?: Book;
  current_chapter?: Chapter | null;
}

export interface Bookmark {
  id: string;
  user_id: string;
  book_id: string;
  chapter_id: string;
  paragraph_index: number;
  progress_percentage: number;
  snippet?: string | null;
  label?: string | null;
  created_at: string;
  book?: Book;
  chapter?: Chapter;
}

export interface Highlight {
  id: string;
  user_id: string;
  book_id: string;
  chapter_id: string;
  paragraph_index: number;
  start_offset: number;
  end_offset: number;
  selected_text: string;
  color: HighlightColor;
  note?: string | null;
  created_at: string;
  updated_at: string;
  book?: Book;
  chapter?: Chapter;
}

export interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "user" | "moderator" | "admin";
  is_suspended: boolean;
  created_at: string;
}

export interface ReaderSettings {
  theme: ThemeMode;
  fontSize: number; // 14 to 28
  lineHeight: number; // 1.4 to 2.2
  fontFamily: ReaderFontFamily;
  isPaged: boolean;
}
