"use client";

import * as React from "react";
import { BarChart2, TrendingUp, Sparkles } from "lucide-react";
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
    <Card className="relative overflow-hidden border border-amber-500/25 bg-card/90 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <CardHeader className="pb-4 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <span>Weekly Cadence</span>
            </div>
            <CardTitle className="text-xl font-bold font-serif text-foreground mt-1">
              7-Day Reading Trajectory
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Hover over each pillar to inspect daily reading duration and logged pages.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{avgDailyMinutes} min / day avg</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Total: <strong className="text-amber-300 font-serif">{totalWeeklyMinutes}m</strong>
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 pb-4">
        <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6 pb-2 border-b border-border/40">
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
                    "absolute -top-12 z-20 px-2.5 py-1 rounded-md text-[11px] font-medium shadow-xl transition-all duration-200 pointer-events-none whitespace-nowrap border",
                    "bg-stone-950 text-amber-100 border-amber-500/40 backdrop-blur-md",
                    isHovered
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 translate-y-1 pointer-events-none"
                  )}
                >
                  <span className="font-semibold text-amber-400">{day.minutes} min</span> · {day.pages} pages
                </div>

                {/* The Bar */}
                <div
                  className={cn(
                    "w-full max-w-[42px] rounded-t-lg transition-all duration-300 relative overflow-hidden",
                    isToday
                      ? metGoal
                        ? "bg-gradient-to-t from-emerald-600 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                        : "bg-gradient-to-t from-amber-600 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                      : day.minutes > 0
                      ? metGoal
                        ? "bg-emerald-500/60 hover:bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                        : "bg-amber-500/60 hover:bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                      : "bg-stone-800/60 hover:bg-stone-700/60",
                    isHovered && "brightness-125 scale-y-[1.03]"
                  )}
                  style={{ height: `${heightPercent}%` }}
                >
                  {/* Subtle Top Cap Sheen */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-white/40" />
                </div>

                {/* Day of Week Label */}
                <span
                  className={cn(
                    "mt-2.5 text-[11px] font-medium transition-colors",
                    isToday
                      ? "font-bold text-amber-400"
                      : isHovered
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {day.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
