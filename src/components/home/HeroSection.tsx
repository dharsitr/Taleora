import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight, BookOpen, Flame, Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { BookWithAuthorAndGenres } from "@/types/books";

interface HeroSectionProps {
  featuredBook?: BookWithAuthorAndGenres | null;
}

export function HeroSection({ featuredBook }: HeroSectionProps) {
  const bookTitle = featuredBook?.title || "The Art of Reading";
  const authorName = featuredBook?.author?.name || "Taleora Edition";
  const bookSlug = featuredBook?.slug;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card/80 via-card/40 to-background/90 p-6 sm:p-10 lg:p-14 shadow-2xl backdrop-blur-xl">
      {/* Warm Ambient Backdrop Glows */}
      <div className="absolute top-1/4 -right-10 w-[500px] h-[500px] bg-amber-500/12 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
        {/* Left Column: Editorial Headline & Actions */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to Taleora · The Art of Reading</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.12]">
            Every Page Turned is a<br className="hidden sm:inline" /> New World Awakened
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-xl">
            Immerse yourself in thoughtfully curated tales, novellas, and reflective essays.
            Designed with warm paper tones, refined typography, and zero distractions for true story lovers.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Link href="/library">
              <Button
                size="lg"
                className="h-12 px-6 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-white shadow-lg shadow-amber-500/25 border border-amber-400/30 transition-all cursor-pointer"
              >
                <span>Explore the Library</span>
              </Button>
            </Link>

            <Link href={bookSlug ? `/books/${bookSlug}` : "/discover"}>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-6 rounded-xl text-sm font-medium border-border/80 bg-secondary/40 backdrop-blur-md hover:bg-secondary hover:border-primary/40 transition-all cursor-pointer"
              >
                <span>Try Reader View</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column: 3D Luxury Hardcover Book & Floating Glassmorphic Card */}
        <div className="lg:col-span-5 flex items-center justify-center relative min-h-[380px] sm:min-h-[440px] pt-4 lg:pt-0">
          {/* Subtle Ambient Book Halo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-72 sm:w-80 sm:h-80 bg-amber-500/15 rounded-full blur-3xl" />
          </div>

          {/* 3D Tilted Hardcover Book Showcase */}
          <div
            className="relative transition-transform duration-700 hover:scale-102"
            style={{
              perspective: "1200px",
            }}
          >
            <div
              className="relative w-56 sm:w-64 h-80 sm:h-92 rounded-r-xl rounded-l-xs shadow-2xl shadow-black/60 transition-transform duration-500"
              style={{
                transform: "rotateY(-16deg) rotateX(8deg) rotateZ(1deg)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Spine edge illusion */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/60 via-amber-950/40 to-transparent rounded-l-xs z-20 pointer-events-none" />

              {/* Book Cover Surface */}
              <div
                className={`w-full h-full rounded-r-xl rounded-l-xs p-6 flex flex-col justify-between relative overflow-hidden border border-amber-500/40 ${
                  featuredBook?.cover_gradient
                    ? `bg-gradient-to-br ${featuredBook.cover_gradient}`
                    : "bg-gradient-to-br from-stone-900 via-neutral-900 to-zinc-950"
                }`}
              >
                {/* Book Cover Image if available */}
                {featuredBook?.cover_image_url && (
                  <Image
                    src={featuredBook.cover_image_url}
                    alt={bookTitle}
                    fill
                    sizes="300px"
                    unoptimized={!featuredBook.cover_image_url.includes(".supabase.co") && !featuredBook.cover_image_url.startsWith("/")}
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-40 mix-blend-overlay"
                  />
                )}

                {/* Ornate Gold Foil Filigree Borders */}
                <div className="absolute inset-3 border border-amber-400/40 rounded-lg pointer-events-none" />
                <div className="absolute inset-4 border border-amber-500/20 rounded-md pointer-events-none" />

                {/* Corner Ornaments */}
                <div className="absolute top-4 left-4 w-3 h-3 border-t-2 border-l-2 border-amber-400/60" />
                <div className="absolute top-4 right-4 w-3 h-3 border-t-2 border-r-2 border-amber-400/60" />
                <div className="absolute bottom-4 left-4 w-3 h-4 border-b-2 border-l-2 border-amber-400/60" />
                <div className="absolute bottom-4 right-4 w-3 h-4 border-b-2 border-r-2 border-amber-400/60" />

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
              </div>

              {/* Book Pages Edge (Depth illusion) */}
              <div
                className="absolute top-1 -right-3 w-4 h-[calc(100%-8px)] rounded-r-xs bg-gradient-to-r from-stone-200 via-amber-100 to-stone-300 dark:from-stone-800 dark:via-stone-700 dark:to-stone-900 border-y border-r border-stone-400/40 shadow-inner"
                style={{
                  transform: "rotateY(75deg)",
                  transformOrigin: "left center",
                }}
              />
            </div>
          </div>

          {/* Floating Glassmorphic "Currently Reading" Preview Card */}
          <div className="absolute -bottom-4 right-2 sm:right-4 z-20 w-60 sm:w-68 rounded-2xl border border-white/10 dark:border-white/10 bg-card/85 dark:bg-card/75 backdrop-blur-xl p-4 shadow-2xl shadow-black/40 flex flex-col gap-2.5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground/80">
                Currently Reading
              </span>
              <span className="text-[11px] font-bold text-amber-500 font-mono">
                68%
              </span>
            </div>

            {/* Reading Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600"
                style={{ width: "68%" }}
              />
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                Reading Progress
              </span>
              <p className="font-serif text-xs font-semibold text-foreground truncate mt-0.5">
                {featuredBook ? `Chapter 1 · The Beginning` : "Chapter The Title"}
              </p>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Daily reading streak</span>
              </div>
              <span className="text-[10px] text-muted-foreground">14 days</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
