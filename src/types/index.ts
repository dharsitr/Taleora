export interface Story {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  authorAvatar?: string;
  coverGradient: string;
  coverAccent: string;
  genre: string;
  readTimeMinutes: number;
  rating: number;
  reviewsCount: number;
  description: string;
  chaptersCount: number;
  currentChapter?: number;
  progressPercentage?: number;
  lastReadAt?: string;
  featured?: boolean;
  trending?: boolean;
  tags: string[];
}

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
}

export interface ReadingStats {
  dailyGoalMinutes: number;
  minutesReadToday: number;
  currentStreakDays: number;
  booksCompleted: number;
}
