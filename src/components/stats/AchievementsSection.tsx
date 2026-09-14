"use client";

import * as React from "react";
import {
  Award,
  Trophy,
  Crown,
  Flame,
  Zap,
  Sparkles,
  Clock,
  Compass,
  Globe,
  Moon,
  Highlighter,
  BookOpen,
  Bookmark,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { AchievementWithProgress, AchievementCategory } from "@/types/stats";
import { cn } from "@/lib/utils";

interface AchievementsSectionProps {
  achievements: AchievementWithProgress[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  Award,
  Trophy,
  Crown,
  Flame,
  Zap,
  Sparkles,
  Clock,
  Compass,
  Globe,
  Moon,
  Highlighter,
  BookOpen,
  Bookmark,
};

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const [activeCategory, setActiveCategory] = React.useState<AchievementCategory | "all">("all");

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;
  const overallPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const filteredAchievements = React.useMemo(() => {
    if (activeCategory === "all") return achievements;
    return achievements.filter((a) => a.category === activeCategory);
  }, [achievements, activeCategory]);

  return (
    <Card className="border-border/80 bg-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Gamification & Badges</span>
            </div>
            <CardTitle className="text-xl font-bold font-serif text-foreground mt-1">
              Reading Achievements
            </CardTitle>
            <CardDescription className="text-xs">
              Unlock prestigious literary medals by building consistent reading habits.
            </CardDescription>
          </div>

          {/* Overall Unlocked Badge Counter */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border border-border/60 self-start sm:self-auto">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                Progress
              </span>
              <span className="font-serif font-bold text-base text-foreground">
                {unlockedCount} / {totalCount}{" "}
                <span className="text-xs font-normal text-muted-foreground font-sans">
                  ({overallPercent}%)
                </span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 pb-1 scrollbar-none">
          {[
            { id: "all", label: "All Badges" },
            { id: "streak", label: "Streaks" },
            { id: "volume", label: "Volume & Time" },
            { id: "completion", label: "Book Finisher" },
            { id: "exploration", label: "Exploration" },
            { id: "special", label: "Special" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as AchievementCategory | "all")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border cursor-pointer",
                activeCategory === tab.id
                  ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground border-border/60 hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAchievements.map((ach) => {
            const IconComponent = ICON_MAP[ach.icon_name] || Award;

            const tierStyle = {
              bronze: {
                badge: "border-amber-700/40 bg-amber-950/20 text-amber-600 dark:text-amber-400",
                iconGlow: "bg-amber-700/20 border-amber-700/30 text-amber-600 dark:text-amber-400",
                label: "Bronze",
              },
              silver: {
                badge: "border-slate-400/40 bg-slate-200/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300",
                iconGlow: "bg-slate-300/30 dark:bg-slate-700/30 border-slate-400/30 text-slate-700 dark:text-slate-200",
                label: "Silver",
              },
              gold: {
                badge: "border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-amber-500/10",
                iconGlow: "bg-amber-500/20 border-amber-500/40 text-amber-500 shadow-sm shadow-amber-500/20",
                label: "Gold",
              },
              diamond: {
                badge: "border-cyan-400/50 bg-gradient-to-r from-cyan-500/15 to-purple-500/15 text-cyan-500 dark:text-cyan-300",
                iconGlow: "bg-cyan-500/20 border-cyan-400/40 text-cyan-400 shadow-sm shadow-cyan-500/20",
                label: "Diamond",
              },
            }[ach.tier] || {
              badge: "border-border bg-muted text-muted-foreground",
              iconGlow: "bg-muted border-border text-muted-foreground",
              label: ach.tier,
            };

            return (
              <div
                key={ach.id}
                className={cn(
                  "relative p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between",
                  ach.isUnlocked
                    ? "bg-card hover:shadow-md border-border hover:border-primary/40"
                    : "bg-muted/30 border-border/60 opacity-80"
                )}
              >
                <div>
                  {/* Top: Icon & Tier Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center border transition-transform",
                        ach.isUnlocked ? tierStyle.iconGlow : "bg-muted/80 border-border text-muted-foreground/60"
                      )}
                    >
                      {ach.isUnlocked ? (
                        <IconComponent className="w-5 h-5" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground/60" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border tracking-wider",
                          tierStyle.badge
                        )}
                      >
                        {tierStyle.label}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-serif font-bold text-sm text-foreground mb-1 flex items-center gap-1.5">
                    <span>{ach.title}</span>
                    {ach.isUnlocked && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {ach.description}
                  </p>
                </div>

                {/* Bottom: Progress Bar or Unlocked Date */}
                <div className="mt-4 pt-3 border-t border-border/50">
                  {ach.isUnlocked ? (
                    <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Unlocked</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {ach.unlockedAt
                          ? new Date(ach.unlockedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "Earned"}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Progress</span>
                        <span className="font-mono font-medium">
                          {ach.progressValue} / {ach.target_value} ({ach.percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary/80 h-full rounded-full transition-all duration-300"
                          style={{ width: `${ach.percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
