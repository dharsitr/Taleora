"use client";

import * as React from "react";
import {
  Award,
  Flame,
  Shield,
  Sparkles,
  Share2,
  CheckCircle2,
  Lock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface ParchmentBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "streak" | "scholarly" | "night" | "patron";
  isUnlocked: boolean;
  unlockedDate?: string;
  progressPercent: number;
}

interface ReadingBadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakDays?: number;
  userName?: string;
  totalChaptersRead?: number;
  totalPagesRead?: number;
}

export function ReadingBadgesModal({
  isOpen,
  onClose,
  streakDays = 0,
  userName = "Fellow Reader",
  totalChaptersRead = 0,
  totalPagesRead = 0,
}: ReadingBadgesModalProps) {
  const [selectedBadgeForShare, setSelectedBadgeForShare] = React.useState<ParchmentBadge | null>(null);

  // Compute real dynamic badges based strictly on actual user progress
  const badges: ParchmentBadge[] = React.useMemo(() => {
    return [
      {
        id: "streak-1",
        title: "The Second Flame",
        description: "Read on 2 consecutive days to kindle your first reading streak.",
        icon: "🕯️",
        category: "streak",
        isUnlocked: streakDays >= 1,
        unlockedDate: streakDays >= 1 ? "Active Streak" : undefined,
        progressPercent: Math.min(100, Math.round((streakDays / 1) * 100)),
      },
      {
        id: "streak-7",
        title: "The Seven-Day Candle",
        description: "Read consistently for 7 consecutive streak days without extinguishing the flame.",
        icon: "🔥",
        category: "streak",
        isUnlocked: streakDays >= 7,
        unlockedDate: streakDays >= 7 ? "Active Streak" : undefined,
        progressPercent: Math.min(100, Math.round((streakDays / 7) * 100)),
      },
      {
        id: "parchment-turner",
        title: "Master of Leaves",
        description: "Read through 50 illustrated parchment pages in Taleora.",
        icon: "📜",
        category: "scholarly",
        isUnlocked: totalPagesRead >= 50,
        unlockedDate: totalPagesRead >= 50 ? "Unlocked" : undefined,
        progressPercent: Math.min(100, Math.round((totalPagesRead / 50) * 100)),
      },
      {
        id: "first-chapter",
        title: "The Novice Scribe",
        description: "Complete reading your very first story chapter.",
        icon: "🖋️",
        category: "scholarly",
        isUnlocked: totalChaptersRead >= 1,
        unlockedDate: totalChaptersRead >= 1 ? "Unlocked" : undefined,
        progressPercent: Math.min(100, Math.round((totalChaptersRead / 1) * 100)),
      },
      {
        id: "streak-30",
        title: "Librarian's Eternal Ring",
        description: "Maintain an unbroken 30-day active reading streak.",
        icon: "👑",
        category: "streak",
        isUnlocked: streakDays >= 30,
        unlockedDate: streakDays >= 30 ? "Active Streak" : undefined,
        progressPercent: Math.min(100, Math.round((streakDays / 30) * 100)),
      },
    ];
  }, [streakDays, totalPagesRead, totalChaptersRead]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-card/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                Ritual Badges &amp; Streaks
              </h2>
              <p className="text-xs text-muted-foreground">
                Real accolades earned through your reading habits
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Streak Ribbon Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-primary/10 to-transparent border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 text-2xl shadow-sm">
              <Flame className={cn("w-6 h-6", streakDays > 0 ? "text-amber-500 animate-pulse" : "text-muted-foreground opacity-50")} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold text-foreground">
                  {streakDays} Day Streak
                </span>
                {streakDays > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold">
                    <Shield className="w-3 h-3" /> Streak Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground text-[10px] font-medium">
                    Read today &amp; tomorrow to reach Streak 1
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {streakDays === 0
                  ? "Read a chapter today to start your journey, then read tomorrow to earn your first streak!"
                  : "Keep reading daily to preserve your streak flame."}
              </p>
            </div>
          </div>
        </div>

        {/* Badge Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {badges.map((b) => (
            <div
              key={b.id}
              className={cn(
                "p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 relative",
                b.isUnlocked
                  ? "bg-secondary/40 border-border hover:border-amber-500/40 shadow-xs"
                  : "bg-muted/10 border-border/40 opacity-60"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center text-2xl shrink-0 shadow-xs">
                  {b.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-serif font-bold text-sm text-foreground truncate">
                      {b.title}
                    </h4>
                    {b.isUnlocked ? (
                      <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Earned
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {b.description}
                  </p>
                </div>
              </div>

              {/* Progress bar / Share trigger */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px]">
                {b.isUnlocked ? (
                  <>
                    <span className="text-muted-foreground italic">
                      {b.unlockedDate}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedBadgeForShare(b)}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-semibold cursor-pointer"
                    >
                      <Share2 className="w-3 h-3" /> Share Card
                    </button>
                  </>
                ) : (
                  <div className="w-full flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${b.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground font-mono font-medium">
                      {b.progressPercent}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Shareable Card Preview Modal */}
        {selectedBadgeForShare && (
          <div className="absolute inset-0 z-20 bg-black/90 flex flex-col items-center justify-center p-6 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border-2 border-amber-500/40 p-6 shadow-2xl flex flex-col items-center text-center gap-4 text-zinc-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                Taleora · Scholarly Achievement
              </span>

              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-4xl shadow-md">
                {selectedBadgeForShare.icon}
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-amber-200">
                  {selectedBadgeForShare.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                  {selectedBadgeForShare.description}
                </p>
              </div>

              <div className="w-full pt-4 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Awarded to <strong>{userName}</strong></span>
                <span className="font-serif italic text-amber-400">Taleora</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBadgeForShare(null)}
                className="cursor-pointer"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `I just unlocked "${selectedBadgeForShare.title}" on Taleora! 🕯️✨`
                  );
                  alert("Copied shareable achievement snippet to clipboard!");
                  setSelectedBadgeForShare(null);
                }}
                className="gap-2 cursor-pointer shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span>Copy Share Text</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
