"use client";

import * as React from "react";
import {
  Target,
  Sparkles,
  Clock,
  Flame,
  BookOpen,
  Sliders,
  CheckCircle2,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ReadingRitualRingsProps {
  todayMinutes: number;
  dailyGoalMinutes: number;
  currentStreakDays: number;
  streakGoalDays?: number;
  completedBooks: number;
  annualBookGoal?: number;
  onOpenGoalModal?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ReadingRitualRings({
  todayMinutes,
  dailyGoalMinutes,
  currentStreakDays,
  streakGoalDays = 7,
  completedBooks,
  annualBookGoal = 12,
  onOpenGoalModal,
  className,
  size = "md",
}: ReadingRitualRingsProps) {
  // Percent calculations
  const minutesPercent = dailyGoalMinutes > 0
    ? Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100))
    : 0;

  // Daily streak is continuous (not capped at 5 days):
  // Ring is full (100%) when user is on an active streak or has read today, else 0%
  const isStreakActiveToday = currentStreakDays > 0 || todayMinutes > 0;
  const streakPercent = isStreakActiveToday ? 100 : 0;

  const booksPercent = annualBookGoal > 0
    ? Math.min(100, Math.round((completedBooks / annualBookGoal) * 100))
    : 0;

  const allCompleted = minutesPercent >= 100 && isStreakActiveToday;

  // Radii for the 3 concentric rings
  // Outer (Minutes), Middle (Streak), Inner (Stories)
  const rOuter = 58;
  const rMiddle = 44;
  const rInner = 30;

  const circOuter = 2 * Math.PI * rOuter;
  const circMiddle = 2 * Math.PI * rMiddle;
  const circInner = 2 * Math.PI * rInner;

  const offsetOuter = circOuter - (minutesPercent / 100) * circOuter;
  const offsetMiddle = circMiddle - (streakPercent / 100) * circMiddle;
  const offsetInner = circInner - (booksPercent / 100) * circInner;

  const dim = size === "lg" ? "w-52 h-52" : size === "sm" ? "w-36 h-36" : "w-44 h-44";

  return (
    <div
      className={cn(
        "relative rounded-3xl border border-amber-500/25 bg-gradient-to-br from-card/95 via-[#131620]/90 to-background/95 backdrop-blur-2xl p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col justify-between gap-5 text-foreground",
        className
      )}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-xs">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-foreground">
              Reading Ritual Rings
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Daily minutes, continuous streak &amp; novella goals
            </p>
          </div>
        </div>

        {onOpenGoalModal && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenGoalModal}
            className="h-7 text-xs text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 gap-1.5 rounded-lg border border-border/50 cursor-pointer"
          >
            <Sliders className="w-3 h-3" />
            <span>Adjust</span>
          </Button>
        )}
      </div>

      {/* Center: Concentric Rings + Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* SVG Concentric Rings */}
        <div className={cn("relative flex items-center justify-center shrink-0", dim)}>
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
            <defs>
              {/* Outer Amber Gradient */}
              <linearGradient id="ringAmber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              {/* Middle Emerald Gradient */}
              <linearGradient id="ringEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              {/* Inner Amethyst Gradient */}
              <linearGradient id="ringAmethyst" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#9333EA" />
              </linearGradient>

              {/* Glowing Filters */}
              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Tracks */}
            <circle
              cx="70"
              cy="70"
              r={rOuter}
              className="stroke-amber-950/40 dark:stroke-amber-950/60"
              strokeWidth="9"
              fill="transparent"
            />
            <circle
              cx="70"
              cy="70"
              r={rMiddle}
              className="stroke-emerald-950/40 dark:stroke-emerald-950/60"
              strokeWidth="9"
              fill="transparent"
            />
            <circle
              cx="70"
              cy="70"
              r={rInner}
              className="stroke-purple-950/40 dark:stroke-purple-950/60"
              strokeWidth="9"
              fill="transparent"
            />

            {/* Active Outer Ring: Minutes */}
            <circle
              cx="70"
              cy="70"
              r={rOuter}
              stroke="url(#ringAmber)"
              strokeWidth="9"
              strokeDasharray={circOuter}
              strokeDashoffset={offsetOuter}
              strokeLinecap="round"
              fill="transparent"
              filter="url(#glowEffect)"
              className="transition-all duration-1000 ease-out"
            />

            {/* Active Middle Ring: Streak */}
            <circle
              cx="70"
              cy="70"
              r={rMiddle}
              stroke="url(#ringEmerald)"
              strokeWidth="9"
              strokeDasharray={circMiddle}
              strokeDashoffset={offsetMiddle}
              strokeLinecap="round"
              fill="transparent"
              filter="url(#glowEffect)"
              className="transition-all duration-1000 ease-out"
            />

            {/* Active Inner Ring: Books */}
            <circle
              cx="70"
              cy="70"
              r={rInner}
              stroke="url(#ringAmethyst)"
              strokeWidth="9"
              strokeDasharray={circInner}
              strokeDashoffset={offsetInner}
              strokeLinecap="round"
              fill="transparent"
              filter="url(#glowEffect)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Trophy / Percent */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {allCompleted ? (
              <div className="flex flex-col items-center animate-bounce">
                <Award className="w-6 h-6 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-300 font-mono">CLOSED</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="font-serif font-bold text-lg text-foreground">
                  {minutesPercent}%
                </span>
                <span className="text-[9px] font-mono text-muted-foreground uppercase">
                  Today
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Legend / Metrics Breakdown */}
        <div className="flex-1 flex flex-col gap-2.5 w-full">
          {/* Ring 1: Reading Minutes */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  Reading Time
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {todayMinutes} of {dailyGoalMinutes} mins
                </span>
              </div>
            </div>
            <span className="text-xs font-bold font-mono text-amber-500">
              {minutesPercent}%
            </span>
          </div>

          {/* Ring 2: Continuous Daily Streak */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Flame className="w-3 h-3 text-emerald-500" />
                  Daily Streak
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {currentStreakDays > 0
                    ? "Active daily until a day is missed"
                    : todayMinutes > 0
                    ? "Started today · Read tomorrow for 1"
                    : "Read a chapter today to begin"}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold font-mono text-emerald-500">
              {currentStreakDays} {currentStreakDays === 1 ? "day" : "days"}
            </span>
          </div>

          {/* Ring 3: Completed Stories */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/25">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-purple-400" />
                  Stories Read
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {completedBooks} of {annualBookGoal} novellas
                </span>
              </div>
            </div>
            <span className="text-xs font-bold font-mono text-purple-400">
              {booksPercent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
