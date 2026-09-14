"use client";

import * as React from "react";
import Link from "next/link";
import {
  Target,
  BarChart3,
  Award,
  History,
  Sparkles,
  RefreshCw,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import { getUserReadingStats, getDemoReadingStats } from "@/lib/stats/queries";
import { UserStatsPayload, ReadingGoalRow } from "@/types/stats";
import { StatsSummaryGrid } from "./StatsSummaryGrid";
import { DailyGoalCard } from "./DailyGoalCard";
import { WeeklyActivityChart } from "./WeeklyActivityChart";
import { StreakTrackerCard } from "./StreakTrackerCard";
import { ReadingInsightsCard } from "./ReadingInsightsCard";
import { FavoriteGenresCard } from "./FavoriteGenresCard";
import { ReadingHistoryList } from "./ReadingHistoryList";
import { AchievementsSection } from "./AchievementsSection";
import { GoalSettingModal } from "./GoalSettingModal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type DashboardTab = "overview" | "achievements" | "history";

export function ReadingDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [statsData, setStatsData] = React.useState<UserStatsPayload | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<DashboardTab>("overview");
  const [goalModalOpen, setGoalModalOpen] = React.useState(false);

  const fetchStats = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        const data = await getUserReadingStats(user.id);
        setStatsData(data);
      } else {
        // Guest mode demo stats
        setStatsData(getDemoReadingStats());
      }
    } catch (err) {
      console.error("Failed to load reading stats:", err);
      // Graceful fallback
      setStatsData(getDemoReadingStats());
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

  const isGuest = !user;

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-6xl mx-auto w-full">
      {/* Top Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/70 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
            <Target className="w-4 h-4" />
            <span>Habit & Gamification Hub</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Reading Goals & Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Track reading sessions, streaks, literary milestones, and personal reading insights.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={isLoading}
            className="h-9 text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setGoalModalOpen(true)}
            className="h-9 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Adjust Goals</span>
          </Button>
        </div>
      </div>

      {/* Guest Preview Banner (Shown when not logged in) */}
      {isGuest && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-card p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                  <span>Guest Preview Mode</span>
                  <span className="text-[10px] font-sans font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Sample Data
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                  You are exploring a sample overview of Taleora&apos;s reading statistics engine. Create a free account or sign in to permanently track your actual reading sessions, daily streaks, and literary achievement badges.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href="/login">
                <Button variant="outline" size="sm" className="h-9 text-xs font-semibold gap-1.5">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="h-9 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/70 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
            activeTab === "overview"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Overview & Habits</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("achievements")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
            activeTab === "achievements"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Award className="w-4 h-4" />
          <span>Badges & Achievements</span>
          {statsData && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-current">
              {statsData.achievements.filter((a) => a.isUnlocked).length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
            activeTab === "history"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
              <div key={i} className="h-32 rounded-xl bg-muted/60 border border-border" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="h-56 rounded-xl bg-muted/60 border border-border" />
            <div className="h-56 rounded-xl bg-muted/60 border border-border" />
          </div>
          <div className="h-64 rounded-xl bg-muted/60 border border-border" />
        </div>
      ) : statsData ? (
        <>
          {/* TAB 1: Overview & Habits */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* High-level summary metrics grid */}
              <StatsSummaryGrid summary={statsData.summary} />

              {/* Middle Row: Today's Goal Progress & Streak Tracker */}
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
