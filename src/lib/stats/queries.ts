import { createClient } from "@/lib/supabase/client";
import {
  ReadingSessionRow,
  ReadingGoalRow,
  AchievementRow,
  UserAchievementRow,
  AchievementWithProgress,
  DailyActivityStat,
  MonthlyActivityStat,
  GenreStat,
  ReadingInsight,
  ReadingHistoryItem,
  ReadingSummaryStats,
  UserStatsPayload,
  TimeOfDaySlot,
} from "@/types/stats";

export const DEFAULT_GOALS: Omit<ReadingGoalRow, "id" | "user_id" | "created_at" | "updated_at"> = {
  daily_minutes_goal: 15,
  weekly_days_goal: 5,
  annual_books_goal: 12,
};

/**
 * Record or increment a reading session in Supabase.
 */
export async function recordReadingSession(input: {
  userId: string;
  bookId: string;
  chapterId?: string | null;
  durationSeconds: number;
  pagesRead: number;
}): Promise<ReadingSessionRow | null> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  try {
    const { data, error } = await supabase
      .from("reading_sessions")
      .insert({
        user_id: input.userId,
        book_id: input.bookId,
        chapter_id: input.chapterId || null,
        duration_seconds: Math.max(1, Math.round(input.durationSeconds)),
        pages_read: Math.max(0, input.pagesRead),
        session_date: today,
        started_at: new Date(Date.now() - input.durationSeconds * 1000).toISOString(),
        ended_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error recording reading session:", error);
      return null;
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("reading-session-recorded"));
    }

    return data as ReadingSessionRow;
  } catch (err) {
    console.error("Failed to record reading session:", err);
    return null;
  }
}

/**
 * Get user reading goals or return zero defaults if not yet set by the user.
 */
export async function getUserReadingGoal(userId: string): Promise<ReadingGoalRow> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reading_goals")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return {
      id: "default",
      user_id: userId,
      daily_minutes_goal: 0,
      weekly_days_goal: 0,
      annual_books_goal: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return data as ReadingGoalRow;
}

/**
 * Update user reading goals.
 */
export async function updateUserReadingGoal(
  userId: string,
  goals: {
    dailyMinutes?: number;
    weeklyDays?: number;
    annualBooks?: number;
  }
): Promise<ReadingGoalRow | null> {
  const supabase = createClient();

  const payload = {
    user_id: userId,
    updated_at: new Date().toISOString(),
    ...(goals.dailyMinutes !== undefined ? { daily_minutes_goal: goals.dailyMinutes } : {}),
    ...(goals.weeklyDays !== undefined ? { weekly_days_goal: goals.weeklyDays } : {}),
    ...(goals.annualBooks !== undefined ? { annual_books_goal: goals.annualBooks } : {}),
  };

  const { data, error } = await supabase
    .from("reading_goals")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    console.error("Error updating reading goals:", error);
    return null;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("reading-goals-updated", { detail: data }));
  }

  return data as ReadingGoalRow;
}

/**
 * Helper to compute consecutive day streaks from a list of date strings (YYYY-MM-DD).
 */
function calculateStreaks(dates: string[]): { currentStreak: number; longestStreak: number } {
  if (!dates || dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const uniqueSortedDates = Array.from(new Set(dates)).sort().reverse();
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;
  let previousDate: Date | null = null;

  // Check if today or yesterday has activity to maintain active streak
  const hasReadToday = uniqueSortedDates.includes(todayStr);
  const hasReadYesterday = uniqueSortedDates.includes(yesterday);

  if (!hasReadToday && !hasReadYesterday) {
    currentStreak = 0;
  }

  for (let i = 0; i < uniqueSortedDates.length; i++) {
    const curDate = new Date(uniqueSortedDates[i] + "T00:00:00Z");

    if (previousDate === null) {
      runningStreak = 1;
    } else {
      const diffMs = previousDate.getTime() - curDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        runningStreak++;
      } else if (diffDays > 1) {
        runningStreak = 1;
      }
    }

    if (i === 0 && (hasReadToday || hasReadYesterday)) {
      currentStreak = runningStreak;
    } else if (hasReadToday || hasReadYesterday) {
      // Continue tracking current streak as long as consecutive
      if (runningStreak > currentStreak && i === runningStreak - 1) {
        currentStreak = runningStreak;
      }
    }

    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }

    previousDate = curDate;
  }

  return {
    currentStreak: Math.max(currentStreak, (hasReadToday || hasReadYesterday) ? currentStreak : 0),
    longestStreak: Math.max(longestStreak, currentStreak),
  };
}

/**
 * Fetch and aggregate comprehensive user reading statistics and gamification progress.
 */
export async function getUserReadingStats(userId: string): Promise<UserStatsPayload> {
  const supabase = createClient();

  // 1. Fetch reading progress
  const { data: progressRows, error: progressError } = await supabase
    .from("reading_progress")
    .select(`
      *,
      book:books (
        id,
        title,
        slug,
        cover_image_url,
        total_chapters,
        author:authors (name),
        genres:book_genres (
          genre:genres (id, name, slug)
        )
      ),
      current_chapter:chapters (
        id,
        chapter_number,
        title,
        estimated_read_minutes
      )
    `)
    .eq("user_id", userId)
    .order("last_read_at", { ascending: false });

  if (progressError) {
    console.error("Error loading reading progress for stats:", progressError);
  }

  // 2. Fetch reading sessions
  const { data: sessionRows, error: sessionError } = await supabase
    .from("reading_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (sessionError) {
    console.error("Error loading reading sessions for stats:", sessionError);
  }

  // 3. Fetch goals
  const goals = await getUserReadingGoal(userId);

  // 4. Fetch achievements catalogue & user achievements
  const [achievementsRes, userAchievementsRes, highlightsRes, bookmarksRes] = await Promise.all([
    supabase.from("achievements").select("*").order("order_index", { ascending: true }),
    supabase.from("user_achievements").select("*").eq("user_id", userId),
    supabase.from("highlights").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("bookmarks").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const allAchievements = (achievementsRes.data as unknown as AchievementRow[]) || [];
  const userAchievements = (userAchievementsRes.data as unknown as UserAchievementRow[]) || [];
  const totalAnnotations = (highlightsRes.count || 0) + (bookmarksRes.count || 0);

  const sessions: ReadingSessionRow[] = sessionRows || [];
  const progressList = progressRows || [];

  // Date constants
  const todayStr = new Date().toISOString().split("T")[0];

  // A. Total Books Completed
  const completedBooks = progressList.filter((p) => p.is_completed || Number(p.progress_percentage) >= 100);
  const totalBooksCompleted = completedBooks.length;

  // B. Total Chapters Read
  let totalChaptersRead = 0;
  progressList.forEach((p) => {
    const totalCh = p.book?.total_chapters || 1;
    const progressFrac = Math.min(100, Number(p.progress_percentage || 0)) / 100;
    totalChaptersRead += Math.max(1, Math.round(totalCh * progressFrac));
  });

  // C. Total Pages Read
  let totalPagesRead = 0;
  if (sessions.length > 0) {
    totalPagesRead = sessions.reduce((acc, s) => acc + (s.pages_read || 0), 0);
  }
  if (totalPagesRead === 0 && progressList.length > 0) {
    // Fallback: estimate ~4 pages per chapter
    totalPagesRead = totalChaptersRead * 4;
  }

  // D. Total Reading Time (minutes)
  let totalMinutesRead = 0;
  if (sessions.length > 0) {
    totalMinutesRead = Math.round(
      sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / 60
    );
  }
  if (totalMinutesRead === 0 && progressList.length > 0) {
    // Fallback based on chapters and estimated_read_minutes
    totalMinutesRead = progressList.reduce((acc, p) => {
      const chMinutes = p.current_chapter?.estimated_read_minutes || 4;
      const chCount = Math.max(1, Math.round((p.book?.total_chapters || 1) * (Number(p.progress_percentage || 0) / 100)));
      return acc + chCount * chMinutes;
    }, 0);
  }

  // E. Today Minutes Read
  const todaySessions = sessions.filter((s) => s.session_date === todayStr);
  const todayMinutesRead = Math.round(
    todaySessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / 60
  );

  // F. Streaks
  const activityDates: string[] = [
    ...sessions.map((s) => s.session_date),
    ...progressList.map((p) => p.last_read_at ? p.last_read_at.split("T")[0] : ""),
  ].filter(Boolean);

  const { currentStreak, longestStreak } = calculateStreaks(activityDates);

  // G. Past 7 Days Daily Activity
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyActivity: DailyActivityStat[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = dayNames[d.getDay()];

    const daySessions = sessions.filter((s) => s.session_date === dateStr);
    const minutes = Math.round(daySessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / 60);
    const pages = daySessions.reduce((acc, s) => acc + (s.pages_read || 0), 0);

    dailyActivity.push({
      date: dateStr,
      dayName,
      minutes,
      pages,
    });
  }


  // H. Past 6 Months Activity
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyActivity: MonthlyActivityStat[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthName = monthNames[d.getMonth()];

    const monthSessions = sessions.filter((s) => s.session_date && s.session_date.startsWith(yearMonth));
    const minutes = Math.round(monthSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / 60);

    const booksCompletedInMonth = completedBooks.filter((b) => {
      const completedDate = b.completed_at || b.updated_at;
      return completedDate && completedDate.startsWith(yearMonth);
    }).length;

    monthlyActivity.push({
      month: yearMonth,
      monthName,
      minutes,
      booksCompleted: booksCompletedInMonth,
    });
  }


  // I. Favorite Genres Breakdown
  const genreCountMap = new Map<string, { id: string; name: string; slug: string; minutes: number; books: number }>();
  let totalGenreHits = 0;

  progressList.forEach((p) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookGenres: any[] = p.book?.genres || [];
    bookGenres.forEach((bg) => {
      const g = bg.genre;
      if (!g) return;
      const existing = genreCountMap.get(g.id) || { id: g.id, name: g.name, slug: g.slug, minutes: 0, books: 0 };
      existing.books += 1;
      existing.minutes += Math.max(10, Math.round((p.book?.total_chapters || 1) * 8));
      genreCountMap.set(g.id, existing);
      totalGenreHits++;
    });
  });

  const genres: GenreStat[] = Array.from(genreCountMap.values())
    .map((g) => ({
      genreId: g.id,
      name: g.name,
      slug: g.slug,
      minutesRead: g.minutes,
      booksCount: g.books,
      percentage: totalGenreHits > 0 ? Math.round((g.books / totalGenreHits) * 100) : 0,
    }))
    .sort((a, b) => b.booksCount - a.booksCount)
    .slice(0, 6);

  // J. Reading Insights & Time of Day Analysis
  let morningHits = 0;
  let afternoonHits = 0;
  let eveningHits = 0;
  let nightHits = 0;
  const dayOfWeekCount: Record<string, number> = {};

  sessions.forEach((s) => {
    const started = new Date(s.started_at || s.created_at);
    const hour = started.getHours();

    if (hour >= 6 && hour < 12) morningHits++;
    else if (hour >= 12 && hour < 17) afternoonHits++;
    else if (hour >= 17 && hour < 22) eveningHits++;
    else nightHits++;

    const dName = dayNames[started.getDay()];
    dayOfWeekCount[dName] = (dayOfWeekCount[dName] || 0) + 1;
  });

  const totalSessionCount = sessions.length;
  const defaultTotal = Math.max(1, morningHits + afternoonHits + eveningHits + nightHits);

  let bestTimeOfDay: TimeOfDaySlot = "Evening";
  const maxSlot = Math.max(morningHits, afternoonHits, eveningHits, nightHits);
  if (maxSlot === morningHits && morningHits > 0) bestTimeOfDay = "Morning";
  else if (maxSlot === afternoonHits && afternoonHits > 0) bestTimeOfDay = "Afternoon";
  else if (maxSlot === eveningHits && eveningHits > 0) bestTimeOfDay = "Evening";
  else if (maxSlot === nightHits && nightHits > 0) bestTimeOfDay = "Night";

  let mostActiveDay = "Sunday";
  let maxDayCount = 0;
  Object.entries(dayOfWeekCount).forEach(([d, count]) => {
    if (count > maxDayCount) {
      maxDayCount = count;
      mostActiveDay = d;
    }
  });

  const avgSessionMinutes = totalSessionCount > 0 ? Math.round(totalMinutesRead / totalSessionCount) : 15;
  const activeDaysCount = Math.max(1, new Set(activityDates).size);
  const avgDailyMinutes = Math.round(totalMinutesRead / activeDaysCount);
  const completionRate = progressList.length > 0 ? Math.round((totalBooksCompleted / progressList.length) * 100) : 0;

  const insights: ReadingInsight = {
    bestTimeOfDay,
    morningPercentage: Math.round((morningHits / defaultTotal) * 100),
    afternoonPercentage: Math.round((afternoonHits / defaultTotal) * 100),
    eveningPercentage: Math.round((eveningHits / defaultTotal) * 100),
    nightPercentage: Math.round((nightHits / defaultTotal) * 100),
    avgSessionMinutes,
    avgDailyMinutes,
    mostActiveDayOfWeek: mostActiveDay,
    completionRate,
  };

  // K. Achievements Progression & Auto-Unlock
  const userAchMap = new Map(userAchievements.map((ua) => [ua.achievement_id, ua]));
  const achievementsToInsert: {
    user_id: string;
    achievement_id: string;
    progress_value: number;
    is_unlocked: boolean;
    unlocked_at: string | null;
  }[] = [];

  const achievementsWithProgress: AchievementWithProgress[] = allAchievements.map((ach) => {
    const existing = userAchMap.get(ach.id);
    let progressVal = existing?.progress_value || 0;

    switch (ach.target_type) {
      case "chapters_read":
        progressVal = Math.max(progressVal, totalChaptersRead);
        break;
      case "pages_read":
        progressVal = Math.max(progressVal, totalPagesRead);
        break;
      case "books_completed":
        progressVal = Math.max(progressVal, totalBooksCompleted);
        break;
      case "minutes_read":
        progressVal = Math.max(progressVal, totalMinutesRead);
        break;
      case "streak_days":
        progressVal = Math.max(progressVal, longestStreak);
        break;
      case "genres_read":
        progressVal = Math.max(progressVal, genres.length);
        break;
      case "highlights_created":
        progressVal = Math.max(progressVal, totalAnnotations);
        break;
      case "night_sessions":
        progressVal = Math.max(progressVal, nightHits);
        break;
    }

    const isUnlocked = progressVal >= ach.target_value;
    const unlockedAt = existing?.is_unlocked
      ? existing.unlocked_at
      : isUnlocked
      ? new Date().toISOString()
      : null;

    if (!existing || (isUnlocked && !existing.is_unlocked)) {
      achievementsToInsert.push({
        user_id: userId,
        achievement_id: ach.id,
        progress_value: progressVal,
        is_unlocked: isUnlocked,
        unlocked_at: unlockedAt,
      });
    }

    const percent = Math.min(100, Math.round((progressVal / ach.target_value) * 100));

    return {
      ...ach,
      progressValue: progressVal,
      isUnlocked,
      unlockedAt,
      percent,
    };
  });

  // Background sync newly unlocked achievements
  if (achievementsToInsert.length > 0) {
    (async () => {
      try {
        const { error } = await supabase
          .from("user_achievements")
          .upsert(achievementsToInsert, { onConflict: "user_id,achievement_id" });
        if (error) console.error("Error auto-updating user achievements:", error);
      } catch (err) {
        console.error("Failed to sync user achievements:", err);
      }
    })();
  }

  // L. Recent Reading History
  const recentHistory: ReadingHistoryItem[] = progressList.slice(0, 10).map((p) => {
    return {
      id: p.id,
      bookId: p.book_id,
      bookTitle: p.book?.title || "Untitled Book",
      bookSlug: p.book?.slug || "",
      coverImageUrl: p.book?.cover_image_url || null,
      chapterTitle: p.current_chapter?.title || null,
      chapterNumber: p.current_chapter?.chapter_number || 1,
      durationMinutes: p.current_chapter?.estimated_read_minutes || 5,
      pagesRead: Math.max(1, Math.round((Number(p.progress_percentage || 0) / 100) * (p.book?.total_chapters || 1) * 4)),
      timestamp: p.last_read_at || p.updated_at || new Date().toISOString(),
      progressPercentage: Number(p.progress_percentage || 0),
      isCompleted: p.is_completed || Number(p.progress_percentage || 0) >= 100,
    };
  });

  const summary: ReadingSummaryStats = {
    totalBooksCompleted,
    totalChaptersRead,
    totalPagesRead,
    totalMinutesRead,
    currentStreakDays: currentStreak,
    longestStreakDays: longestStreak,
    todayMinutesRead,
    dailyGoalMinutes: goals.daily_minutes_goal,
    weeklyDaysGoal: goals.weekly_days_goal,
    annualBooksGoal: goals.annual_books_goal,
  };

  return {
    summary,
    goals,
    dailyActivity,
    monthlyActivity,
    genres,
    insights,
    achievements: achievementsWithProgress,
    recentHistory,
  };
}

/**
 * Return sample demo reading stats for unauthenticated guests.
 */
export function getDemoReadingStats(): UserStatsPayload {
  const demoDaily: DailyActivityStat[] = [
    { date: "2026-09-07", dayName: "Mon", minutes: 25, pages: 12 },
    { date: "2026-09-08", dayName: "Tue", minutes: 30, pages: 15 },
    { date: "2026-09-09", dayName: "Wed", minutes: 20, pages: 8 },
    { date: "2026-09-10", dayName: "Thu", minutes: 45, pages: 22 },
    { date: "2026-09-11", dayName: "Fri", minutes: 15, pages: 6 },
    { date: "2026-09-12", dayName: "Sat", minutes: 60, pages: 30 },
    { date: "2026-09-13", dayName: "Sun", minutes: 35, pages: 18 },
  ];

  const demoMonthly: MonthlyActivityStat[] = [
    { month: "2026-04", monthName: "Apr", minutes: 180, booksCompleted: 1 },
    { month: "2026-05", monthName: "May", minutes: 240, booksCompleted: 1 },
    { month: "2026-06", monthName: "Jun", minutes: 320, booksCompleted: 2 },
    { month: "2026-07", monthName: "Jul", minutes: 410, booksCompleted: 2 },
    { month: "2026-08", monthName: "Aug", minutes: 290, booksCompleted: 1 },
    { month: "2026-09", monthName: "Sep", minutes: 230, booksCompleted: 1 },
  ];

  const demoGenres: GenreStat[] = [
    { genreId: "1", name: "Romance", slug: "romance", minutesRead: 280, booksCount: 3, percentage: 40 },
    { genreId: "2", name: "Fantasy", slug: "fantasy", minutesRead: 190, booksCount: 2, percentage: 28 },
    { genreId: "3", name: "Mystery", slug: "mystery", minutesRead: 140, booksCount: 2, percentage: 20 },
    { genreId: "4", name: "Thriller", slug: "thriller", minutesRead: 80, booksCount: 1, percentage: 12 },
  ];

  const demoAchievements: AchievementWithProgress[] = [
    {
      id: "first_chapter",
      title: "First Steps",
      description: "Read your first chapter on Taleora.",
      category: "volume",
      tier: "bronze",
      icon_name: "BookOpen",
      target_type: "chapters_read",
      target_value: 1,
      order_index: 1,
      created_at: new Date().toISOString(),
      progressValue: 1,
      isUnlocked: true,
      unlockedAt: "2026-09-08T12:00:00Z",
      percent: 100,
    },
    {
      id: "page_turner",
      title: "Page Turner",
      description: "Read at least 50 pages of stories.",
      category: "volume",
      tier: "bronze",
      icon_name: "Bookmark",
      target_type: "pages_read",
      target_value: 50,
      order_index: 2,
      created_at: new Date().toISOString(),
      progressValue: 111,
      isUnlocked: true,
      unlockedAt: "2026-09-11T16:20:00Z",
      percent: 100,
    },
    {
      id: "streak_7",
      title: "Unstoppable Habit",
      description: "Maintain a 7-day reading streak.",
      category: "streak",
      tier: "silver",
      icon_name: "Zap",
      target_type: "streak_days",
      target_value: 7,
      order_index: 7,
      created_at: new Date().toISOString(),
      progressValue: 5,
      isUnlocked: false,
      unlockedAt: null,
      percent: 71,
    },
    {
      id: "bookworm",
      title: "Story Finisher",
      description: "Complete your first full book.",
      category: "completion",
      tier: "bronze",
      icon_name: "Award",
      target_type: "books_completed",
      target_value: 1,
      order_index: 3,
      created_at: new Date().toISOString(),
      progressValue: 1,
      isUnlocked: true,
      unlockedAt: "2026-09-12T19:45:00Z",
      percent: 100,
    },
    {
      id: "centurion",
      title: "Centurion",
      description: "Accumulate 300 minutes of reading time.",
      category: "volume",
      tier: "gold",
      icon_name: "Compass",
      target_type: "minutes_read",
      target_value: 300,
      order_index: 10,
      created_at: new Date().toISOString(),
      progressValue: 230,
      isUnlocked: false,
      unlockedAt: null,
      percent: 77,
    },
    {
      id: "streak_30",
      title: "Literary Devotion",
      description: "Maintain an incredible 30-day reading streak.",
      category: "streak",
      tier: "diamond",
      icon_name: "Sparkles",
      target_type: "streak_days",
      target_value: 30,
      order_index: 8,
      created_at: new Date().toISOString(),
      progressValue: 5,
      isUnlocked: false,
      unlockedAt: null,
      percent: 17,
    },
  ];

  return {
    isDemo: true,
    summary: {
      totalBooksCompleted: 2,
      totalChaptersRead: 14,
      totalPagesRead: 111,
      totalMinutesRead: 230,
      currentStreakDays: 5,
      longestStreakDays: 7,
      todayMinutesRead: 35,
      dailyGoalMinutes: 20,
      weeklyDaysGoal: 5,
      annualBooksGoal: 15,
    },
    goals: {
      id: "demo",
      user_id: "demo",
      daily_minutes_goal: 20,
      weekly_days_goal: 5,
      annual_books_goal: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    dailyActivity: demoDaily,
    monthlyActivity: demoMonthly,
    genres: demoGenres,
    insights: {
      bestTimeOfDay: "Evening",
      morningPercentage: 15,
      afternoonPercentage: 25,
      eveningPercentage: 45,
      nightPercentage: 15,
      avgSessionMinutes: 28,
      avgDailyMinutes: 32,
      mostActiveDayOfWeek: "Saturday",
      completionRate: 67,
    },
    achievements: demoAchievements,
    recentHistory: [
      {
        id: "demo-h1",
        bookId: "b1",
        bookTitle: "First Story",
        bookSlug: "first-story",
        coverImageUrl: null,
        chapterTitle: "The Billionaire's Return",
        chapterNumber: 1,
        durationMinutes: 35,
        pagesRead: 18,
        timestamp: new Date().toISOString(),
        progressPercentage: 42,
        isCompleted: false,
      },
      {
        id: "demo-h2",
        bookId: "b2",
        bookTitle: "Whispers of the Silverwood",
        bookSlug: "whispers-of-the-silverwood",
        coverImageUrl: null,
        chapterTitle: "The Ancient Canopy",
        chapterNumber: 4,
        durationMinutes: 25,
        pagesRead: 12,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        progressPercentage: 100,
        isCompleted: true,
      },
    ],
  };
}
