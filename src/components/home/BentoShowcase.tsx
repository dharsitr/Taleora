"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Flame,
  Target,
  ArrowRight,
  Star,
  Clock,
  Sparkles,
  Check,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserReadingStats } from "@/lib/stats/queries";
import { getCurrentWeekDays } from "@/lib/stats/week";
import type { BookWithAuthorAndGenres } from "@/types/books";
import type { UserHomeStats, UserStatsPayload } from "@/types/stats";

interface BentoShowcaseProps {
  books: BookWithAuthorAndGenres[];
  userStats?: UserHomeStats | null;
}

const MOCK_STREAK_DAYS = [
  { day: "Mon", active: true },
  { day: "Tue", active: true },
  { day: "Wed", active: true },
  { day: "Thu", active: true },
  { day: "Fri", active: true },
  { day: "Sat", active: true },
  { day: "Sun", active: false },
];

export function BentoShowcase({ books, userStats }: BentoShowcaseProps) {
  const { user, profile } = useAuth();
  const [clientStats, setClientStats] = React.useState<UserStatsPayload | null>(null);

  React.useEffect(() => {
    if (user && !userStats) {
      getUserReadingStats(user.id)
        .then((data) => setClientStats(data))
        .catch((err) => console.warn("Could not load client reading stats:", err));
    }
  }, [user, userStats]);

  const isLoggedIn = Boolean(userStats?.isLoggedIn || user);

  // Streaks calculation:
  // Before login: Mock preview (14 Days, Mon-Sat active)
  // After login: Real user streak and active calendar week days
  const streakDays = isLoggedIn
    ? (userStats?.streakDays ?? clientStats?.summary.currentStreakDays ?? profile?.streak_days ?? 0)
    : 14;

  const streakDaysLabel = isLoggedIn
    ? `${streakDays} ${streakDays === 1 ? "Day" : "Days"}`
    : "14 Days";

  const streakSubtitle = isLoggedIn
    ? (streakDays > 0
        ? "Daily habit building without stressful gamification."
        : "Read a chapter today to start your reading streak!")
    : "Daily habit building without stressful gamification.";

  const activeDates = userStats?.activeDates ?? (
    clientStats
      ? clientStats.dailyActivity.filter((d) => d.minutes > 0).map((d) => d.date)
      : (profile?.last_read_date ? [profile.last_read_date] : [])
  );

  const displayWeekDays = isLoggedIn
    ? getCurrentWeekDays(activeDates)
    : MOCK_STREAK_DAYS.map((d) => ({ ...d, isToday: false, date: "" }));

  // Daily goal calculation:
  // Before login: Mock preview (100%, 30/30 mins, achieved)
  // After login: Real today minutes vs daily goal minutes
  const dailyGoalMinutes = isLoggedIn
    ? (userStats?.dailyGoalMinutes ??
        (clientStats?.summary.dailyGoalMinutes && clientStats.summary.dailyGoalMinutes > 0
          ? clientStats.summary.dailyGoalMinutes
          : profile?.daily_reading_goal_minutes || 30))
    : 30;

  const todayMinutes = isLoggedIn
    ? (userStats?.todayMinutes ?? clientStats?.summary.todayMinutesRead ?? 0)
    : 30;

  const goalPercent = Math.min(
    100,
    Math.round((todayMinutes / (dailyGoalMinutes || 30)) * 100)
  );
  const isGoalCompleted = todayMinutes >= dailyGoalMinutes && dailyGoalMinutes > 0;
  const remainingMinutes = Math.max(0, dailyGoalMinutes - todayMinutes);
  // Interactive Reader Preview state (demonstrating the reader features live)
  const [paperTheme, setPaperTheme] = React.useState<"cream" | "sepia" | "midnight">("cream");
  const [fontSize, setFontSize] = React.useState<"sm" | "base" | "lg">("base");

  const paperThemeStyles = {
    cream: "bg-[#FBF7EE] text-[#2D2A26] border-[#E8DEC8]",
    sepia: "bg-[#F4ECD8] text-[#3D332A] border-[#DFD1B5]",
    midnight: "bg-[#14161C] text-[#E2E8F0] border-[#2E3440]",
  };

  const trendingNovellas = books.slice(0, 4);

  return (
    <section className="flex flex-col gap-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Taleora Experience</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Crafted For Those Who Truly Read
          </h2>
        </div>
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group"
        >
          <span>Explore all collections</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Modern Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Card 1: Interactive Distraction-Free Reader Preview (Large Card) */}
        <div className="md:col-span-7 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="font-serif text-base sm:text-lg font-semibold text-foreground">
                  Interactive Distraction-Free Reader
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Experience soft parchment tones and serene serif typography.
              </p>
            </div>

            {/* Interactive Theme Switcher Pills */}
            <div className="flex items-center gap-1.5 bg-secondary/60 p-1 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setPaperTheme("cream")}
                className={`w-5 h-5 rounded-full bg-[#FBF7EE] border transition-transform ${
                  paperTheme === "cream" ? "ring-2 ring-primary scale-110" : "opacity-80"
                }`}
                title="Warm Cream Paper"
                aria-label="Warm Cream Paper"
              />
              <button
                type="button"
                onClick={() => setPaperTheme("sepia")}
                className={`w-5 h-5 rounded-full bg-[#F4ECD8] border transition-transform ${
                  paperTheme === "sepia" ? "ring-2 ring-primary scale-110" : "opacity-80"
                }`}
                title="Vintage Sepia"
                aria-label="Vintage Sepia"
              />
              <button
                type="button"
                onClick={() => setPaperTheme("midnight")}
                className={`w-5 h-5 rounded-full bg-[#14161C] border transition-transform ${
                  paperTheme === "midnight" ? "ring-2 ring-primary scale-110" : "opacity-80"
                }`}
                title="Midnight Obsidian"
                aria-label="Midnight Obsidian"
              />
            </div>
          </div>

          {/* Live Paper Reader Preview Window */}
          <div
            className={`rounded-xl p-5 sm:p-6 border shadow-inner transition-colors duration-300 flex flex-col gap-3 ${paperThemeStyles[paperTheme]}`}
          >
            <div className="flex items-center justify-between border-b pb-2 text-[11px] opacity-70">
              <span className="font-serif tracking-widest uppercase text-[10px]">
                Chapter I · The Quiet Room
              </span>
              <span className="font-mono text-[10px]">Page 14 of 128</span>
            </div>

            <p
              className={`font-serif leading-relaxed italic transition-all ${
                fontSize === "sm"
                  ? "text-xs"
                  : fontSize === "base"
                  ? "text-sm sm:text-base"
                  : "text-base sm:text-lg"
              }`}
            >
              &ldquo;The rain tapped a patient rhythm against the stained glass. In the quiet
              hours before dawn, words ceased to be mere ink on paper—they became doorways into
              forgotten cities, where every turned page awoke a world of its own.&rdquo;
            </p>

            <div className="flex items-center justify-between pt-2 border-t text-[11px] opacity-75">
              <span className="text-[10px] uppercase tracking-wider">
                Reading Mode: Pure Immersion
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFontSize("sm")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    fontSize === "sm" ? "bg-black/15 dark:bg-white/15" : ""
                  }`}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize("base")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    fontSize === "base" ? "bg-black/15 dark:bg-white/15" : ""
                  }`}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize("lg")}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    fontSize === "lg" ? "bg-black/15 dark:bg-white/15" : ""
                  }`}
                >
                  A+
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 & 3 Column: Reading Habits & Daily Goal Trackers */}
        <div className="md:col-span-5 flex flex-col gap-5">
          {/* Reading Streaks Card */}
          <Link
            href="/goals"
            className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all group block"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h3 className="font-serif text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  Reading Streaks
                </h3>
              </div>
              <span className="text-xs font-bold text-amber-500 font-mono">
                {streakDaysLabel}
              </span>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              {streakSubtitle}
            </p>

            {/* Streak Week Days */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
              {displayWeekDays.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-colors ${
                    item.active
                      ? "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400 font-semibold"
                      : "bg-secondary/40 border-border/60 text-muted-foreground"
                  } ${item.isToday ? "ring-1 ring-amber-500/50" : ""}`}
                  title={item.isToday ? "Today" : item.day}
                >
                  <Flame
                    className={`w-3.5 h-3.5 mb-1 ${
                      item.active ? "fill-amber-500 text-amber-500" : "text-muted-foreground/40"
                    }`}
                  />
                  <span className="text-[10px] font-medium">{item.day}</span>
                </div>
              ))}
            </div>
          </Link>

          {/* Daily Goal Tracker Card */}
          <Link
            href="/goals"
            className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-all group block"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="font-serif text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  Daily Goal Tracker
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {goalPercent}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Today&apos;s Reading</span>
              <span className="font-medium text-foreground">
                {todayMinutes} / {dailyGoalMinutes} mins
              </span>
            </div>

            {/* Goal Progress Bar */}
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
                style={{ width: `${goalPercent}%` }}
              />
            </div>

            {isGoalCompleted ? (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 mt-3">
                <Check className="w-3.5 h-3.5" />
                <span>Daily chapter milestone achieved</span>
              </div>
            ) : todayMinutes > 0 ? (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 mt-3">
                <Clock className="w-3.5 h-3.5" />
                <span>{remainingMinutes} mins remaining today</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-3">
                <Clock className="w-3.5 h-3.5" />
                <span>0 of {dailyGoalMinutes} mins read today · Pick up where you left off</span>
              </div>
            )}
          </Link>
        </div>

        {/* Card 4: Curated Trending Novellas Shelf (Full Width in Grid) */}
        <div className="md:col-span-12 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm flex flex-col gap-4 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  Curated Trending Novellas
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Completed trending books and novellas from published authors.
              </p>
            </div>
            <Link
              href="/discover"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {trendingNovellas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {trendingNovellas.map((book) => (
                <Link
                  key={book.id}
                  href={`/books/${book.slug}`}
                  className="group relative rounded-xl border border-border/70 bg-secondary/30 overflow-hidden hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col"
                >
                  {/* Book Cover Banner */}
                  <div
                    className={`h-40 w-full relative overflow-hidden bg-gradient-to-br ${
                      book.cover_gradient || "from-stone-800 to-zinc-950"
                    }`}
                  >
                    {book.cover_image_url && (
                      <Image
                        src={book.cover_image_url}
                        alt={book.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 25vw"
                        unoptimized={
                          !book.cover_image_url.includes(".supabase.co") &&
                          !book.cover_image_url.startsWith("/")
                        }
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />

                    {/* Rating Badge */}
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-amber-400 text-[11px] font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{Number(book.average_rating || 5.0).toFixed(1)}</span>
                    </div>

                    <div className="absolute bottom-2.5 left-3 right-3">
                      <h4 className="font-serif text-sm font-bold text-white drop-shadow-sm truncate group-hover:text-amber-200 transition-colors">
                        {book.title}
                      </h4>
                      <p className="text-[11px] text-white/80 truncate">
                        by {book.author?.name || "Taleora Author"}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="p-3 flex items-center justify-between text-[11px] text-muted-foreground mt-auto bg-card/60">
                    <span className="truncate max-w-[120px]">
                      {book.genres[0]?.name ? `#${book.genres[0].name}` : "Novella"}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{book.estimated_read_time_minutes || 45}m</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 rounded-xl border border-dashed border-border flex flex-col items-center gap-2">
              <BookOpen className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                No published novellas yet. Published stories will automatically appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
