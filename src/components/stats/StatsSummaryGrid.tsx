"use client";

import * as React from "react";
import { Clock, Award, BookOpen, Flame } from "lucide-react";
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
      <Card className="relative overflow-hidden border-border/80 bg-gradient-to-br from-amber-500/5 via-card to-card hover:border-amber-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Streak
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
              <Flame
                className={cn(
                  "w-4 h-4 text-amber-500 fill-amber-500 transition-transform",
                  summary.currentStreakDays > 0 && "animate-pulse"
                )}
              />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold font-serif text-foreground tracking-tight flex items-baseline gap-2">
            <span>{summary.currentStreakDays}</span>
            <span className="text-sm font-sans font-medium text-muted-foreground">
              {summary.currentStreakDays === 1 ? "day" : "days"}
            </span>
          </CardTitle>
          <CardDescription className="text-xs">
            Best streak:{" "}
            <span className="font-semibold text-foreground">
              {summary.longestStreakDays} days
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 2. Total Reading Time */}
      <Card className="relative overflow-hidden border-border/80 bg-gradient-to-br from-primary/5 via-card to-card hover:border-primary/30 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Reading Time
            </span>
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold font-serif text-foreground tracking-tight">
            {formattedTotalTime}
          </CardTitle>
          <CardDescription className="text-xs">
            Today:{" "}
            <span className="font-semibold text-foreground">
              {summary.todayMinutesRead}m
            </span>{" "}
            / {summary.dailyGoalMinutes}m target
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 3. Books Completed */}
      <Card className="relative overflow-hidden border-border/80 bg-gradient-to-br from-emerald-500/5 via-card to-card hover:border-emerald-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Books Completed
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold font-serif text-foreground tracking-tight flex items-baseline gap-2">
            <span>{summary.totalBooksCompleted}</span>
            <span className="text-sm font-sans font-medium text-muted-foreground">
              {summary.totalBooksCompleted === 1 ? "story" : "stories"}
            </span>
          </CardTitle>
          <CardDescription className="text-xs">
            Yearly goal:{" "}
            <span className="font-semibold text-foreground">
              {summary.annualBooksGoal} books
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 4. Pages & Chapters Read */}
      <Card className="relative overflow-hidden border-border/80 bg-gradient-to-br from-sky-500/5 via-card to-card hover:border-sky-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pages Read
            </span>
            <div className="w-8 h-8 rounded-full bg-sky-500/15 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-sky-500" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold font-serif text-foreground tracking-tight flex items-baseline gap-2">
            <span>{summary.totalPagesRead.toLocaleString()}</span>
            <span className="text-sm font-sans font-medium text-muted-foreground">
              pages
            </span>
          </CardTitle>
          <CardDescription className="text-xs">
            Across{" "}
            <span className="font-semibold text-foreground">
              {summary.totalChaptersRead} chapters
            </span>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
