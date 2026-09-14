"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, LogIn } from "lucide-react";
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
              className="h-64 rounded-xl border border-border bg-card/60 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!books || books.length === 0) return null;

  return (
    <section className="flex flex-col gap-5 p-6 rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/5 via-card/50 to-card">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
            <Heart className="w-4 h-4 fill-primary/20 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
                Recommended For You
              </h2>
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
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
            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign in to personalize</span>
          </Link>
        )}
      </div>

      {/* Grid of Recommended Books */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}
