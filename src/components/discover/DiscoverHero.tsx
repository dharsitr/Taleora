"use client";

import * as React from "react";
import { Search, X, Compass, Tag } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface DiscoverHeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  featuredTags?: string[];
}

const DEFAULT_FEATURED_TAGS = [
  "celestial",
  "gothic",
  "steampunk",
  "philosophy",
  "mystery",
  "cosmic",
  "solitude",
  "adventure",
];

export function DiscoverHero({
  searchQuery,
  onSearchChange,
  selectedTag,
  onTagSelect,
  featuredTags = DEFAULT_FEATURED_TAGS,
}: DiscoverHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card/80 to-background p-6 sm:p-10 shadow-sm">
      {/* Background Ambience Glow */}
      <div className="absolute top-0 right-1/4 -mt-12 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 -mb-12 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl flex flex-col gap-5">
        {/* Category Pill Header */}
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <Compass className="w-4 h-4" />
          <span>The Grand Archive & Discovery</span>
        </div>

        {/* Hero Headings */}
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Discover Your Next Obsession
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            Explore celestial mythologies, intricate steampunk mechanics, and meditative prose. Search across stories, authors, genres, and evocative themes.
          </p>
        </div>

        {/* Prominent Search Bar */}
        <div className="relative mt-2">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, author, genre, synopsis, or keywords..."
            icon={<Search className="w-4 h-4 text-muted-foreground" />}
            className="h-12 sm:h-14 pl-11 pr-10 text-sm sm:text-base rounded-2xl bg-background/90 border-border/90 shadow-sm focus:ring-2 focus:ring-primary/30"
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

        {/* Popular Tags Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium shrink-0 text-foreground/80">
            <Tag className="w-3.5 h-3.5 text-primary" />
            <span>Popular Tags:</span>
          </span>

          {featuredTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onTagSelect(isSelected ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "bg-secondary/70 hover:bg-secondary text-secondary-foreground border border-border/60 hover:border-primary/40"
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
              className="text-[11px] underline text-muted-foreground hover:text-foreground ml-1 cursor-pointer"
            >
              Clear tag filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
