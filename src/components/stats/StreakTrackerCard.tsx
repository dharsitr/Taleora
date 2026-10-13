"use client";

import * as React from "react";
import { Flame, Calendar, Check, Zap, ShieldCheck, Sparkles } from "lucide-react";
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
    <Card className="relative overflow-hidden border border-amber-500/25 bg-card/90 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      {/* Flame radiant backdrop */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="pb-2 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span>Habit Multiplier & Streak</span>
          </div>

          <span
            className={cn(
              "text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1",
              hasReadToday
                ? "bg-amber-500/15 border-amber-500/35 text-amber-400"
                : "bg-stone-900/60 text-muted-foreground border-border/60"
            )}
          >
            {hasReadToday ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Streak Protected</span>
              </>
            ) : (
              <span>Reading Required Today</span>
            )}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
          {/* Left: 3D Flame Emblem Counter */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
              <Flame
                className={cn(
                  "w-9 h-9 text-amber-500 fill-amber-500 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]",
                  currentStreak > 0 && "animate-bounce"
                )}
              />
              {currentStreak >= 7 && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-[10px]">
                  ⚡
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-foreground">
                  {currentStreak}
                </span>
                <span className="text-sm font-sans text-muted-foreground">
                  {currentStreak === 1 ? "day streak" : "days streak"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-amber-400 font-mono font-medium">
                  {currentStreak >= 14 ? "x2.0 Scholar Boost" : currentStreak >= 7 ? "x1.5 Reader Boost" : "x1.0 Novice Boost"}
                </span>
                <span className="text-muted-foreground text-xs">• Record: {longestStreak}d</span>
              </div>
            </div>
          </div>

          {/* Right: Milestone Target Progress */}
          <div className="w-full sm:w-48 bg-stone-900/60 dark:bg-stone-950/60 border border-amber-500/20 p-3 rounded-xl flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px]">Next Milestone</span>
              <span className="font-serif font-bold text-amber-300">{nextMilestone} Days</span>
            </div>
            <div className="w-full bg-stone-800/80 h-2 rounded-full overflow-hidden p-0.5 border border-stone-700/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((currentStreak / nextMilestone) * 100))}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {daysToMilestone === 0
                ? "Milestone unlocked today!"
                : `${daysToMilestone} more consecutive ${daysToMilestone === 1 ? "day" : "days"} to level up.`}
            </span>
          </div>
        </div>

        {/* 7-Day Orbit Dots */}
        <div className="mt-5 pt-4 border-t border-border/40">
          <div className="text-[11px] font-semibold text-muted-foreground mb-2.5 flex items-center justify-between">
            <span>Past 7 Days Orbit</span>
            <span className="text-[10px] text-amber-400">
              {dailyActivity.filter((d) => d.minutes > 0).length} of 7 Active
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {dailyActivity.map((day) => {
              const active = day.minutes > 0;
              const isToday =
                day.date === new Date().toISOString().split("T")[0];

              return (
                <div
                  key={day.date}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-center transition-all",
                    active
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                      : "bg-stone-900/40 border-stone-800/80 text-muted-foreground/60",
                    isToday && "ring-1 ring-amber-400"
                  )}
                >
                  <span className="text-[10px] font-mono uppercase mb-0.5">{day.dayName}</span>
                  {active ? (
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-stone-700/60" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
