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
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { AchievementWithProgress, AchievementCategory } from "@/types/stats";
import { cn } from "@/lib/utils";

interface AchievementsSectionProps {
  achievements: AchievementWithProgress[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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
    <Card className="relative overflow-hidden border border-amber-500/25 bg-card/90 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      {/* Background warm radiance */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="pb-4 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Literary Medallions & Honors</span>
            </div>
            <CardTitle className="text-2xl font-bold font-serif text-foreground mt-1">
              Wax Seal Badges of Mastery
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Antique archival seals unlocked through dedicated reading, night sessions, and literary exploration.
            </CardDescription>
          </div>

          {/* Overall Unlocked Badge Counter Medallion */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-900/80 dark:bg-stone-950/80 border border-amber-500/30 self-start sm:self-auto shadow-lg shadow-black/40">
            <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.4)]">
              <div className="w-full h-full rounded-full bg-stone-950 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-wider text-amber-400 uppercase">
                Hall of Honor
              </span>
              <span className="font-serif font-bold text-base text-foreground">
                {unlockedCount} / {totalCount}{" "}
                <span className="text-xs font-normal text-muted-foreground font-sans">
                  ({overallPercent}% Claimed)
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 pb-1 scrollbar-none">
          {[
            { id: "all", label: "All Seals" },
            { id: "streak", label: "Habit Streaks" },
            { id: "volume", label: "Chronicles & Time" },
            { id: "completion", label: "Book Finisher" },
            { id: "exploration", label: "World Exploration" },
            { id: "special", label: "Night & Lore" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as AchievementCategory | "all")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap border cursor-pointer",
                activeCategory === tab.id
                  ? "bg-amber-500 text-stone-950 font-bold border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  : "bg-stone-900/60 hover:bg-stone-800 text-muted-foreground border-stone-800 hover:text-amber-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-6 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((ach) => {
            const IconComponent = ICON_MAP[ach.icon_name] || Award;

            const tierStyle = {
              bronze: {
                border: "border-amber-800/40",
                sealBg: "bg-gradient-to-br from-amber-900 via-amber-950 to-stone-900",
                sealRim: "border-amber-700/60 text-amber-400",
                glow: "shadow-amber-900/20",
                label: "Bronze Seal",
              },
              silver: {
                border: "border-slate-500/40",
                sealBg: "bg-gradient-to-br from-slate-700 via-slate-900 to-stone-900",
                sealRim: "border-slate-400/60 text-slate-200",
                glow: "shadow-slate-500/20",
                label: "Silver Seal",
              },
              gold: {
                border: "border-amber-400/50 shadow-[0_0_16px_rgba(245,158,11,0.15)]",
                sealBg: "bg-gradient-to-br from-amber-500 via-amber-700 to-stone-950",
                sealRim: "border-amber-300/80 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.4)]",
                glow: "shadow-amber-500/30",
                label: "Gold Seal",
              },
              diamond: {
                border: "border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]",
                sealBg: "bg-gradient-to-br from-cyan-500 via-indigo-900 to-stone-950",
                sealRim: "border-cyan-300/80 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.5)]",
                glow: "shadow-cyan-500/30",
                label: "Imperial Seal",
              },
            }[ach.tier] || {
              border: "border-stone-800",
              sealBg: "bg-stone-900",
              sealRim: "border-stone-700 text-stone-400",
              glow: "",
              label: ach.tier,
            };

            return (
              <div
                key={ach.id}
                className={cn(
                  "relative p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between group",
                  ach.isUnlocked
                    ? cn(
                        "bg-stone-900/70 hover:bg-stone-900/90 shadow-md backdrop-blur-md",
                        tierStyle.border
                      )
                    : "bg-stone-950/40 border-stone-800/80 opacity-70 hover:opacity-90"
                )}
              >
                {/* Gold foil corner filigree for unlocked achievements */}
                {ach.isUnlocked && (
                  <>
                    <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-amber-400/50 pointer-events-none" />
                    <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-amber-400/50 pointer-events-none" />
                  </>
                )}

                <div>
                  {/* Top Seal & Tier Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {/* Antique Wax Seal Disc */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center p-0.5 border shadow-inner transition-transform group-hover:scale-105",
                        ach.isUnlocked
                          ? tierStyle.sealRim
                          : "border-stone-800 bg-stone-950 text-stone-600"
                      )}
                    >
                      <div
                        className={cn(
                          "w-full h-full rounded-full flex items-center justify-center",
                          ach.isUnlocked ? tierStyle.sealBg : "bg-stone-900"
                        )}
                      >
                        {ach.isUnlocked ? (
                          <IconComponent className="w-5 h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                        ) : (
                          <Lock className="w-4 h-4 text-stone-600" />
                        )}
                      </div>
                    </div>

                    <span
                      className={cn(
                        "text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border tracking-widest",
                        ach.isUnlocked
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : "bg-stone-900 text-stone-500 border-stone-800"
                      )}
                    >
                      {tierStyle.label}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-serif font-bold text-sm text-foreground mb-1 flex items-center gap-1.5">
                    <span>{ach.title}</span>
                    {ach.isUnlocked && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {ach.description}
                  </p>
                </div>

                {/* Bottom: Progress Bar or Unlocked Timestamp */}
                <div className="mt-4 pt-3 border-t border-border/40">
                  {ach.isUnlocked ? (
                    <div className="flex items-center justify-between text-[11px] text-amber-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Sealed & Claimed</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {ach.unlockedAt
                          ? new Date(ach.unlockedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Archived"}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-mono">Unlocking Progress</span>
                        <span className="font-mono font-bold text-amber-400">
                          {ach.progressValue} / {ach.target_value} ({ach.percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden p-0.5 border border-stone-800">
                        <div
                          className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-300"
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
