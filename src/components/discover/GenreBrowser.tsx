"use client";

import * as React from "react";
import { Layers, ChevronRight } from "lucide-react";
import { GenreWithCount } from "@/types/books";

interface GenreBrowserProps {
  genres: GenreWithCount[];
  selectedGenre: string;
  onSelectGenre: (slug: string) => void;
  loading?: boolean;
}

const GENRE_STYLES: Record<string, { gradient: string; accent: string }> = {
  "celestial-fantasy": {
    gradient: "from-indigo-950/80 via-purple-950/50 to-background",
    accent: "text-indigo-400 border-indigo-500/30",
  },
  "gothic-mystery": {
    gradient: "from-stone-950/90 via-zinc-900/50 to-background",
    accent: "text-amber-400 border-amber-500/30",
  },
  "steampunk-fiction": {
    gradient: "from-amber-950/80 via-yellow-950/40 to-background",
    accent: "text-amber-500 border-amber-600/30",
  },
  "philosophical-fiction": {
    gradient: "from-emerald-950/80 via-teal-950/40 to-background",
    accent: "text-emerald-400 border-emerald-500/30",
  },
  "scifi-thriller": {
    gradient: "from-blue-950/80 via-cyan-950/40 to-background",
    accent: "text-cyan-400 border-cyan-500/30",
  },
  "literary-essays": {
    gradient: "from-rose-950/70 via-stone-900/40 to-background",
    accent: "text-rose-400 border-rose-500/30",
  },
};

export function GenreBrowser({
  genres,
  selectedGenre,
  onSelectGenre,
  loading,
}: GenreBrowserProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-6 w-48 bg-secondary rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-border bg-card/60 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!genres || genres.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
              Browse by Genre & World
            </h2>
            <p className="text-xs text-muted-foreground">
              Explore distinct atmospheric realms and thematic movements
            </p>
          </div>
        </div>

        {selectedGenre !== "all" && (
          <button
            type="button"
            onClick={() => onSelectGenre("all")}
            className="text-xs text-primary hover:underline font-medium cursor-pointer"
          >
            Show All Shelves
          </button>
        )}
      </div>

      {/* Categories Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {genres.map((genre) => {
          const isSelected = selectedGenre === genre.slug;
          const style = GENRE_STYLES[genre.slug] || {
            gradient: "from-card via-card/80 to-background",
            accent: "text-primary border-primary/30",
          };

          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => onSelectGenre(genre.slug)}
              className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 flex flex-col justify-between h-32 cursor-pointer ${
                isSelected
                  ? "border-primary ring-2 ring-primary/40 bg-card shadow-md"
                  : "border-border/80 bg-card hover:border-border hover:shadow-sm"
              }`}
            >
              {/* Card Background Gradient Tint */}
              <div
                className={`absolute inset-0 bg-gradient-to-b ${style.gradient} opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none`}
              />

              <div className="relative z-10 flex items-center justify-between w-full">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-background/80 ${style.accent}`}
                >
                  {genre.bookCount} {genre.bookCount === 1 ? "story" : "stories"}
                </span>

                <ChevronRight
                  className={`w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all ${
                    isSelected ? "text-primary translate-x-0.5" : ""
                  }`}
                />
              </div>

              <div className="relative z-10">
                <h3 className="font-serif text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {genre.name}
                </h3>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                  {genre.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
