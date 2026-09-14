"use client";

import * as React from "react";
import { Target, X, Check, Clock, Calendar, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ReadingGoalRow } from "@/types/stats";
import { updateUserReadingGoal } from "@/lib/stats/queries";
import { cn } from "@/lib/utils";

interface GoalSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: ReadingGoalRow;
  userId?: string | null;
  onGoalUpdated: (newGoals: ReadingGoalRow) => void;
}

const PRESET_MINUTES = [10, 15, 20, 30, 45, 60];
const PRESET_DAYS = [3, 4, 5, 6, 7];
const PRESET_BOOKS = [6, 12, 24, 36, 50];

export function GoalSettingModal({
  isOpen,
  onClose,
  goals,
  userId,
  onGoalUpdated,
}: GoalSettingModalProps) {
  const [dailyMinutes, setDailyMinutes] = React.useState(goals.daily_minutes_goal || 15);
  const [weeklyDays, setWeeklyDays] = React.useState(goals.weekly_days_goal || 5);
  const [annualBooks, setAnnualBooks] = React.useState(goals.annual_books_goal || 12);
  const [isSaving, setIsSaving] = React.useState(false);
  const [successNotice, setSuccessNotice] = React.useState(false);

  React.useEffect(() => {
    setDailyMinutes(goals.daily_minutes_goal || 15);
    setWeeklyDays(goals.weekly_days_goal || 5);
    setAnnualBooks(goals.annual_books_goal || 12);
  }, [goals]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updated: ReadingGoalRow = {
      ...goals,
      daily_minutes_goal: Math.max(1, dailyMinutes),
      weekly_days_goal: Math.max(1, Math.min(7, weeklyDays)),
      annual_books_goal: Math.max(1, annualBooks),
      updated_at: new Date().toISOString(),
    };

    try {
      if (userId && userId !== "demo") {
        await updateUserReadingGoal(userId, {
          dailyMinutes: updated.daily_minutes_goal,
          weeklyDays: updated.weekly_days_goal,
          annualBooks: updated.annual_books_goal,
        });
      }

      onGoalUpdated(updated);
      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error("Error saving goals:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Set Reading Goals
              </h3>
              <p className="text-xs text-muted-foreground">
                Shape your ideal daily and annual reading habit.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-5 pt-4">
          {/* 1. Daily Reading Minutes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <label htmlFor="daily-minutes-input" className="flex items-center gap-1.5 text-foreground">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Daily Reading Target</span>
              </label>
              <span className="text-primary font-mono">{dailyMinutes} minutes</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDailyMinutes(m)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full border transition-all cursor-pointer",
                    dailyMinutes === m
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                      : "bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {m}m
                </button>
              ))}
            </div>

            <div className="pt-1">
              <Input
                id="daily-minutes-input"
                type="number"
                min={1}
                max={300}
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(parseInt(e.target.value, 10) || 1)}
                className="h-9 text-xs"
                placeholder="Custom minutes per day"
              />
            </div>
          </div>

          {/* 2. Weekly Active Days */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <label htmlFor="weekly-days-input" className="flex items-center gap-1.5 text-foreground">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Days per Week</span>
              </label>
              <span className="text-amber-500 font-mono">{weeklyDays} days</span>
            </div>

            <div className="flex items-center gap-1.5">
              {PRESET_DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setWeeklyDays(d)}
                  className={cn(
                    "flex-1 py-1 text-xs rounded-full border transition-all text-center cursor-pointer",
                    weeklyDays === d
                      ? "bg-amber-500 text-white border-amber-500 font-semibold shadow-xs"
                      : "bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* 3. Annual Books Goal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <label htmlFor="annual-books-input" className="flex items-center gap-1.5 text-foreground">
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                <span>Annual Books Target</span>
              </label>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                {annualBooks} books
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_BOOKS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setAnnualBooks(b)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full border transition-all cursor-pointer",
                    annualBooks === b
                      ? "bg-emerald-500 text-white border-emerald-500 font-semibold shadow-xs"
                      : "bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>

            <div className="pt-1">
              <Input
                id="annual-books-input"
                type="number"
                min={1}
                max={500}
                value={annualBooks}
                onChange={(e) => setAnnualBooks(parseInt(e.target.value, 10) || 1)}
                className="h-9 text-xs"
                placeholder="Custom books per year"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border/70 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : successNotice ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Goals</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
