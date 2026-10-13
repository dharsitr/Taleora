"use client";

import * as React from "react";
import { BookOpen, Flame } from "lucide-react";

interface AuthVisualSideProps {
  quote: string;
  badgeText?: string;
  bookTitle?: string;
}

export function AuthVisualSide({
  quote,
  badgeText = "Daily reading streak",
  bookTitle = "The Art of Reading",
}: AuthVisualSideProps) {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center relative min-h-[540px] p-8 overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card/60 via-card/30 to-background/80 shadow-2xl backdrop-blur-xl">
      {/* Ambient Warm Golden Backlight */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-80 bg-amber-500/15 rounded-full blur-[100px]" />
        <div className="w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
      </div>

      {/* 3D Tilted Luxury Hardcover Book */}
      <div
        className="relative transition-transform duration-700 hover:scale-102 my-auto"
        style={{ perspective: "1200px" }}
      >
        <div
          className="relative w-56 sm:w-64 h-80 sm:h-92 rounded-r-xl rounded-l-xs shadow-2xl shadow-black/70 transition-transform duration-500"
          style={{
            transform: "rotateY(-16deg) rotateX(8deg) rotateZ(1deg)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Spine depth shadow */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/70 via-amber-950/40 to-transparent rounded-l-xs z-20 pointer-events-none" />

          {/* Book Cover Surface */}
          <div className="w-full h-full rounded-r-xl rounded-l-xs p-6 flex flex-col justify-between relative overflow-hidden border border-amber-500/40 bg-gradient-to-br from-stone-900 via-neutral-900 to-zinc-950 shadow-2xl">
            {/* Ornate Gold Foil Filigree Borders */}
            <div className="absolute inset-3 border border-amber-400/40 rounded-lg pointer-events-none" />
            <div className="absolute inset-4 border border-amber-500/20 rounded-md pointer-events-none" />

            {/* Corner Ornaments */}
            <div className="absolute top-4 left-4 w-3 h-3 border-t-2 border-l-2 border-amber-400/60" />
            <div className="absolute top-4 right-4 w-3 h-3 border-t-2 border-r-2 border-amber-400/60" />
            <div className="absolute bottom-4 left-4 w-3 h-3 border-b-2 border-l-2 border-amber-400/60" />
            <div className="absolute bottom-4 right-4 w-3 h-3 border-b-2 border-r-2 border-amber-400/60" />

            {/* Book Header / Emblem */}
            <div className="relative z-10 flex flex-col items-center pt-3 text-center">
              <div className="w-8 h-8 rounded-full border border-amber-400/40 flex items-center justify-center text-amber-400/90 mb-1">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-[10px] tracking-[0.2em] uppercase text-amber-300/80 font-serif">
                Taleora Classics
              </span>
            </div>

            {/* Gold Foil Title & Author */}
            <div className="relative z-10 text-center my-auto px-2">
              <h3 className="font-serif text-lg sm:text-xl font-bold tracking-normal text-amber-100 drop-shadow-md leading-tight line-clamp-3">
                {bookTitle}
              </h3>
              <div className="w-12 h-[1px] bg-amber-400/50 mx-auto my-2" />
              <p className="text-[11px] text-amber-200/80 font-serif italic tracking-wide">
                Special Reader Edition
              </p>
            </div>

            {/* Book Bottom Seal */}
            <div className="relative z-10 text-center pb-1">
              <span className="text-[9px] text-amber-400/60 uppercase tracking-widest font-mono">
                The Quiet Journey
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

      {/* Floating Glassmorphic Quote Card */}
      <div className="relative z-20 mt-4 w-full max-w-sm rounded-2xl border border-white/10 dark:border-white/10 bg-card/85 dark:bg-card/75 backdrop-blur-xl p-4 sm:p-5 shadow-2xl shadow-black/40 flex items-center justify-between gap-4 animate-in fade-in duration-300">
        <p className="font-serif italic text-xs sm:text-sm text-foreground/90 leading-relaxed">
          &ldquo;{quote}&rdquo;
        </p>
        <div className="flex flex-col items-center justify-center shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500">
          <Flame className="w-5 h-5 fill-amber-500" />
        </div>
      </div>
    </div>
  );
}
