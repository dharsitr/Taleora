"use client";

import * as React from "react";
import { Sun, Sunset, Moon, Sunrise, Clock, Calendar, CheckCircle, Lightbulb } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ReadingInsight } from "@/types/stats";
import { cn } from "@/lib/utils";

interface ReadingInsightsCardProps {
  insights: ReadingInsight;
}

export function ReadingInsightsCard({ insights }: ReadingInsightsCardProps) {
  const timeSlots = [
    {
      name: "Morning",
      hours: "6am – 12pm",
      icon: Sunrise,
      percent: insights.morningPercentage,
      color: "bg-amber-400 text-amber-500",
    },
    {
      name: "Afternoon",
      hours: "12pm – 5pm",
      icon: Sun,
      percent: insights.afternoonPercentage,
      color: "bg-orange-400 text-orange-500",
    },
    {
      name: "Evening",
      hours: "5pm – 10pm",
      icon: Sunset,
      percent: insights.eveningPercentage,
      color: "bg-indigo-400 text-indigo-500",
    },
    {
      name: "Night",
      hours: "10pm – 6am",
      icon: Moon,
      percent: insights.nightPercentage,
      color: "bg-purple-400 text-purple-500",
    },
  ];

  return (
    <Card className="relative overflow-hidden border-border/80 bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Lightbulb className="w-4 h-4" />
          <span>Reading Habits & Insights</span>
        </div>
        <CardTitle className="text-xl font-bold font-serif text-foreground mt-1">
          When & How You Read
        </CardTitle>
        <CardDescription className="text-xs">
          Personal rhythm patterns calculated from your active reading sessions.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-0">
        {/* Time of Day Distribution */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Time of Day Breakdown</span>
            <span className="text-primary font-semibold flex items-center gap-1">
              Peak: {insights.bestTimeOfDay}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {timeSlots.map((slot) => {
              const Icon = slot.icon;
              const isPeak = slot.name === insights.bestTimeOfDay;
              return (
                <div
                  key={slot.name}
                  className={cn(
                    "p-2.5 rounded-lg border flex flex-col gap-1 transition-colors",
                    isPeak
                      ? "bg-primary/5 border-primary/30"
                      : "bg-muted/40 border-border/60"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={cn("w-3.5 h-3.5", slot.color.split(" ")[1])} />
                    <span className="text-xs font-bold text-foreground">
                      {slot.percent}%
                    </span>
                  </div>
                  <span className="text-xs font-medium text-foreground">{slot.name}</span>
                  <span className="text-[10px] text-muted-foreground/70">{slot.hours}</span>
                  <div className="w-full bg-muted h-1 rounded-full overflow-hidden mt-1">
                    <div
                      className={cn("h-full rounded-full", slot.color.split(" ")[0])}
                      style={{ width: `${slot.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stat Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 pt-1 border-t border-border/60">
          <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <Clock className="w-3 h-3" />
              <span>Avg Session</span>
            </div>
            <span className="font-serif text-lg font-bold text-foreground">
              {insights.avgSessionMinutes} min
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <Calendar className="w-3 h-3" />
              <span>Top Day</span>
            </div>
            <span className="font-serif text-lg font-bold text-foreground truncate block">
              {insights.mostActiveDayOfWeek}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <CheckCircle className="w-3 h-3" />
              <span>Finish Rate</span>
            </div>
            <span className="font-serif text-lg font-bold text-foreground">
              {insights.completionRate}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
