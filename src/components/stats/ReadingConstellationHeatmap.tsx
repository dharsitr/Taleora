"use client";

import * as React from "react";
import { Sparkles, Calendar, Flame, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface ReadingConstellationHeatmapProps {
  activityDates?: string[];
  todayMinutes?: number;
}

interface DayNode {
  date: string;
  count: number; // 0: none, 1: light, 2: medium, 3: heavy, 4: peak
  minutes: number;
  dayOfWeek: number;
}

export function ReadingConstellationHeatmap({
  activityDates = [],
  todayMinutes = 0,
}: ReadingConstellationHeatmapProps) {
  const [hoveredNode, setHoveredNode] = React.useState<DayNode | null>(null);
  const [tooltipPos, setTooltipPos] = React.useState<{ x: number; y: number } | null>(null);

  // Generate the last 26 weeks (approx. 6 months for a clean, non-cramped desktop & mobile responsive grid)
  const weeksCount = 26;
  const daysTotal = weeksCount * 7;

  const { grid, totalActiveDays, streakLongestEstimate } = React.useMemo(() => {
    // Map existing activity dates to counts
    const dateCountMap = new Map<string, number>();
    activityDates.forEach((d) => {
      if (!d) return;
      const clean = d.split("T")[0];
      dateCountMap.set(clean, (dateCountMap.get(clean) || 0) + 1);
    });

    // Make sure today is accounted for if todayMinutes > 0
    const todayStr = new Date().toISOString().split("T")[0];
    if (todayMinutes > 0 && !dateCountMap.has(todayStr)) {
      dateCountMap.set(todayStr, 1);
    }

    const today = new Date();
    const days: DayNode[] = [];

    // Calculate start date so that the last day in grid is today
    for (let i = daysTotal - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = dateCountMap.get(dateStr) || 0;

      // Determine level: 0 = 0, 1 = 1, 2 = 2-3, 3 = 4-5, 4 = 6+
      let level = 0;
      let estMinutes = 0;
      if (count > 0) {
        if (count >= 4) {
          level = 4;
          estMinutes = 60;
        } else if (count >= 3) {
          level = 3;
          estMinutes = 45;
        } else if (count >= 2) {
          level = 2;
          estMinutes = 30;
        } else {
          level = 1;
          estMinutes = 15;
        }
      }

      if (dateStr === todayStr && todayMinutes > 0) {
        estMinutes = todayMinutes;
        level = todayMinutes >= 60 ? 4 : todayMinutes >= 40 ? 3 : todayMinutes >= 20 ? 2 : 1;
      }

      days.push({
        date: dateStr,
        count: level,
        minutes: estMinutes,
        dayOfWeek: d.getDay(),
      });
    }

    // Group into weeks (columns of 7)
    const weeks: DayNode[][] = [];
    for (let w = 0; w < weeksCount; w++) {
      weeks.push(days.slice(w * 7, (w + 1) * 7));
    }

    const activeCount = Array.from(dateCountMap.keys()).length;

    return {
      grid: weeks,
      totalActiveDays: Math.max(activeCount, todayMinutes > 0 ? 1 : 0),
      streakLongestEstimate: activeCount,
    };
  }, [activityDates, todayMinutes, daysTotal]);

  const handleMouseEnter = (node: DayNode, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredNode(node);
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  const handleMouseLeave = () => {
    setHoveredNode(null);
    setTooltipPos(null);
  };

  return (
    <Card className="relative overflow-hidden border border-amber-500/25 bg-card/90 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      {/* Subtle Ambient Glow */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Habit Constellation</span>
            </div>
            <CardTitle className="text-xl font-bold font-serif text-foreground mt-1 flex items-center gap-2">
              <span>Literary Habit Constellation</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Every read story or session illuminates a star in your personal reading galaxy.
            </CardDescription>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-stone-900/60 dark:bg-stone-950/60 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
              <span>{totalActiveDays} Active Reading Days</span>
            </div>
            <span className="text-muted-foreground/40">|</span>
            <span className="text-muted-foreground text-[11px]">Last 26 Weeks</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 pb-5">
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="min-w-[620px]">
            {/* Weekday indicators & columns */}
            <div className="flex gap-1.5 items-center">
              {grid.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1.5">
                  {week.map((node) => {
                    const isToday =
                      node.date === new Date().toISOString().split("T")[0];

                    return (
                      <div
                        key={node.date}
                        onMouseEnter={(e) => handleMouseEnter(node, e)}
                        onMouseLeave={handleMouseLeave}
                        className={cn(
                          "w-3 h-3 rounded-[3px] transition-all duration-200 cursor-pointer relative",
                          node.count === 0 &&
                            "bg-stone-800/60 dark:bg-stone-900/90 border border-stone-800 hover:border-amber-500/40",
                          node.count === 1 &&
                            "bg-amber-950/70 border border-amber-700/60 hover:border-amber-400",
                          node.count === 2 &&
                            "bg-amber-700/80 border border-amber-500/70 shadow-[0_0_6px_rgba(217,119,6,0.4)] hover:scale-125",
                          node.count === 3 &&
                            "bg-amber-500 border border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.6)] hover:scale-125",
                          node.count === 4 &&
                            "bg-gradient-to-tr from-amber-400 to-yellow-200 border border-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.9)] hover:scale-125",
                          isToday &&
                            "ring-1 ring-amber-400 ring-offset-1 ring-offset-background"
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend & Summary Footer */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40 gap-2">
              <div className="flex items-center gap-2 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-amber-500/80" />
                <span>Showing 182-day chronological orbit</span>
              </div>

              {/* Heatmap intensity legend */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span>Dormant</span>
                <div className="w-2.5 h-2.5 rounded-[2px] bg-stone-800/80 border border-stone-700" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-amber-950 border border-amber-700/60" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-amber-700 border border-amber-500/70" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-amber-500 border border-amber-300" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-yellow-200 border border-white shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                <span>Radiant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Tooltip */}
        {hoveredNode && tooltipPos && (
          <div
            className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full px-3 py-1.5 rounded-lg bg-stone-950/95 border border-amber-500/40 text-amber-100 text-xs shadow-xl backdrop-blur-md whitespace-nowrap"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
            }}
          >
            <div className="font-semibold flex items-center gap-1.5">
              <span>{new Date(hoveredNode.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              {hoveredNode.count > 0 && <span className="text-amber-400 font-mono">✦</span>}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {hoveredNode.count > 0 ? (
                <span>
                  {hoveredNode.minutes > 0 ? `${hoveredNode.minutes} mins reading` : "Stories logged"}
                </span>
              ) : (
                <span>No reading activity recorded</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
