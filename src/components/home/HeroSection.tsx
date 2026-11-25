"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight, BookOpen, Flame, Feather } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import type { BookWithAuthorAndGenres } from "@/types/books";
import type { UserHomeStats } from "@/types/stats";

interface HeroSectionProps {
  featuredBook?: BookWithAuthorAndGenres | null;
  userStats?: UserHomeStats | null;
}

export function HeroSection({ featuredBook, userStats }: HeroSectionProps) {
  const { user, profile } = useAuth();
  const bookTitle = featuredBook?.title || "Taleora Library";
  const authorName = featuredBook?.author?.name || "Taleora Edition";
  const bookSlug = featuredBook?.slug;

  const isLoggedIn = Boolean(userStats?.isLoggedIn || user);
  const streakDays = userStats?.streakDays ?? profile?.streak_days ?? 0;
  const todayMinutes = userStats?.todayMinutes ?? 0;
  const dailyGoalMinutes = userStats?.dailyGoalMinutes ?? profile?.daily_reading_goal_minutes ?? 30;
  const currentRead = userStats?.currentRead;

  // Interactive 3D gyroscopic cursor tracking tilt
  const [tilt, setTilt] = React.useState({ x: -14, y: 6 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: -14 + x * 14,
      y: 6 - y * 10,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: -14, y: 6 });
  };

  const displayPercentage = isLoggedIn && currentRead ? (currentRead.progressPercentage ?? 0) : 0;
  const ringPercent = Math.min(
    100,
    Math.round((todayMinutes / Math.max(1, dailyGoalMinutes)) * 100)
  );
  const ringRadius = 18;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (ringPercent / 100) * ringCircumference;

  const displayTitle =
    isLoggedIn && currentRead
      ? currentRead.chapterTitle
        ? `Ch. ${currentRead.chapterNumber || 1} · ${currentRead.chapterTitle}`
        : currentRead.bookTitle
      : featuredBook
      ? featuredBook.title
      : "Open a story to begin";

  const primaryHref =
    isLoggedIn && currentRead?.bookSlug
      ? `/read/${currentRead.bookSlug}`
      : bookSlug
      ? `/books/${bookSlug}`
      : "/library";

  const primaryLabel =
    isLoggedIn && currentRead ? "Continue Reading" : "Start Reading";

  return (
    <section
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/20 dark:border-white/10 bg-[#0A0B0F] text-zinc-100 p-6 sm:p-10 lg:p-14 shadow-2xl transition-all"
    >
      {/* Nocturnal Candlelight Ambient Backdrops */}
      <div className="absolute -top-24 right-0 w-[520px] h-[520px] bg-[#E28743]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-20 w-[420px] h-[420px] bg-amber-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
        {/* Left Column: Editorial Headline & Actions */}
        <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-semibold uppercase tracking-[0.18em] w-fit backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Serials &amp; Curated Books</span>
          </div>

          <h1 className="font-serif text-3xl xs:text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-zinc-50 leading-[1.12]">
            Stories crafted for{" "}
            <span className="bg-gradient-to-r from-amber-200 via-[#E28743] to-amber-200 bg-clip-text text-transparent">
              unhurried nights.
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-zinc-400 leading-relaxed max-w-xl">
            Step into a distraction-free nocturnal library. Warm parchment pages,
            immersive ambient soundscapes, and mindful reading rituals built for
            dedicated readers and authors.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2 w-full sm:w-auto">
            <Link href={primaryHref} className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-7 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#D97736] via-[#E28743] to-[#C86628] hover:brightness-110 text-zinc-950 shadow-xl shadow-amber-900/30 border border-amber-300/40 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>{primaryLabel}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Link href="/studio" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-6 rounded-xl text-sm font-medium border-white/15 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] hover:border-amber-400/40 hover:text-white backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
              >
                <Feather className="w-4 h-4 text-amber-400" />
                <span>Open Author Studio</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column: Floating 3D Amber-Lit Hardcover & Glassmorphic Ritual/Progress Dock */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[360px] sm:min-h-[430px] pt-2 lg:pt-0">
          {/* Warm Amber Rim Backlight */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 sm:w-80 sm:h-80 bg-gradient-to-tr from-[#E28743]/30 via-amber-500/15 to-transparent rounded-full blur-[85px]" />
          </div>

          {/* 3D Tilted Hardcover Book Showcase */}
          <Link
            href={bookSlug ? `/books/${bookSlug}` : "/library"}
            className="relative transition-transform duration-500 ease-out cursor-pointer group"
            style={{ perspective: "1400px" }}
          >
            <div
              className="relative w-48 xs:w-52 sm:w-64 h-72 xs:h-80 sm:h-92 rounded-r-2xl rounded-l-xs shadow-[0_25px_60px_rgba(0,0,0,0.85)] transition-transform duration-300 ease-out"
              style={{
                transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg) rotateZ(1deg)`,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Crimson Satin Bookmark Ribbon */}
              <div className="absolute -top-3 right-7 w-4 h-12 crimson-satin-ribbon z-40 shadow-xl pointer-events-none rounded-t-xs">
                <div className="absolute bottom-0 left-0 right-0 h-2.5 [clip-path:polygon(0_100%,50%_0,100%_100%)] bg-[#0A0B0F]" />
              </div>

              {/* Spine Crease */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/85 via-black/40 to-transparent rounded-l-xs z-30 pointer-events-none" />
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-amber-300/30 z-30 pointer-events-none" />

              {/* Book Cover Surface */}
              <div
                className={`w-full h-full rounded-r-2xl rounded-l-xs p-6 flex flex-col justify-between relative overflow-hidden border border-amber-400/40 shadow-inner ${
                  featuredBook?.cover_gradient
                    ? `bg-gradient-to-br ${featuredBook.cover_gradient}`
                    : "bg-gradient-to-br from-stone-900 via-neutral-900 to-zinc-950"
                }`}
              >
                {featuredBook?.cover_image_url ? (
                  <>
                    <Image
                      src={featuredBook.cover_image_url}
                      alt={bookTitle}
                      fill
                      sizes="320px"
                      priority
                      unoptimized={
                        !featuredBook.cover_image_url.includes(".supabase.co") &&
                        !featuredBook.cover_image_url.startsWith("/")
                      }
                      className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25 pointer-events-none z-10" />
                    <div className="absolute inset-3 border border-amber-400/35 rounded-xl pointer-events-none z-10" />
                  </>
                ) : (
                  <>
                    <div className="absolute inset-3 border border-amber-400/40 rounded-xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center pt-3 text-center">
                      <div className="w-8 h-8 rounded-full border border-amber-400/40 flex items-center justify-center text-amber-400/90 mb-1.5">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] tracking-[0.22em] uppercase text-amber-300/80 font-serif">
                        Taleora Edition
                      </span>
                    </div>

                    <div className="relative z-10 text-center my-auto px-2">
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-amber-100 leading-tight line-clamp-3">
                        {bookTitle}
                      </h3>
                      <div className="w-12 h-[1px] bg-amber-400/50 mx-auto my-2.5" />
                      <p className="text-xs text-amber-200/80 font-serif italic">
                        {authorName}
                      </p>
                    </div>

                    <div className="relative z-10 text-center pb-1">
                      <span className="text-[9px] text-amber-400/60 uppercase tracking-widest font-mono">
                        Featured Selection
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Book Pages Edge */}
              <div
                className="absolute top-1 -right-3.5 w-4 h-[calc(100%-8px)] rounded-r-xs bg-gradient-to-r from-stone-800 via-stone-700 to-stone-900 border-y border-r border-amber-500/20 shadow-inner"
                style={{
                  transform: "rotateY(78deg)",
                  transformOrigin: "left center",
                }}
              />
            </div>
          </Link>

          {/* Compact Glassmorphic Continue Reading + Reading Ritual Ring Dock */}
          <div className="relative sm:absolute mt-6 sm:mt-0 sm:-bottom-4 sm:-right-2 z-30 w-full sm:w-80 max-w-xs rounded-2xl border border-white/15 bg-[#12151E]/90 backdrop-blur-2xl p-4 shadow-2xl shadow-black/70 flex items-center gap-3.5">
            {/* Glowing Mini Reading Ritual Ring */}
            <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                <circle
                  cx="22"
                  cy="22"
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="4"
                />
                <circle
                  cx="22"
                  cy="22"
                  r={ringRadius}
                  fill="none"
                  stroke="#E28743"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  className="transition-all duration-700"
                />
              </svg>
              <Flame
                className={`w-4 h-4 absolute ${
                  streakDays > 0 || todayMinutes > 0
                    ? "text-amber-400 fill-amber-400"
                    : "text-zinc-500"
                }`}
              />
            </div>

            {/* Live Progress & Streak Info */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                  {isLoggedIn && currentRead ? "Continue Reading" : "Reading Ritual"}
                </span>
                <span className="text-[11px] font-mono font-bold text-zinc-200">
                  {isLoggedIn && currentRead ? `${displayPercentage}%` : `${todayMinutes}/${dailyGoalMinutes}m`}
                </span>
              </div>

              <p
                className="font-serif text-xs font-semibold text-zinc-100 truncate"
                title={displayTitle}
              >
                {displayTitle}
              </p>

              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#E28743] to-amber-400 transition-all duration-500"
                  style={{
                    width: `${
                      isLoggedIn && currentRead ? Math.max(displayPercentage, 4) : ringPercent
                    }%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>
                  Streak:{" "}
                  <strong className="text-zinc-200">
                    {streakDays} {streakDays === 1 ? "day" : "days"}
                  </strong>
                </span>
                <Link href="/goals" className="text-amber-400 hover:underline font-medium">
                  View Goals
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
