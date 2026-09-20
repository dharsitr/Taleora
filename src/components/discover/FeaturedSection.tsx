"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, BookOpen, Star, ArrowRight } from "lucide-react";
import { BookWithAuthorAndGenres } from "@/types/books";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth/use-auth";

interface FeaturedSectionProps {
  books: BookWithAuthorAndGenres[];
  loading?: boolean;
}

export function FeaturedSection({ books, loading }: FeaturedSectionProps) {
  const { user } = useAuth();
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-6 w-48 bg-secondary rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl border border-border bg-card/60 p-6 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!books || books.length === 0) return null;

  return (
    <section className="flex flex-col gap-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
              Featured & New Tales
            </h2>
            <p className="text-xs text-muted-foreground">
              Curated spotlights from Taleora&apos;s literary editors
            </p>
          </div>
        </div>
      </div>

      {/* Spotlight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {books.map((book) => {
          const coverGradient =
            book.cover_gradient ||
            "from-indigo-950 via-slate-900 to-black";

          return (
            <div
              key={book.id}
              className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row"
            >
              {/* Cover Column */}
              <div className="relative w-full sm:w-48 h-56 sm:h-auto shrink-0 overflow-hidden bg-muted">
                {book.cover_image_url ? (
                  <Image
                    src={book.cover_image_url}
                    alt={book.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 192px"
                    unoptimized={!book.cover_image_url.includes(".supabase.co") && !book.cover_image_url.startsWith("/")}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${coverGradient} p-5 flex flex-col justify-between text-white`}
                  >
                    <div className="flex justify-between items-start">
                      <BookOpen className="w-5 h-5 text-white/70" />
                      <Badge variant="secondary" className="bg-white/20 text-white border-none text-[10px]">
                        Featured
                      </Badge>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-white/80 block uppercase tracking-wider">
                        {book.genres?.[0]?.name || "Novella"}
                      </span>
                      <h4 className="font-serif text-base font-bold leading-snug line-clamp-2">
                        {book.title}
                      </h4>
                    </div>
                  </div>
                )}
              </div>

              {/* Story Details Column */}
              <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 min-w-0">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {book.genres?.map((g) => (
                      <span
                        key={g.id}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border"
                      >
                        {g.name}
                      </span>
                    ))}
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-semibold ml-auto">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{Number(book.average_rating).toFixed(1)}</span>
                    </div>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    <Link href={user ? `/books/${book.slug}` : `/login?next=${encodeURIComponent(`/books/${book.slug}`)}&notice=${encodeURIComponent("Please sign in to explore books")}`}>
                      {book.title}
                    </Link>
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-1">
                    by {book.author?.name || "Unknown Author"}
                  </p>

                  <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3 mt-1">
                    {book.description || "An immersive literary narrative waiting to be uncovered."}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 mt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    {book.total_chapters} chapters · {book.estimated_read_time_minutes}m read
                  </span>

                  <Link href={user ? `/books/${book.slug}` : `/login?next=${encodeURIComponent(`/books/${book.slug}`)}&notice=${encodeURIComponent("Please sign in to explore books")}`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                      <span>Read Story</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
