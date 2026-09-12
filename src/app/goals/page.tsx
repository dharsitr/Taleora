import * as React from "react";
import { Target, Flame, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { MOCK_READING_STATS } from "@/lib/mock-data";

export const metadata = {
  title: "Reading Goals & Streaks · Taleora",
  description: "Track your reading habits, streaks, and milestones.",
};

export default function GoalsPage() {
  const stats = MOCK_READING_STATS;
  const progressPercent = Math.round(
    (stats.minutesReadToday / stats.dailyGoalMinutes) * 100
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b border-border/70 pb-5">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <Target className="w-4 h-4" />
          <span>Habit Tracker</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Reading Goals & Streaks
        </h1>
        <p className="text-sm text-muted-foreground">
          Build a consistent, reflective reading rhythm one page at a time.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Active Streak
              </span>
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <CardTitle className="text-3xl font-bold font-serif text-foreground">
              {stats.currentStreakDays} Days
            </CardTitle>
            <CardDescription>
              Keep your habit glowing. Read at least 15 min today.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Today&apos;s Focus
              </span>
              <Target className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold font-serif text-foreground">
              {stats.minutesReadToday} / {stats.dailyGoalMinutes}m
            </CardTitle>
            <CardDescription>
              {progressPercent}% of your daily chapter goal achieved.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full bg-border h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Finished Stories
              </span>
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
            <CardTitle className="text-3xl font-bold font-serif text-foreground">
              {stats.booksCompleted} Books
            </CardTitle>
            <CardDescription>
              Stories finished and recorded in your permanent log.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
