"use client";

import * as React from "react";
import { Search, X, Sparkles, Compass, Tag, Layers, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/Input";
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
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card/90 via-card/50 to-background/95 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
      {/* Warm Ambient Backdrop Halos */}
      <div className="absolute top-0 right-1/4 -mt-16 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 -mb-16 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl flex flex-col gap-6">
        {/* Category Pill Header */}
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono text-[11px] text-amber-400/90">Curated Literary Archive</span>
        </div>

        {/* Hero Headings */}
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.12]">
            Discover Your Next Obsession
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl font-sans">
            Explore deep romantic sagas, gothic mysteries, and philosophical novellas. Search across stories, authors, and evocative literary themes.
          </p>
        </div>

        {/* Prominent Translucent Glassmorphism Search Bar */}
        <div className="relative max-w-2xl">
          <div className="relative flex items-center bg-secondary/40 hover:bg-secondary/60 focus-within:bg-card border border-border/80 focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-2xl transition-all shadow-sm">
            <Search className="w-4 h-4 text-amber-400/80 ml-4 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search stories, authors, or literary genres..."
              className="h-12 sm:h-14 pl-3 pr-10 text-sm sm:text-base bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground/75 w-full font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Glowing Genre Filter Pills */}
        {onGenreChange && (
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-medium text-foreground/80">Browse by Genre:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => onGenreChange("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer ${
                  selectedGenre === "all"
                    ? "font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-xs shadow-amber-500/15"
                    : "font-medium bg-secondary/50 hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border/60"
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
                    className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-xs shadow-amber-500/15"
                        : "font-medium bg-secondary/50 hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border/60"
                    }`}
                  >
                    <span>{g.name}</span>
                    {g.bookCount > 0 && (
                      <span className="text-[10px] opacity-75 font-mono">
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
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground border-t border-border/50">
          <span className="flex items-center gap-1.5 font-medium shrink-0 text-foreground/80">
            <Tag className="w-3.5 h-3.5 text-amber-500/80" />
            <span>Trending Tags:</span>
          </span>

          {featuredTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onTagSelect(isSelected ? null : tag)}
                className={`px-2.5 py-1 rounded-full text-xs font-mono transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-amber-500 text-amber-950 font-bold shadow-xs"
                    : "bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50"
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
              className="text-[11px] underline text-amber-400/80 hover:text-amber-300 ml-1 cursor-pointer"
            >
              Clear tag filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
