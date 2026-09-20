export type AchievementCategory = "streak" | "volume" | "completion" | "exploration" | "special";
export type AchievementTier = "bronze" | "silver" | "gold" | "diamond";

export interface ReadingSessionRow {
  id: string;
  user_id: string;
  book_id: string;
  chapter_id: string | null;
  duration_seconds: number;
  pages_read: number;
  session_date: string;
  started_at: string;
  ended_at: string;
  created_at: string;
}

export interface ReadingGoalRow {
  id: string;
  user_id: string;
  daily_minutes_goal: number;
  weekly_days_goal: number;
  annual_books_goal: number;
  created_at: string;
  updated_at: string;
}

export interface AchievementRow {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon_name: string;
  target_type:
    | "chapters_read"
    | "pages_read"
    | "books_completed"
    | "minutes_read"
    | "streak_days"
    | "genres_read"
    | "highlights_created"
    | "night_sessions";
  target_value: number;
  order_index: number;
  created_at: string;
}

export interface UserAchievementRow {
  id: string;
  user_id: string;
  achievement_id: string;
  progress_value: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AchievementWithProgress extends AchievementRow {
  progressValue: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
  percent: number;
}

export interface DailyActivityStat {
  date: string;       // YYYY-MM-DD
  dayName: string;    // Mon, Tue, etc.
  minutes: number;
  pages: number;
}

export interface MonthlyActivityStat {
  month: string;      // YYYY-MM
  monthName: string;  // Jan, Feb, etc.
  minutes: number;
  booksCompleted: number;
}

export interface GenreStat {
  genreId: string;
  name: string;
  slug: string;
  minutesRead: number;
  booksCount: number;
  percentage: number;
}

export type TimeOfDaySlot = "Morning" | "Afternoon" | "Evening" | "Night";

export interface ReadingInsight {
  bestTimeOfDay: TimeOfDaySlot;
  morningPercentage: number;
  afternoonPercentage: number;
  eveningPercentage: number;
  nightPercentage: number;
  avgSessionMinutes: number;
  avgDailyMinutes: number;
  mostActiveDayOfWeek: string;
  completionRate: number;
}

export interface ReadingHistoryItem {
  id: string;
  bookId: string;
  bookTitle: string;
  bookSlug: string;
  coverImageUrl: string | null;
  chapterTitle: string | null;
  chapterNumber?: number;
  durationMinutes: number;
  pagesRead: number;
  timestamp: string;
  progressPercentage: number;
  isCompleted: boolean;
}

export interface ReadingSummaryStats {
  totalBooksCompleted: number;
  totalChaptersRead: number;
  totalPagesRead: number;
  totalMinutesRead: number;
  currentStreakDays: number;
  longestStreakDays: number;
  todayMinutesRead: number;
  dailyGoalMinutes: number;
  weeklyDaysGoal: number;
  annualBooksGoal: number;
}

export interface UserStatsPayload {
  summary: ReadingSummaryStats;
  goals: ReadingGoalRow;
  dailyActivity: DailyActivityStat[];
  monthlyActivity: MonthlyActivityStat[];
  genres: GenreStat[];
  insights: ReadingInsight;
  achievements: AchievementWithProgress[];
  recentHistory: ReadingHistoryItem[];
}
