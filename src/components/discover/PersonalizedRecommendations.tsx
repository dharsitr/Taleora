"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Heart, LogIn } from "lucide-react";
import { BookWithAuthorAndGenres } from "@/types/books";
import { BookCard } from "@/components/books/BookCard";
import { useAuth } from "@/lib/auth/use-auth";

interface PersonalizedRecommendationsProps {
  books: BookWithAuthorAndGenres[];
  reason?: string;
  loading?: boolean;
}

export function PersonalizedRecommendations({
  books,
  reason = "Curated based on your literary preferences",
  loading,
}: PersonalizedRecommendationsProps) {
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-6 w-56 bg-secondary rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl border border-amber-500/20 bg-card/60 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!books || books.length === 0) return null;

  return (
    <section className="relative overflow-hidden flex flex-col gap-6 p-6 sm:p-8 rounded-3xl border border-amber-500/25 bg-card/85 shadow-[0_8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      {/* Ambient Halo */}
      <div className="absolute top-0 right-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)] shrink-0">
            <Heart className="w-4 h-4 fill-amber-500/20 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
                Recommended For You
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {reason}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tales tuned to your reading habits and library shelves
            </p>
          </div>
        </div>

        {!user && (
          <Link
            href="/login?next=/discover"
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:underline font-mono font-medium self-start sm:self-auto"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign in to personalize</span>
          </Link>
        )}
      </div>

      {/* Grid of Recommended Books */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}
