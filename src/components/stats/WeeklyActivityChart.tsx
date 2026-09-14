"use client";

import * as React from "react";
import { BarChart2, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { DailyActivityStat } from "@/types/stats";
import { cn } from "@/lib/utils";

interface WeeklyActivityChartProps {
  dailyActivity: DailyActivityStat[];
  dailyGoalMinutes: number;
}

export function WeeklyActivityChart({
  dailyActivity,
  dailyGoalMinutes,
}: WeeklyActivityChartProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const totalWeeklyMinutes = dailyActivity.reduce((acc, d) => acc + d.minutes, 0);
  const avgDailyMinutes = Math.round(totalWeeklyMinutes / 7);

  // Maximum value for scaling (at least 30 min or 1.25x max day)
  const maxDayMinutes = Math.max(...dailyActivity.map((d) => d.minutes), dailyGoalMinutes, 30);

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <Card className="relative overflow-hidden border-border/80 bg-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <BarChart2 className="w-4 h-4" />
              <span>Weekly Reading Activity</span>
            </div>
            <CardTitle className="text-xl font-bold font-serif text-foreground mt-1">
              Past 7 Days Breakdown
            </CardTitle>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{avgDailyMinutes} min / day avg</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Total: <strong className="text-foreground">{totalWeeklyMinutes}m</strong>
            </span>
          </div>
        </div>

        <CardDescription className="text-xs">
          Hover over each day to inspect reading duration and pages logged.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6 pb-2 border-b border-border/60">
          {dailyActivity.map((day, idx) => {
            const heightPercent = Math.max(8, Math.min(100, Math.round((day.minutes / maxDayMinutes) * 100)));
            const isToday = day.date === todayStr;
            const isHovered = hoveredIndex === idx;
            const metGoal = day.minutes >= dailyGoalMinutes;

            return (
              <div
                key={day.date}
                className="flex-1 h-full flex flex-col items-center justify-end relative group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Floating Tooltip */}
                <div
                  className={cn(
                    "absolute -top-12 z-20 px-2.5 py-1 rounded-md text-[11px] font-medium shadow-md transition-all duration-200 pointer-events-none whitespace-nowrap border",
                    "bg-popover text-popover-foreground border-border",
                    isHovered
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 translate-y-1 pointer-events-none"
                  )}
                >
                  <span className="font-semibold">{day.minutes} min</span> · {day.pages} pages
                </div>

                {/* The Bar */}
                <div
                  className={cn(
                    "w-full max-w-[42px] rounded-t-lg transition-all duration-300 relative overflow-hidden",
                    isToday
                      ? metGoal
                        ? "bg-gradient-to-t from-emerald-600 to-teal-400"
                        : "bg-gradient-to-t from-primary to-amber-400"
                      : day.minutes > 0
                      ? metGoal
                        ? "bg-emerald-500/70 hover:bg-emerald-500"
                        : "bg-primary/70 hover:bg-primary"
                      : "bg-muted hover:bg-muted-foreground/30",
                    isHovered && "brightness-110 scale-y-[1.02]"
                  )}
                  style={{ height: `${heightPercent}%` }}
                >
                  {/* Subtle shine on top */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-white/25 rounded-t-lg" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Day Labels Row */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 px-2 pt-2">
          {dailyActivity.map((day) => {
            const isToday = day.date === todayStr;
            return (
              <div key={`label-${day.date}`} className="flex-1 text-center">
                <span
                  className={cn(
                    "text-xs block font-medium",
                    isToday ? "text-primary font-bold" : "text-muted-foreground"
                  )}
                >
                  {day.dayName}
                </span>
                <span className="text-[10px] text-muted-foreground/70 block">
                  {day.minutes > 0 ? `${day.minutes}m` : "–"}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
