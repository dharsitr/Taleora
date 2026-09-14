"use client";

import * as React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { GenreRow } from "@/types/books";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface BookFiltersProps {
  genres: GenreRow[];
  selectedGenre: string;
  onGenreChange: (slug: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: "featured" | "rating" | "popular" | "newest" | "title";
  onSortChange: (
    sort: "featured" | "rating" | "popular" | "newest" | "title"
  ) => void;
  totalResults: number;
}

export function BookFilters({
  genres,
  selectedGenre,
  onGenreChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  totalResults,
}: BookFiltersProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Search Bar & Sort Dropdown Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Search by title, author, description, or genre..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            icon={<Search className="w-4 h-4 text-muted-foreground" />}
            className="pr-9 bg-card border-border/80 h-11"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sort:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onSortChange(e.target.value as any)
            }
            aria-label="Sort books by"
            className="h-11 px-3 text-xs rounded-lg border border-border/80 bg-card text-foreground focus:border-primary focus:outline-hidden cursor-pointer"
          >
            <option value="featured">Curated & Featured</option>
            <option value="rating">Highest Rated</option>
            <option value="popular">Most Popular</option>
            <option value="newest">Recently Published</option>
            <option value="title">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Genre Filter Pills & Counter */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none max-w-full">
          <button
            type="button"
            onClick={() => onGenreChange("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer",
              selectedGenre === "all"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60"
            )}
          >
            All Genres
          </button>

          {genres.map((genre) => {
            const isActive = selectedGenre === genre.slug;
            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => onGenreChange(genre.slug)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60"
                )}
              >
                {genre.name}
              </button>
            );
          })}
        </div>

        <span className="hidden sm:inline-block text-xs text-muted-foreground whitespace-nowrap shrink-0">
          Showing {totalResults} {totalResults === 1 ? "story" : "stories"}
        </span>
      </div>
    </div>
  );
}
