import { createClient } from "@/lib/supabase/server";
import { calculateStreaks } from "@/lib/stats/queries";
import type { UserHomeStats } from "@/types/stats";

/**
 * Computes Monday-to-Sunday week day objects for the current calendar week.
 */
export function getCurrentWeekDays(activeDates: string[]) {
  const activeSet = new Set(activeDates);
  const now = new Date();
  const currentDay = now.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
  // Distance from today to Monday of the current week:
  const distToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distToMonday);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return dayLabels.map((dayName, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dateStr = d.toISOString().split("T")[0];
    const isToday = dateStr === now.toISOString().split("T")[0];
    const active = activeSet.has(dateStr);

    return {
      day: dayName,
      active,
      isToday,
      date: dateStr,
    };
  });
}

/**
 * Server-side helper to fetch real streak, goal, and reading status for the home page.
 * Returns null if user is not authenticated.
 */
export async function getUserHomeStats(): Promise<UserHomeStats | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const todayStr = new Date().toISOString().split("T")[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 14);
    const fourteenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const [profileRes, goalsRes, sessionsRes, progressRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("streak_days, daily_reading_goal_minutes, last_read_date")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("reading_goals")
        .select("daily_minutes_goal")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("reading_sessions")
        .select("session_date, duration_seconds")
        .eq("user_id", user.id)
        .gte("session_date", fourteenDaysAgoStr),
      supabase
        .from("reading_progress")
        .select(`
          progress_percentage,
          last_read_at,
          current_chapter_id,
          book:books(id, title, slug, subtitle, cover_gradient, cover_accent, total_chapters),
          chapter:chapters!reading_progress_current_chapter_id_fkey(chapter_number, title)
        `)
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .order("last_read_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const profile = profileRes.data;
    const goals = goalsRes.data;
    const sessions = sessionsRes.data || [];
    const currentRead = progressRes.data;

    // Today's reading minutes
    const todaySessions = sessions.filter((s) => s.session_date === todayStr);
    const todayMinutes = Math.round(
      todaySessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / 60
    );

    // Activity dates set
    const activeDatesSet = new Set<string>();
    sessions.forEach((s) => activeDatesSet.add(s.session_date));
    if (profile?.last_read_date) activeDatesSet.add(profile.last_read_date);
    if (currentRead?.last_read_at) activeDatesSet.add(currentRead.last_read_at.split("T")[0]);

    // Calculate streak
    const allActivityDates = Array.from(activeDatesSet);
    const computedStreak = calculateStreaks(allActivityDates).currentStreak;
    const streakDays = Math.max(profile?.streak_days ?? 0, computedStreak);

    // Daily goal
    const dailyGoalMinutes =
      goals?.daily_minutes_goal && goals.daily_minutes_goal > 0
        ? goals.daily_minutes_goal
        : profile?.daily_reading_goal_minutes || 30;

    return {
      isLoggedIn: true,
      streakDays,
      todayMinutes,
      dailyGoalMinutes,
      activeDates: Array.from(activeDatesSet),
      currentRead: currentRead
        ? {
            bookId: currentRead.book?.id,
            bookTitle: currentRead.book?.title || "Story in progress",
            bookSlug: currentRead.book?.slug || "",
            progressPercentage: Math.round(Number(currentRead.progress_percentage || 0)),
            chapterNumber: currentRead.chapter?.chapter_number,
            chapterTitle: currentRead.chapter?.title,
          }
        : null,
    };
  } catch (err) {
    console.warn("Could not load user home stats:", err);
    return null;
  }
}
