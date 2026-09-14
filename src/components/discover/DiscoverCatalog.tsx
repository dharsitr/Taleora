"use client";

import * as React from "react";
import {
  SlidersHorizontal,
  Star,
  Calendar,
  Sparkles,
  RefreshCw,
  AlertCircle,
  X,
  Filter,
} from "lucide-react";
import {
  BookWithAuthorAndGenres,
  BookSortOption,
  GenreRow,
} from "@/types/books";
import { BookCard } from "@/components/books/BookCard";
import { Button } from "@/components/ui/Button";

interface DiscoverCatalogProps {
  books: BookWithAuthorAndGenres[];
  genres: GenreRow[];
  selectedGenre: string;
  onGenreChange: (slug: string) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  dateRange: "all" | "month" | "year";
  onDateRangeChange: (range: "all" | "month" | "year") => void;
  selectedTag: string | null;
  onTagChange: (tag: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: BookSortOption;
  onSortChange: (sort: BookSortOption) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onResetFilters: () => void;
}

export function DiscoverCatalog({
  books,
  genres,
  selectedGenre,
  onGenreChange,
  minRating,
  onMinRatingChange,
  dateRange,
  onDateRangeChange,
  selectedTag,
  onTagChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  loading,
  error,
  onRetry,
  onResetFilters,
}: DiscoverCatalogProps) {
  // Check if any filter is active
  const hasActiveFilters =
    selectedGenre !== "all" ||
    minRating > 0 ||
    dateRange !== "all" ||
    Boolean(selectedTag) ||
    Boolean(searchQuery.trim());

  return (
    <div id="catalog" className="flex flex-col gap-6 pt-4">
      {/* Section Header & Active Filters Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Complete Story Shelves
            </h2>
            <p className="text-xs text-muted-foreground">
              Filter by rating, publication era, category, and curated ordering
            </p>
          </div>

          <span className="text-xs font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-xl border border-border shrink-0 self-start sm:self-auto">
            {loading ? "Searching..." : `${books.length} stories available`}
          </span>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl border border-border/80 bg-card/60">
          {/* Minimum Rating Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <select
              value={minRating}
              onChange={(e) => onMinRatingChange(parseFloat(e.target.value) || 0)}
              className="h-9 px-2.5 text-xs rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value={0}>Any Rating</option>
              <option value={4.5}>4.5+ ★ Stars</option>
              <option value={4.0}>4.0+ ★ Stars</option>
              <option value={3.5}>3.5+ ★ Stars</option>
            </select>
          </div>

          {/* Publication Date Range Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={dateRange}
              onChange={(e) =>
                onDateRangeChange(e.target.value as "all" | "month" | "year")
              }
              className="h-9 px-2.5 text-xs rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="month">Past 30 Days</option>
              <option value="year">Past Year</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 text-xs ml-auto">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground hidden md:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as BookSortOption)}
              className="h-9 px-3 text-xs rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer font-medium"
            >
              <option value="featured">Curated & Featured</option>
              <option value="popularity">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Recently Published</option>
              <option value="updated">Recently Updated</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => onGenreChange("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
              selectedGenre === "all"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60"
            }`}
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60"
                }`}
              >
                {genre.name}
              </button>
            );
          })}
        </div>

        {/* Active Filter Chips Ribbon */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-secondary/50 border border-border/60 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/80 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Active Filters:
            </span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-background border border-border text-foreground font-medium">
                Search: &quot;{searchQuery}&quot;
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedGenre !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-background border border-border text-foreground font-medium">
                Genre: {genres.find((g) => g.slug === selectedGenre)?.name || selectedGenre}
                <button
                  type="button"
                  onClick={() => onGenreChange("all")}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {minRating > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-background border border-border text-foreground font-medium">
                Min: {minRating}★
                <button
                  type="button"
                  onClick={() => onMinRatingChange(0)}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {dateRange !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-background border border-border text-foreground font-medium">
                Date: {dateRange === "month" ? "Past 30 Days" : "Past Year"}
                <button
                  type="button"
                  onClick={() => onDateRangeChange("all")}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedTag && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-background border border-border text-foreground font-medium">
                Tag: #{selectedTag}
                <button
                  type="button"
                  onClick={() => onTagChange(null)}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-semibold text-primary hover:underline ml-auto cursor-pointer"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 flex flex-col items-center text-center gap-3">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col animate-pulse"
            >
              <div className="h-48 w-full bg-secondary/70" />
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="h-4 w-1/3 bg-secondary rounded" />
                <div className="h-5 w-4/5 bg-secondary rounded" />
                <div className="h-3 w-full bg-secondary/60 rounded" />
                <div className="h-3 w-2/3 bg-secondary/60 rounded" />
                <div className="pt-4 mt-auto border-t border-border/40 flex justify-between">
                  <div className="h-4 w-16 bg-secondary rounded" />
                  <div className="h-4 w-20 bg-secondary rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loaded Book Grid */}
      {!loading && !error && books.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}

      {/* No Results Empty State */}
      {!loading && !error && books.length === 0 && (
        <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-border bg-card/40 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-xl font-bold text-foreground">
            No Stories Matched Your Search
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
            We couldn&apos;t find any stories matching your current combination of keywords, genres, ratings, or tags.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="mt-3"
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
