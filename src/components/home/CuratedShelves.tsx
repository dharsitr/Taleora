"use client";

import * as React from "react";
import { Sparkles, Compass, BookOpen } from "lucide-react";
import { StoryCard } from "./StoryCard";
import { cn } from "@/lib/utils";
import type { BookWithAuthorAndGenres } from "@/types/books";

interface CuratedShelvesProps {
  books: BookWithAuthorAndGenres[];
}

export function CuratedShelves({ books }: CuratedShelvesProps) {
  const [selectedGenre, setSelectedGenre] = React.useState("All");

  // Build genre list from real books
  const genres = React.useMemo(() => {
    const all = books.flatMap((b) => b.genres.map((g) => g.name));
    return ["All", ...Array.from(new Set(all))];
  }, [books]);

  const filtered = React.useMemo(() => {
    if (selectedGenre === "All") return books;
    return books.filter((b) =>
      b.genres.some((g) => g.name === selectedGenre)
    );
  }, [books, selectedGenre]);

  if (books.length === 0) {
    return (
      <section className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Collections</span>
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Featured Tales &amp; Novellas
          </h2>
        </div>
        <div className="text-center py-16 rounded-xl border border-dashed border-border flex flex-col items-center gap-4">
          <BookOpen className="w-10 h-10 text-muted-foreground/50" />
          <div>
            <p className="text-base font-medium text-foreground">No stories yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              New stories will appear here once published.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Collections</span>
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Featured Tales &amp; Novellas
          </h2>
        </div>
        <span className="text-xs text-muted-foreground self-start sm:self-auto">
          Showing {filtered.length} of {books.length} titles
        </span>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {genres.map((genre) => (
          <button
            key={genre}
            type="button"
            onClick={() => setSelectedGenre(genre)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer",
              selectedGenre === genre
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60"
            )}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Story Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((book) => (
          <StoryCard key={book.id} book={book} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 rounded-xl border border-dashed border-border p-6 flex flex-col items-center gap-3">
          <Compass className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-medium">
            No stories in &ldquo;{selectedGenre}&rdquo; yet.
          </p>
          <button
            type="button"
            onClick={() => setSelectedGenre("All")}
            className="text-xs text-primary underline"
          >
            Reset filter
          </button>
        </div>
      )}
    </section>
  );
}
