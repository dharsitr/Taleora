"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Flame, Star, BookOpen, Clock } from "lucide-react";
import { BookWithAuthorAndGenres } from "@/types/books";
import { useAuth } from "@/lib/auth/use-auth";

interface TrendingStoriesProps {
  books: BookWithAuthorAndGenres[];
  loading?: boolean;
}

export function TrendingStories({ books, loading }: TrendingStoriesProps) {
  const { user } = useAuth();
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-secondary rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl border border-border bg-card/60 p-4 animate-pulse flex gap-4"
            >
              <div className="w-20 h-full bg-secondary rounded-xl shrink-0" />
              <div className="flex flex-col gap-2 flex-1 justify-center">
                <div className="h-4 w-3/4 bg-secondary rounded" />
                <div className="h-3 w-1/2 bg-secondary/70 rounded" />
                <div className="h-3 w-1/3 bg-secondary/50 rounded mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Flame className="w-4 h-4 fill-amber-500/20" />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
              Trending Stories
            </h2>
            <p className="text-xs text-muted-foreground">
              Most captivated readers across the Taleora universe this week
            </p>
          </div>
        </div>

        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          Ranked by Velocity
        </span>
      </div>

      {/* Grid of Trending Story Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((book, index) => {
          const rank = index + 1;
          const coverGradient =
            book.cover_gradient ||
            "from-stone-800 via-stone-900 to-black";

          return (
            <Link
              key={book.id}
              href={user ? `/books/${book.slug}` : `/login?next=${encodeURIComponent(`/books/${book.slug}`)}&notice=${encodeURIComponent("Please sign in to explore books")}`}
              className="group relative flex gap-4 p-3.5 rounded-2xl border border-border/80 bg-card hover:bg-secondary/30 hover:border-border hover:shadow-md transition-all duration-300"
            >
              {/* Rank Badge */}
              <div
                className={`absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 ${
                  rank === 1
                    ? "bg-amber-500 text-amber-950 font-black ring-2 ring-background"
                    : rank === 2
                    ? "bg-stone-300 text-stone-950 font-bold ring-2 ring-background"
                    : rank === 3
                    ? "bg-amber-700 text-amber-50 font-bold ring-2 ring-background"
                    : "bg-secondary text-muted-foreground border border-border"
                }`}
              >
                #{rank}
              </div>

              {/* Book Cover Thumbnail */}
              <div className="relative w-20 h-28 shrink-0 rounded-xl overflow-hidden shadow-sm border border-border/60 group-hover:scale-[1.02] transition-transform">
                {book.cover_image_url ? (
                  <Image
                    src={book.cover_image_url}
                    alt={book.title}
                    fill
                    sizes="80px"
                    unoptimized={!book.cover_image_url.includes(".supabase.co") && !book.cover_image_url.startsWith("/")}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${coverGradient} p-2 flex flex-col justify-end text-white`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-white/70 mb-1" />
                    <span className="font-serif text-[10px] font-bold leading-tight line-clamp-2">
                      {book.title}
                    </span>
                  </div>
                )}
              </div>

              {/* Story Details */}
              <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                <div className="flex flex-col gap-1">
                  {book.genres && book.genres.length > 0 && (
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider truncate">
                      {book.genres[0].name}
                    </span>
                  )}
                  <h3 className="font-serif text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    by {book.author?.name || "Unknown Author"}
                  </p>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-2 border-t border-border/40 mt-2">
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{Number(book.average_rating).toFixed(1)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-muted-foreground/70" />
                    <span>{book.total_chapters} ch</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground/70" />
                    <span>{book.estimated_read_time_minutes}m</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
