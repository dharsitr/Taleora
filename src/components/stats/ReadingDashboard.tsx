"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Target,
  BarChart3,
  Award,
  History,
  RefreshCw,
  LogIn,
  Sparkles,
  Flame,
} from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import { getUserReadingStats } from "@/lib/stats/queries";
import { UserStatsPayload, ReadingGoalRow } from "@/types/stats";
import { StatsSummaryGrid } from "./StatsSummaryGrid";
import { DailyGoalCard } from "./DailyGoalCard";
import { WeeklyActivityChart } from "./WeeklyActivityChart";
import { StreakTrackerCard } from "./StreakTrackerCard";
import { ReadingInsightsCard } from "./ReadingInsightsCard";
import { FavoriteGenresCard } from "./FavoriteGenresCard";
import { ReadingHistoryList } from "./ReadingHistoryList";
import { AchievementsSection } from "./AchievementsSection";
import { ReadingConstellationHeatmap } from "./ReadingConstellationHeatmap";
import { GoalSettingModal } from "./GoalSettingModal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type DashboardTab = "overview" | "achievements" | "history";

export function ReadingDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [statsData, setStatsData] = React.useState<UserStatsPayload | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<DashboardTab>("overview");
  const [goalModalOpen, setGoalModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=/goals&notice=${encodeURIComponent("Sign in to view your reading goals")}`);
    }
  }, [authLoading, user, router]);

  const fetchStats = React.useCallback(async () => {
    if (!user) {
      setStatsData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getUserReadingStats(user.id);
      setStatsData(data);
    } catch (err) {
      console.error("Failed to load reading stats:", err);
      setStatsData(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (!authLoading) {
      fetchStats();
    }
  }, [authLoading, fetchStats]);

  const handleGoalUpdated = (newGoals: ReadingGoalRow) => {
    setStatsData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        goals: newGoals,
        summary: {
          ...prev.summary,
          dailyGoalMinutes: newGoals.daily_minutes_goal,
          weeklyDaysGoal: newGoals.weekly_days_goal,
          annualBooksGoal: newGoals.annual_books_goal,
        },
      };
    });
  };

  // Extract all historical activity dates for the constellation heatmap
  const activityDates = React.useMemo(() => {
    if (!statsData) return [];
    const dates: string[] = [];
    if (statsData.recentHistory) {
      statsData.recentHistory.forEach((h) => {
        if (h.timestamp) dates.push(h.timestamp);
      });
    }
    if (statsData.dailyActivity) {
      statsData.dailyActivity.forEach((d) => {
        if (d.minutes > 0) dates.push(d.date);
      });
    }
    return dates;
  }, [statsData]);

  if (!authLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-6 max-w-md mx-auto animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
          <Target className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Sign in to your Sanctum</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Please sign in to track your daily reading goals, habit constellations, and unlock prestigious literary wax seals.
        </p>
        <Link href={`/login?next=/goals&notice=${encodeURIComponent("Sign in to view your reading goals")}`}>
          <Button className="h-10 px-6 gap-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md">
            <LogIn className="w-4 h-4" />
            <span>Sign In to Taleora</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-6xl mx-auto w-full">
      {/* Top Header & Page Title with Ambient Warm Lighting */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-card/80 p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-mono tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>The Reader&apos;s Chronicle & Habit Sanctum</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Reading Goals & Analytics
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Track daily literary rituals, cultivate continuous streaks, and archive your achievements within Taleora&apos;s private reading vault.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={isLoading}
              className="h-9 text-xs font-semibold gap-1.5 border-border/80 hover:border-amber-500/40 hover:text-amber-400 bg-stone-900/40"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
              <span>Refresh</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setGoalModalOpen(true)}
              className="h-9 text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md shadow-amber-500/20"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Adjust Targets</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Segmented Dock Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-stone-900/60 dark:bg-stone-950/70 border border-border/60 self-start backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
            activeTab === "overview"
              ? "bg-amber-500 text-stone-950 shadow-[0_0_12px_rgba(245,158,11,0.3)] font-bold"
              : "text-muted-foreground hover:text-amber-300 hover:bg-white/5"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Overview & Habits</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("achievements")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
            activeTab === "achievements"
              ? "bg-amber-500 text-stone-950 shadow-[0_0_12px_rgba(245,158,11,0.3)] font-bold"
              : "text-muted-foreground hover:text-amber-300 hover:bg-white/5"
          )}
        >
          <Award className="w-4 h-4" />
          <span>Wax Seals & Medals</span>
          {statsData && (
            <span
              className={cn(
                "ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                activeTab === "achievements"
                  ? "bg-stone-950 text-amber-400"
                  : "bg-amber-500/20 text-amber-400"
              )}
            >
              {statsData.achievements.filter((a) => a.isUnlocked).length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
            activeTab === "history"
              ? "bg-amber-500 text-stone-950 shadow-[0_0_12px_rgba(245,158,11,0.3)] font-bold"
              : "text-muted-foreground hover:text-amber-300 hover:bg-white/5"
          )}
        >
          <History className="w-4 h-4" />
          <span>Reading History</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && !statsData ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-muted/40 border border-border/50" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="h-64 rounded-2xl bg-muted/40 border border-border/50" />
            <div className="h-64 rounded-2xl bg-muted/40 border border-border/50" />
          </div>
          <div className="h-72 rounded-2xl bg-muted/40 border border-border/50" />
        </div>
      ) : statsData ? (
        <>
          {/* TAB 1: Overview & Habits */}
          {activeTab === "overview" && (
            <div className="space-y-7 animate-in fade-in duration-300">
              {/* High-level summary metrics grid */}
              <StatsSummaryGrid summary={statsData.summary} />

              {/* Middle Row: Circular Goal Progress Ring & Streak Tracker */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <DailyGoalCard
                  todayMinutes={statsData.summary.todayMinutesRead}
                  dailyGoalMinutes={statsData.summary.dailyGoalMinutes}
                  onOpenGoalModal={() => setGoalModalOpen(true)}
                />
                <StreakTrackerCard
                  currentStreak={statsData.summary.currentStreakDays}
                  longestStreak={statsData.summary.longestStreakDays}
                  todayMinutes={statsData.summary.todayMinutesRead}
                  dailyActivity={statsData.dailyActivity}
                />
              </div>

              {/* 365-Day Celestial Reading Constellation Heatmap */}
              <ReadingConstellationHeatmap
                activityDates={activityDates}
                todayMinutes={statsData.summary.todayMinutesRead}
              />

              {/* Weekly Activity Bar Chart */}
              <WeeklyActivityChart
                dailyActivity={statsData.dailyActivity}
                dailyGoalMinutes={statsData.summary.dailyGoalMinutes}
              />

              {/* Bottom Row: Insights & Favorite Genres */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <ReadingInsightsCard insights={statsData.insights} />
                <FavoriteGenresCard genres={statsData.genres} />
              </div>

              {/* Mini Preview of Recent History */}
              <div className="pt-2">
                <ReadingHistoryList history={statsData.recentHistory.slice(0, 5)} />
              </div>
            </div>
          )}

          {/* TAB 2: Achievements & Badges */}
          {activeTab === "achievements" && (
            <div className="animate-in fade-in duration-300">
              <AchievementsSection achievements={statsData.achievements} />
            </div>
          )}

          {/* TAB 3: Reading History */}
          {activeTab === "history" && (
            <div className="animate-in fade-in duration-300">
              <ReadingHistoryList history={statsData.recentHistory} />
            </div>
          )}
        </>
      ) : null}

      {/* Goal Adjustment Modal */}
      {statsData && (
        <GoalSettingModal
          isOpen={goalModalOpen}
          onClose={() => setGoalModalOpen(false)}
          goals={statsData.goals}
          userId={user?.id || null}
          onGoalUpdated={handleGoalUpdated}
        />
      )}
    </div>
  );
}
