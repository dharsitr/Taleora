"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight, BookOpen, Flame, Clock, Headphones } from "lucide-react";
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
  const bookTitle = featuredBook?.title || "The Black Orchid Promise";
  const authorName = featuredBook?.author?.name || "Taleora Edition";
  const bookSlug = featuredBook?.slug;

  const isLoggedIn = Boolean(userStats?.isLoggedIn || user);
  const streakDays = userStats?.streakDays ?? profile?.streak_days ?? 0;
  const currentRead = userStats?.currentRead;

  // Interactive 3D gyroscopic cursor tracking tilt
  const [tilt, setTilt] = React.useState({ x: -14, y: 7 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: -14 + x * 16,
      y: 7 - y * 12,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: -14, y: 7 });
  };

  // Before login: show rich preview mockup
  // After login: show user's real streak and progress
  const displayPercentage = isLoggedIn
    ? (currentRead ? currentRead.progressPercentage : 0)
    : 24;

  const displayTitle = isLoggedIn
    ? (currentRead
        ? (currentRead.chapterTitle
            ? `Chapter ${currentRead.chapterNumber || 1} · ${currentRead.chapterTitle}`
            : currentRead.bookTitle)
        : "Ready to start reading")
    : (featuredBook ? `Chapter 1 · The Billionaire's Return` : "Chapter 1 · The Beginning");

  const displayStreak = isLoggedIn
    ? `${streakDays} ${streakDays === 1 ? "day" : "days"}`
    : "7 days";

  return (
    <section
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 dark:border-white/10 bg-gradient-to-b from-card/90 via-card/50 to-background/95 p-5 sm:p-10 lg:p-14 shadow-2xl backdrop-blur-2xl transition-all"
    >
      {/* Cinematic Ambient Backdrop Glows */}
      <div className="absolute top-1/4 -right-10 w-[550px] h-[550px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -top-24 -left-20 w-[450px] h-[450px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-10 items-center">
        {/* Left Column: Editorial Headline & Actions */}
        <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 dark:text-amber-400 text-xs font-semibold w-fit backdrop-blur-md shadow-xs shadow-amber-500/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Welcome to Taleora · The Art of Reading</span>
          </div>

          <h1 className="font-serif text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.14] sm:leading-[1.10]">
            Every Page Turned is a{" "}
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 dark:from-amber-200 dark:via-amber-300 dark:to-amber-100 bg-clip-text text-transparent drop-shadow-sm">
              New World Awakened
            </span>
          </h1>

          <p className="text-xs sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-xl">
            Immerse yourself in thoughtfully curated tales, novellas, and reflective essays.
            Designed with warm paper tones, refined typography, and zero distractions for true story lovers.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2 sm:pt-3 w-full sm:w-auto">
            <Link href="/library" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-6 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-white shadow-xl shadow-amber-500/30 border border-amber-400/40 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>Explore the Library</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Link href={bookSlug ? `/books/${bookSlug}` : "/discover"} className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-6 rounded-xl text-xs sm:text-sm font-medium border-white/15 dark:border-white/10 bg-secondary/50 dark:bg-card/40 backdrop-blur-xl hover:bg-secondary hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Try Reader View</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column: 3D Luxury Hardcover Book & Floating Glassmorphic HUD */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[360px] sm:min-h-[460px] pt-4 lg:pt-0">
          {/* Ambient Glowing Backlight directly radiating from behind the book */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 sm:w-92 sm:h-92 bg-gradient-to-tr from-amber-500/25 via-rose-500/15 to-amber-400/20 rounded-full blur-[90px]" />
          </div>

          {/* Orbiting Glassmorphic Widget 1: Live Soundscape Pill */}
          <div className="absolute -top-3 left-2 sm:-left-4 z-30 px-3.5 py-1.5 rounded-full border border-white/20 bg-black/60 dark:bg-[#0B0D11]/80 backdrop-blur-xl shadow-2xl shadow-black/50 flex items-center gap-2 text-white animate-in fade-in duration-500">
            <Headphones className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-amber-200/90 tracking-wide">
                Soft Hearth & Rain
              </span>
              <div className="flex items-end gap-0.5 h-3 ml-1">
                <span className="w-0.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                <span className="w-0.5 h-3 bg-amber-400 rounded-full animate-pulse [animation-delay:150ms]" />
                <span className="w-0.5 h-2 bg-amber-400 rounded-full animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          </div>

          {/* 3D Tilted Hardcover Book Showcase */}
          <div
            className="relative transition-transform duration-500 ease-out cursor-pointer"
            style={{
              perspective: "1400px",
            }}
          >
            <div
              className="relative w-48 xs:w-56 sm:w-68 h-72 xs:h-84 sm:h-96 rounded-r-2xl rounded-l-xs shadow-2xl shadow-black/80 transition-transform duration-300 ease-out book-glow-aura"
              style={{
                transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg) rotateZ(1deg)`,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Crimson Satin Bookmark Ribbon Draping over top */}
              <div className="absolute -top-4 right-8 w-4 h-14 crimson-satin-ribbon z-40 shadow-xl pointer-events-none rounded-t-xs">
                <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-transparent [clip-path:polygon(0_100%,50%_0,100%_100%)] bg-card dark:bg-[#0d0f14]" />
              </div>

              {/* Spine Crease Depth Illusion */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/80 via-black/40 to-transparent rounded-l-xs z-30 pointer-events-none" />
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 z-30 pointer-events-none" />

              {/* Book Cover Surface */}
              <div
                className={`w-full h-full rounded-r-2xl rounded-l-xs p-6 flex flex-col justify-between relative overflow-hidden border border-amber-400/40 shadow-inner ${
                  featuredBook?.cover_gradient
                    ? `bg-gradient-to-br ${featuredBook.cover_gradient}`
                    : "bg-gradient-to-br from-stone-900 via-neutral-900 to-zinc-950"
                }`}
              >
                {/* Book Cover Image if available */}
                {featuredBook?.cover_image_url ? (
                  <>
                    <Image
                      src={featuredBook.cover_image_url}
                      alt={bookTitle}
                      fill
                      sizes="340px"
                      priority
                      unoptimized={!featuredBook.cover_image_url.includes(".supabase.co") && !featuredBook.cover_image_url.startsWith("/")}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />

                    {/* Hardcover Ambient Lighting & Sheen */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/[0.12] pointer-events-none z-10" />

                    {/* Delicate Gold Foil Edging Frame */}
                    <div className="absolute inset-3 border border-amber-400/40 rounded-xl pointer-events-none z-10" />
                    <div className="absolute top-3.5 left-3.5 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400/60 pointer-events-none z-10" />
                    <div className="absolute top-3.5 right-3.5 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400/60 pointer-events-none z-10" />
                    <div className="absolute bottom-3.5 left-3.5 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400/60 pointer-events-none z-10" />
                    <div className="absolute bottom-3.5 right-3.5 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400/60 pointer-events-none z-10" />
                  </>
                ) : (
                  <>
                    {/* Ornate Gold Foil Filigree Borders */}
                    <div className="absolute inset-3 border border-amber-400/40 rounded-xl pointer-events-none" />
                    <div className="absolute inset-4.5 border border-amber-500/20 rounded-lg pointer-events-none" />

                    {/* Corner Ornaments */}
                    <div className="absolute top-4 left-4 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-400/70" />
                    <div className="absolute top-4 right-4 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-400/70" />
                    <div className="absolute bottom-4 left-4 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-400/70" />
                    <div className="absolute bottom-4 right-4 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-400/70" />

                    {/* Book Header / Emblem */}
                    <div className="relative z-10 flex flex-col items-center pt-3 text-center">
                      <div className="w-8 h-8 rounded-full border border-amber-400/40 flex items-center justify-center text-amber-400/90 mb-1">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] tracking-[0.2em] uppercase text-amber-300/80 font-serif">
                        Taleora Classics
                      </span>
                    </div>

                    {/* Book Title & Author in Gold Foil Look */}
                    <div className="relative z-10 text-center my-auto px-2">
                      <h3 className="font-serif text-lg sm:text-xl font-bold tracking-normal text-amber-100 drop-shadow-md leading-tight line-clamp-3">
                        {bookTitle}
                      </h3>
                      <div className="w-12 h-[1px] bg-amber-400/50 mx-auto my-2" />
                      <p className="text-[11px] text-amber-200/80 font-serif italic tracking-wide">
                        {authorName}
                      </p>
                    </div>

                    {/* Book Bottom Seal */}
                    <div className="relative z-10 text-center pb-1">
                      <span className="text-[9px] text-amber-400/60 uppercase tracking-widest font-mono">
                        Special Novella Edition
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Book Pages Edge (Depth illusion with layered paper block) */}
              <div
                className="absolute top-1 -right-3.5 w-4 h-[calc(100%-8px)] rounded-r-xs bg-gradient-to-r from-stone-200 via-amber-100 to-stone-300 dark:from-stone-800 dark:via-stone-700 dark:to-stone-900 border-y border-r border-stone-400/40 shadow-inner"
                style={{
                  transform: "rotateY(78deg)",
                  transformOrigin: "left center",
                }}
              />
            </div>
          </div>

          {/* Orbiting Glassmorphic Widget 2: Floating Currently Reading Dock */}
          <div className="relative sm:absolute mt-6 sm:mt-0 sm:-bottom-5 sm:-right-4 z-30 w-full sm:w-72 max-w-xs rounded-2xl border border-white/20 dark:border-white/10 bg-card/85 dark:bg-[#12151D]/85 backdrop-blur-2xl p-4 shadow-2xl shadow-black/60 flex flex-col gap-2.5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-foreground/90">
                  Currently Reading
                </span>
              </div>
              <span className="text-xs font-bold text-amber-500 font-mono">
                {displayPercentage}%
              </span>
            </div>

            {/* Reading Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-secondary/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 shadow-sm shadow-amber-500/40 transition-all duration-500"
                style={{ width: `${displayPercentage}%` }}
              />
            </div>

            <div>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider block font-medium">
                Reading Progress
              </span>
              <p className="font-serif text-xs font-semibold text-foreground truncate mt-0.5" title={displayTitle}>
                {displayTitle}
              </p>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Daily reading streak</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {displayStreak}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
