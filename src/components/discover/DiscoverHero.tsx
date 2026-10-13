"use client";

import * as React from "react";
import { Search, X, Sparkles, Compass, Tag, Layers, SlidersHorizontal, BookOpen } from "lucide-react";
import { GenreWithCount } from "@/types/books";

interface DiscoverHeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  featuredTags?: string[];
  genres?: GenreWithCount[];
  selectedGenre?: string;
  onGenreChange?: (slug: string) => void;
}

const DEFAULT_FEATURED_TAGS = [
  "gothic",
  "mystery",
  "romance",
  "philosophy",
  "celestial",
  "steampunk",
  "adventure",
];

export function DiscoverHero({
  searchQuery,
  onSearchChange,
  selectedTag,
  onTagSelect,
  featuredTags = DEFAULT_FEATURED_TAGS,
  genres = [],
  selectedGenre = "all",
  onGenreChange,
}: DiscoverHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-card/85 p-6 sm:p-10 shadow-[0_12px_45px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      {/* Warm Ambient Backdrop Halos */}
      <div className="absolute top-0 right-1/4 -mt-16 w-[450px] h-[450px] bg-amber-500/12 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 -mb-16 w-80 h-80 bg-amber-600/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl flex flex-col gap-6">
        {/* Category Pill Header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold uppercase tracking-wider self-start">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="font-mono text-[11px] tracking-widest">Curated Literary Archive</span>
        </div>

        {/* Hero Headings */}
        <div className="flex flex-col gap-2.5">
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.12]">
            Discover Your Next Obsession
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl font-sans">
            Explore deep romantic sagas, gothic mysteries, and philosophical novellas. Search across stories, verified authors, and episodic literary themes.
          </p>
        </div>

        {/* Prominent Translucent Glassmorphism Search Bar */}
        <div className="relative max-w-2xl">
          <div className="relative flex items-center bg-stone-900/60 dark:bg-stone-950/70 hover:bg-stone-900/80 focus-within:bg-stone-950 border border-amber-500/30 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-2xl transition-all shadow-lg shadow-black/30">
            <Search className="w-5 h-5 text-amber-400 ml-4 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search stories, authors, or literary genres..."
              className="h-12 sm:h-14 pl-3.5 pr-10 text-sm sm:text-base bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground/70 w-full font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-amber-400 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Glowing Genre Filter Pills */}
        {onGenreChange && (
          <div className="flex flex-col gap-2.5 pt-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-foreground/90 uppercase tracking-wider text-[11px] font-mono">
                Browse by Genre
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => onGenreChange("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
                  selectedGenre === "all"
                    ? "font-bold bg-amber-500 text-stone-950 border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                    : "font-medium bg-stone-900/60 hover:bg-stone-800 text-muted-foreground hover:text-amber-300 border border-stone-800"
                }`}
              >
                All Stories
              </button>

              {genres.map((g) => {
                const isSelected = selectedGenre === g.slug;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onGenreChange(isSelected ? "all" : g.slug)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "font-bold bg-amber-500 text-stone-950 border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                        : "font-medium bg-stone-900/60 hover:bg-stone-800 text-muted-foreground hover:text-amber-300 border border-stone-800"
                    }`}
                  >
                    <span>{g.name}</span>
                    {g.bookCount > 0 && (
                      <span className="text-[10px] opacity-80 font-mono">
                        ({g.bookCount})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Popular Tags Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-muted-foreground border-t border-border/40">
          <span className="flex items-center gap-1.5 font-medium shrink-0 text-foreground/80">
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-mono uppercase tracking-wider">Themes:</span>
          </span>

          {featuredTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onTagSelect(isSelected ? null : tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-amber-500 text-stone-950 font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                    : "bg-stone-900/50 hover:bg-stone-800 text-muted-foreground hover:text-amber-300 border border-stone-800/80"
                }`}
              >
                #{tag}
              </button>
            );
          })}

          {selectedTag && (
            <button
              type="button"
              onClick={() => onTagSelect(null)}
              className="text-[11px] underline text-amber-400 hover:text-amber-300 ml-1 cursor-pointer font-mono"
            >
              Clear tag
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
