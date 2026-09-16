"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { createClient } from "@/lib/supabase/client";

export interface DailyReadingProgress {
  minutesReadToday: number;
  dailyGoalMinutes: number;
  booksCompleted: number;
  progressPercent: number;
  hasGoal: boolean;
  isLoading: boolean;
}

/**
 * Real-time dynamic daily reading goal & progress tracker.
 * For new users without a saved goal, initializes to zero until explicitly set.
 */
export function useDailyReadingProgress(): DailyReadingProgress {
  const { user } = useAuth();
  const [data, setData] = React.useState<DailyReadingProgress>({
    minutesReadToday: 0,
    dailyGoalMinutes: 0,
    booksCompleted: 0,
    progressPercent: 0,
    hasGoal: false,
    isLoading: true,
  });

  const loadProgress = React.useCallback(async () => {
    if (!user) {
      setData({
        minutesReadToday: 0,
        dailyGoalMinutes: 0,
        booksCompleted: 0,
        progressPercent: 0,
        hasGoal: false,
        isLoading: false,
      });
      return;
    }

    try {
      const supabase = createClient();
      const todayStr = new Date().toISOString().split("T")[0];

      // Fetch user's reading goal, today's sessions, and completed books in parallel
      const [goalRes, sessionRes, progressRes] = await Promise.all([
        supabase
          .from("reading_goals")
          .select("daily_minutes_goal")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("reading_sessions")
          .select("duration_seconds")
          .eq("user_id", user.id)
          .eq("session_date", todayStr),
        supabase
          .from("reading_progress")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .or("is_completed.eq.true,progress_percentage.gte.100"),
      ]);

      const goalMinutes = goalRes.data?.daily_minutes_goal || 0;
      const todaySeconds = (sessionRes.data || []).reduce(
        (acc, s) => acc + (s.duration_seconds || 0),
        0
      );
      const minutesToday = Math.round(todaySeconds / 60);
      const completedBooks = progressRes.count || 0;

      const percent =
        goalMinutes > 0
          ? Math.min(100, Math.round((minutesToday / goalMinutes) * 100))
          : 0;

      setData({
        minutesReadToday: minutesToday,
        dailyGoalMinutes: goalMinutes,
        booksCompleted: completedBooks,
        progressPercent: percent,
        hasGoal: goalMinutes > 0,
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to load daily reading progress:", err);
      setData((prev) => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  React.useEffect(() => {
    loadProgress();

    const handleGoalUpdate = () => loadProgress();
    const handleSessionUpdate = () => loadProgress();
    const handleProgressUpdate = () => loadProgress();

    window.addEventListener("reading-goals-updated", handleGoalUpdate);
    window.addEventListener("reading-session-recorded", handleSessionUpdate);
    window.addEventListener("reading-progress-updated", handleProgressUpdate);

    return () => {
      window.removeEventListener("reading-goals-updated", handleGoalUpdate);
      window.removeEventListener("reading-session-recorded", handleSessionUpdate);
      window.removeEventListener("reading-progress-updated", handleProgressUpdate);
    };
  }, [loadProgress]);

  return data;
}
