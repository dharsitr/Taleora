"use client";

import * as React from "react";
import { Target, CheckCircle2, Sliders, Sparkles, Clock, Flame } from "lucide-react";
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
  const hasGoal = dailyGoalMinutes > 0;
  const percent = hasGoal ? Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100)) : 0;
  const isCompleted = hasGoal && todayMinutes >= dailyGoalMinutes;
  const remaining = hasGoal ? Math.max(0, dailyGoalMinutes - todayMinutes) : 0;

  // SVG Circular Ring Calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <Card className="relative overflow-hidden border border-amber-500/25 bg-card/90 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      {/* Warm Ambient Glow in the Corner */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="pb-2 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
            <Target className="w-4 h-4 text-amber-500" />
            <span>Daily Reading Sanctuary</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenGoalModal}
            className="h-7 text-xs text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 gap-1.5 rounded-lg border border-border/50"
          >
            <Sliders className="w-3 h-3" />
            <span>{hasGoal ? "Adjust" : "Set Goal"}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
          {/* Radial Progress Ring Display */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
              <defs>
                <linearGradient id="goalProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
                <linearGradient id="goalCompletedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <filter id="goalGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Track */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                className="stroke-stone-800/80 dark:stroke-stone-900"
                strokeWidth="10"
                fill="none"
              />

              {/* Dynamic Progress Stroke */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke={isCompleted ? "url(#goalCompletedGradient)" : "url(#goalProgressGradient)"}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                filter={percent > 0 ? "url(#goalGlow)" : undefined}
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Inner Ring Data Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-serif text-2xl font-bold text-foreground tracking-tight">
                {percent}%
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                {isCompleted ? "Achieved" : "Progress"}
              </span>
            </div>
          </div>

          {/* Right Column: Goal Details & Achievement status */}
          <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
            <div className="flex items-baseline justify-center sm:justify-start gap-2">
              <span className="text-3xl font-serif font-bold text-foreground">
                {todayMinutes}
              </span>
              <span className="text-sm font-sans text-muted-foreground">
                / {dailyGoalMinutes} mins target
              </span>
            </div>

            <div className="mt-2.5">
              {isCompleted ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Literary Target Reached Today!</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {hasGoal
                      ? `${remaining} more mins to hit daily goal`
                      : "Define a reading goal to begin tracking"}
                  </span>
                </div>
              )}
            </div>

            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              {isCompleted
                ? "Your dedication to the written word honors the archives. Any extra reading logs bonus mastery."
                : "Continuous daily reading exercises cognitive memory and literary imagination."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
