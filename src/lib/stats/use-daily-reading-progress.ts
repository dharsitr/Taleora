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

// Module-level shared cache and inflight promise deduplication to prevent duplicate queries
// across simultaneously mounted components (e.g. Sidebar and MobileNav in AppShell).
let sharedCache: {
  userId: string;
  data: DailyReadingProgress;
  timestamp: number;
} | null = null;

let inflightPromise: Promise<DailyReadingProgress> | null = null;
let inflightUserId: string | null = null;

const subscribers = new Set<(val: DailyReadingProgress) => void>();

function notifySubscribers(progress: DailyReadingProgress) {
  subscribers.forEach((callback) => {
    try {
      callback(progress);
    } catch (e) {
      console.warn("Error updating reading progress subscriber:", e);
    }
  });
}

async function fetchProgressForUser(userId: string): Promise<DailyReadingProgress> {
  // If identical request already inflight, reuse it
  if (inflightPromise && inflightUserId === userId) {
    return inflightPromise;
  }

  inflightUserId = userId;
  inflightPromise = (async () => {
    try {
      const supabase = createClient();
      const todayStr = new Date().toISOString().split("T")[0];

      // Fetch user's reading goal, today's sessions, and completed books in parallel
      const [goalRes, sessionRes, progressRes] = await Promise.all([
        supabase
          .from("reading_goals")
          .select("daily_minutes_goal")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("reading_sessions")
          .select("duration_seconds")
          .eq("user_id", userId)
          .eq("session_date", todayStr),
        supabase
          .from("reading_progress")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
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

      const result: DailyReadingProgress = {
        minutesReadToday: minutesToday,
        dailyGoalMinutes: goalMinutes,
        booksCompleted: completedBooks,
        progressPercent: percent,
        hasGoal: goalMinutes > 0,
        isLoading: false,
      };

      sharedCache = {
        userId,
        data: result,
        timestamp: Date.now(),
      };

      notifySubscribers(result);
      return result;
    } catch (err) {
      console.error("Failed to load daily reading progress:", err);
      const fallback: DailyReadingProgress = sharedCache?.userId === userId
        ? sharedCache.data
        : {
            minutesReadToday: 0,
            dailyGoalMinutes: 0,
            booksCompleted: 0,
            progressPercent: 0,
            hasGoal: false,
            isLoading: false,
          };
      return fallback;
    } finally {
      inflightPromise = null;
      inflightUserId = null;
    }
  })();

  return inflightPromise;
}

/**
 * Real-time dynamic daily reading goal & progress tracker.
 * Deduplicates inflight requests so Sidebar and MobileNav never issue duplicate queries.
 */
export function useDailyReadingProgress(): DailyReadingProgress {
  const { user } = useAuth();

  // Initial state from shared cache if available for this user
  const [data, setData] = React.useState<DailyReadingProgress>(() => {
    if (!user) {
      return {
        minutesReadToday: 0,
        dailyGoalMinutes: 0,
        booksCompleted: 0,
        progressPercent: 0,
        hasGoal: false,
        isLoading: false,
      };
    }
    if (sharedCache && sharedCache.userId === user.id && Date.now() - sharedCache.timestamp < 30000) {
      return sharedCache.data;
    }
    return {
      minutesReadToday: sharedCache?.userId === user.id ? sharedCache.data.minutesReadToday : 0,
      dailyGoalMinutes: sharedCache?.userId === user.id ? sharedCache.data.dailyGoalMinutes : 0,
      booksCompleted: sharedCache?.userId === user.id ? sharedCache.data.booksCompleted : 0,
      progressPercent: sharedCache?.userId === user.id ? sharedCache.data.progressPercent : 0,
      hasGoal: sharedCache?.userId === user.id ? sharedCache.data.hasGoal : false,
      isLoading: !sharedCache || sharedCache.userId !== user.id,
    };
  });

  React.useEffect(() => {
    subscribers.add(setData);
    return () => {
      subscribers.delete(setData);
    };
  }, []);

  const loadProgress = React.useCallback(
    async (forceRefresh = false) => {
      if (!user) {
        const unauth: DailyReadingProgress = {
          minutesReadToday: 0,
          dailyGoalMinutes: 0,
          booksCompleted: 0,
          progressPercent: 0,
          hasGoal: false,
          isLoading: false,
        };
        setData(unauth);
        return;
      }

      // If cache is fresh and not force refreshing, return cached
      if (!forceRefresh && sharedCache && sharedCache.userId === user.id && Date.now() - sharedCache.timestamp < 15000) {
        setData(sharedCache.data);
        return;
      }

      const res = await fetchProgressForUser(user.id);
      setData(res);
    },
    [user]
  );

  React.useEffect(() => {
    loadProgress();

    const handleGoalUpdate = () => loadProgress(true);
    const handleSessionUpdate = () => loadProgress(true);
    const handleProgressUpdate = () => loadProgress(true);

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
