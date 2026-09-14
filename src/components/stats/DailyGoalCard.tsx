"use client";

import * as React from "react";
import { Target, CheckCircle2, Sliders, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface DailyGoalCardProps {
  todayMinutes: number;
  dailyGoalMinutes: number;
  onOpenGoalModal: () => void;
}

export function DailyGoalCard({
  todayMinutes,
  dailyGoalMinutes,
  onOpenGoalModal,
}: DailyGoalCardProps) {
  const safeGoal = Math.max(1, dailyGoalMinutes);
  const percent = Math.min(100, Math.round((todayMinutes / safeGoal) * 100));
  const isCompleted = todayMinutes >= safeGoal;
  const remaining = Math.max(0, safeGoal - todayMinutes);

  return (
    <Card className="relative overflow-hidden border-border/80 bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Target className="w-4 h-4" />
            <span>Daily Reading Goal</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenGoalModal}
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Adjust</span>
          </Button>
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <CardTitle className="text-3xl font-bold font-serif text-foreground">
            {todayMinutes}{" "}
            <span className="text-lg font-normal text-muted-foreground font-sans">
              / {safeGoal} min
            </span>
          </CardTitle>
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-full border",
              isCompleted
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                : "bg-muted text-muted-foreground border-border"
            )}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                <span>Goal Met!</span>
              </>
            ) : (
              <span>{percent}%</span>
            )}
          </span>
        </div>

        <CardDescription className="text-xs">
          {isCompleted ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              Outstanding! You hit today&apos;s literary target.
            </span>
          ) : (
            <span>Read for {remaining} more minutes to complete today&apos;s goal.</span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="w-full bg-muted/80 h-3 rounded-full overflow-hidden p-0.5 border border-border/50">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isCompleted
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : "bg-gradient-to-r from-primary to-amber-500"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
