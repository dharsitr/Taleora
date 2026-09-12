"use client";

import * as React from "react";
import { Sparkles, Compass } from "lucide-react";
import { StoryCard } from "./StoryCard";
import { MOCK_STORIES, MOCK_GENRES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function CuratedShelves() {
  const [selectedGenre, setSelectedGenre] = React.useState("All Stories");

  const filteredStories = React.useMemo(() => {
    if (selectedGenre === "All Stories") return MOCK_STORIES;
    return MOCK_STORIES.filter((story) =>
      story.genre.toLowerCase().includes(selectedGenre.toLowerCase())
    );
  }, [selectedGenre]);

  return (
    <section className="flex flex-col gap-6">
      {/* Shelf Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Collections</span>
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Featured Tales & Novellas
          </h2>
        </div>

        {/* Story Count Badge */}
        <span className="text-xs text-muted-foreground self-start sm:self-auto">
          Showing {filteredStories.length} of {MOCK_STORIES.length} titles
        </span>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {MOCK_GENRES.map((genre) => {
          const isActive = selectedGenre === genre;
          return (
            <button
              key={genre}
              type="button"
              onClick={() => setSelectedGenre(genre)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60"
              )}
            >
              {genre}
            </button>
          );
        })}
      </div>

      {/* Story Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      {filteredStories.length === 0 && (
        <div className="text-center py-12 rounded-xl border border-dashed border-border p-6 flex flex-col items-center gap-3">
          <Compass className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-medium">
            No stories found matching &ldquo;{selectedGenre}&rdquo; yet.
          </p>
          <button
            type="button"
            onClick={() => setSelectedGenre("All Stories")}
            className="text-xs text-primary underline"
          >
            Reset filter
          </button>
        </div>
      )}
    </section>
  );
}
