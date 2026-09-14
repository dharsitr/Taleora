"use client";

import * as React from "react";
import { Flame, Calendar, Check, Zap, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { DailyActivityStat } from "@/types/stats";
import { cn } from "@/lib/utils";

interface StreakTrackerCardProps {
  currentStreak: number;
  longestStreak: number;
  todayMinutes: number;
  dailyActivity: DailyActivityStat[];
}

export function StreakTrackerCard({
  currentStreak,
  longestStreak,
  todayMinutes,
  dailyActivity,
}: StreakTrackerCardProps) {
  const hasReadToday = todayMinutes > 0;

  // Next milestone calculation
  let nextMilestone = 3;
  if (currentStreak >= 30) nextMilestone = 50;
  else if (currentStreak >= 14) nextMilestone = 30;
  else if (currentStreak >= 7) nextMilestone = 14;
  else if (currentStreak >= 3) nextMilestone = 7;

  const daysToMilestone = Math.max(0, nextMilestone - currentStreak);

  return (
    <Card className="relative overflow-hidden border-border/80 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>Reading Streak Tracker</span>
          </div>

          <span
            className={cn(
              "text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1",
              hasReadToday
                ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400"
                : "bg-muted text-muted-foreground border-border"
            )}
          >
            {hasReadToday ? (
              <>
                <Check className="w-3 h-3" />
                <span>Streak Protected</span>
              </>
            ) : (
              <span>Pending Today</span>
            )}
          </span>
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <CardTitle className="text-3xl font-bold font-serif text-foreground tracking-tight flex items-baseline gap-2">
            <span>{currentStreak}</span>
            <span className="text-sm font-sans font-medium text-muted-foreground">
              {currentStreak === 1 ? "day active" : "days active"}
            </span>
          </CardTitle>

          <div className="text-right text-xs text-muted-foreground">
            <span className="block font-semibold text-foreground">
              {longestStreak} Days
            </span>
            <span className="text-[10px]">All-Time Record</span>
          </div>
        </div>

        <CardDescription className="text-xs">
          {hasReadToday ? (
            <span>You have logged reading time today. The flame burns bright!</span>
          ) : (
            <span>Read any story today to maintain your consecutive habit streak.</span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        {/* 7-Day Dot Progress */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
          <div className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center justify-between">
            <span>Past 7 Days Consistency</span>
            <span className="flex items-center gap-1 text-[10px]">
              <Calendar className="w-3 h-3" />
              <span>{dailyActivity.filter((d) => d.minutes > 0).length} / 7 Active</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-1.5">
            {dailyActivity.map((day) => {
              const active = day.minutes > 0;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors border",
                      active
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-500"
                        : "bg-muted/80 border-border text-muted-foreground/50"
                    )}
                    title={`${day.dayName}: ${day.minutes} min`}
                  >
                    {active ? (
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {day.dayName[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Indicator */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Next Goal: <strong>{nextMilestone}-Day Badge</strong></span>
          </span>
          <span className="text-[11px] font-medium text-primary flex items-center gap-1">
            <Award className="w-3 h-3" />
            <span>{daysToMilestone > 0 ? `${daysToMilestone} days left` : "Achieved!"}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
