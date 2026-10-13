"use client";

import * as React from "react";
import { Clock, Award, BookOpen, Flame, Compass } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ReadingSummaryStats } from "@/types/stats";
import { cn } from "@/lib/utils";

interface StatsSummaryGridProps {
  summary: ReadingSummaryStats;
}

export function StatsSummaryGrid({ summary }: StatsSummaryGridProps) {
  // Format total minutes to hours & minutes
  const totalHours = Math.floor(summary.totalMinutesRead / 60);
  const remainingMinutes = summary.totalMinutesRead % 60;
  const formattedTotalTime =
    totalHours > 0
      ? `${totalHours}h ${remainingMinutes}m`
      : `${remainingMinutes}m`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Active Reading Streak */}
      <Card className="relative overflow-hidden border border-amber-500/25 bg-card/85 shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:border-amber-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-amber-400 uppercase tracking-wider">
              Active Orbit
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Flame
                className={cn(
                  "w-4 h-4 text-amber-500 fill-amber-500 transition-transform",
                  summary.currentStreakDays > 0 && "animate-pulse"
                )}
              />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold font-serif text-foreground tracking-tight flex items-baseline gap-2 mt-1">
            <span>{summary.currentStreakDays}</span>
            <span className="text-xs font-sans font-medium text-muted-foreground">
              {summary.currentStreakDays === 1 ? "day streak" : "days streak"}
            </span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Historic zenith:{" "}
            <span className="font-semibold text-amber-300">
              {summary.longestStreakDays} days
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 2. Total Reading Time */}
      <Card className="relative overflow-hidden border border-amber-500/20 bg-card/85 shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:border-amber-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-amber-400 uppercase tracking-wider">
              Time In Sanctum
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold font-serif text-foreground tracking-tight mt-1">
            {formattedTotalTime}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Today:{" "}
            <span className="font-semibold text-foreground">
              {summary.todayMinutesRead}m
            </span>{" "}
            / {summary.dailyGoalMinutes}m goal
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 3. Books Completed */}
      <Card className="relative overflow-hidden border border-amber-500/20 bg-card/85 shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:border-amber-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-emerald-400 uppercase tracking-wider">
              Archived Works
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold font-serif text-foreground tracking-tight flex items-baseline gap-2 mt-1">
            <span>{summary.totalBooksCompleted}</span>
            <span className="text-xs font-sans font-medium text-muted-foreground">
              {summary.totalBooksCompleted === 1 ? "novella finished" : "novellas finished"}
            </span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Annual quest:{" "}
            <span className="font-semibold text-foreground">
              {summary.totalBooksCompleted} / {summary.annualBooksGoal}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 4. Chapters & Pages Read */}
      <Card className="relative overflow-hidden border border-amber-500/20 bg-card/85 shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:border-amber-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-amber-400 uppercase tracking-wider">
              Episodic Scrolls
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold font-serif text-foreground tracking-tight flex items-baseline gap-2 mt-1">
            <span>{summary.totalChaptersRead}</span>
            <span className="text-xs font-sans font-medium text-muted-foreground">
              chapters read
            </span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Total pages:{" "}
            <span className="font-semibold text-foreground">
              {summary.totalPagesRead}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
