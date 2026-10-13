"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, BookOpen, Star, Clock, Layers, ArrowRight, Play } from "lucide-react";
import { BookWithAuthorAndGenres } from "@/types/books";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth/use-auth";
import { LibraryActionButton } from "@/components/books/LibraryActionButton";

interface FeaturedSectionProps {
  books: BookWithAuthorAndGenres[];
  loading?: boolean;
}

export function FeaturedSection({ books, loading }: FeaturedSectionProps) {
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-6 w-56 bg-secondary/60 rounded animate-pulse" />
        <div className="h-96 rounded-3xl border border-border/80 bg-card/60 p-8 animate-pulse" />
      </div>
    );
  }

  if (!books || books.length === 0) return null;

  const heroBook = books[0];
  const secondaryBooks = books.slice(1);

  const heroHref = user
    ? `/books/${heroBook.slug}`
    : `/login?next=${encodeURIComponent(`/books/${heroBook.slug}`)}&notice=${encodeURIComponent("Please sign in to explore books")}`;

  const readHref = `/read/${heroBook.slug}`;

  return (
    <section className="flex flex-col gap-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/25">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Featured Story of the Week
            </h2>
            <p className="text-xs text-muted-foreground">
              Editorially curated literary masterpiece from the Taleora catalog
            </p>
          </div>
        </div>
      </div>

      {/* Cinematic Hero Spotlight Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card/90 via-card/50 to-background/95 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
        {/* Warm Ambient Backdrop Halos */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-primary/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: 3D Luxury Hardcover Novella Showcase */}
          <div className="lg:col-span-5 flex items-center justify-center relative min-h-[300px] sm:min-h-[360px]">
            <Link
              href={heroHref}
              className="relative cursor-pointer group focus:outline-none transition-transform duration-500 hover:scale-[1.02]"
              style={{ perspective: "1200px" }}
              aria-label={`View ${heroBook.title}`}
            >
              <div
                className="relative w-48 sm:w-56 h-72 sm:h-84 rounded-r-xl rounded-l-xs shadow-2xl shadow-black/70 transition-transform duration-500"
                style={{
                  transform: "rotateY(-16deg) rotateX(8deg) rotateZ(1deg)",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Spine depth shadow */}
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/70 via-amber-950/40 to-transparent rounded-l-xs z-20 pointer-events-none" />

                {/* Book Cover Surface */}
                <div
                  className={`w-full h-full rounded-r-xl rounded-l-xs p-6 flex flex-col justify-between relative overflow-hidden border border-amber-500/40 shadow-2xl ${
                    heroBook.cover_gradient
                      ? `bg-gradient-to-br ${heroBook.cover_gradient}`
                      : "bg-gradient-to-br from-stone-900 via-neutral-900 to-zinc-950"
                  }`}
                >
                  {/* Real Book Cover Image with Clear Visibility & Hardcover Lighting */}
                  {heroBook.cover_image_url ? (
                    <>
                      <Image
                        src={heroBook.cover_image_url}
                        alt={heroBook.title}
                        fill
                        sizes="(max-width: 768px) 220px, 300px"
                        priority
                        unoptimized={
                          !heroBook.cover_image_url.includes(".supabase.co") &&
                          !heroBook.cover_image_url.startsWith("/")
                        }
                        className="absolute inset-0 w-full h-full object-cover object-center"
                      />

                      {/* Hardcover Ambient Lighting & Sheen */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15 pointer-events-none z-10" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/[0.08] pointer-events-none z-10" />

                      {/* Delicate Gold Foil Edging Frame */}
                      <div className="absolute inset-2.5 border border-amber-400/30 rounded-lg pointer-events-none z-10" />
                      <div className="absolute top-3 left-3 w-2 h-2 border-t border-l border-amber-400/50 pointer-events-none z-10" />
                      <div className="absolute top-3 right-3 w-2 h-2 border-t border-r border-amber-400/50 pointer-events-none z-10" />
                      <div className="absolute bottom-3 left-3 w-2 h-2 border-b border-l border-amber-400/50 pointer-events-none z-10" />
                      <div className="absolute bottom-3 right-3 w-2 h-2 border-b border-r border-amber-400/50 pointer-events-none z-10" />
                    </>
                  ) : (
                    <>
                      {/* Fallback Ornate Gold Foil Layout */}
                      <div className="absolute inset-3 border border-amber-400/40 rounded-lg pointer-events-none" />
                      <div className="relative z-10 flex flex-col items-center pt-2 text-center">
                        <div className="w-7 h-7 rounded-full border border-amber-400/40 flex items-center justify-center text-amber-400/90 mb-1">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[8px] tracking-[0.2em] uppercase text-amber-300/80 font-serif">
                          Taleora Edition
                        </span>
                      </div>

                      <div className="relative z-10 text-center my-auto px-2">
                        <h3 className="font-serif text-base sm:text-lg font-bold text-amber-100 drop-shadow-md leading-tight line-clamp-3">
                          {heroBook.title}
                        </h3>
                        <div className="w-8 h-[1px] bg-amber-400/50 mx-auto my-2" />
                        <p className="text-[10px] text-amber-200/80 font-serif italic">
                          {heroBook.author?.name || "Independent Author"}
                        </p>
                      </div>

                      <div className="relative z-10 text-center pb-1">
                        <span className="text-[7px] text-amber-400/70 uppercase tracking-widest font-mono">
                          Novella
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Book Pages Edge (Depth illusion) */}
                <div
                  className="absolute top-1 -right-3 w-4 h-[calc(100%-8px)] rounded-r-xs bg-gradient-to-r from-stone-200 via-amber-100 to-stone-300 dark:from-stone-800 dark:via-stone-700 dark:to-stone-900 border-y border-r border-stone-400/40 shadow-inner"
                  style={{
                    transform: "rotateY(75deg)",
                    transformOrigin: "left center",
                  }}
                />
              </div>
            </Link>
          </div>

          {/* Right Column: Story Narrative Details & Actions */}
          <div className="lg:col-span-7 flex flex-col gap-4 text-left">
            {/* Top Badge: Featured Spotlight */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs shadow-amber-500/10">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Story of the Week</span>
              </span>

              {heroBook.genres?.slice(0, 2).map((g) => (
                <span
                  key={g.id}
                  className="text-xs font-mono text-muted-foreground bg-secondary/60 px-2.5 py-0.5 rounded-full border border-border/60"
                >
                  #{g.name}
                </span>
              ))}
            </div>

            {/* Story Title & Author */}
            <div className="flex flex-col gap-1.5">
              <Link href={heroHref} className="group/title focus:outline-none">
                <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground group-hover/title:text-primary transition-colors leading-[1.15]">
                  {heroBook.title}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground font-serif italic">
                by{" "}
                <span className="text-primary font-medium font-sans not-italic">
                  {heroBook.author?.name || "Independent Author"}
                </span>
              </p>
            </div>

            {/* Metadata Badges Bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{(heroBook.average_rating ?? 5.0).toFixed(1)}</span>
                <span className="text-muted-foreground font-normal">
                  ({heroBook.ratings_count ?? 12} reviews)
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/60 border border-border/80">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{heroBook.estimated_read_time_minutes} min read</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/60 border border-border/80">
                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{heroBook.total_chapters} Chapters</span>
              </div>
            </div>

            {/* Rich Synopsis */}
            <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed line-clamp-3 sm:line-clamp-4 font-serif">
              {heroBook.description || heroBook.subtitle || "A mesmerizing literary journey crafted with evocative characters, dramatic revelations, and poignant prose."}
            </p>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-3 mt-1 border-t border-border/60">
              <Link href={heroHref}>
                <Button
                  size="md"
                  className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-semibold border-none shadow-lg shadow-amber-500/25 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Explore Story</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              </Link>

              <Link href={readHref}>
                <Button
                  size="md"
                  variant="outline"
                  className="gap-2 border-border/80 hover:border-primary/50 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Read Chapter 1</span>
                </Button>
              </Link>

              <LibraryActionButton
                bookId={heroBook.id}
                bookTitle={heroBook.title}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Spotlights if available */}
      {secondaryBooks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {secondaryBooks.map((book) => {
            const secondaryHref = user
              ? `/books/${book.slug}`
              : `/login?next=${encodeURIComponent(`/books/${book.slug}`)}&notice=${encodeURIComponent("Please sign in to explore books")}`;

            return (
              <div
                key={book.id}
                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/40 transition-all p-4 flex gap-4 items-center"
              >
                <div className="relative w-20 h-28 shrink-0 rounded-lg overflow-hidden border border-border/60 bg-muted shadow-sm">
                  {book.cover_image_url ? (
                    <Image
                      src={book.cover_image_url}
                      alt={book.title}
                      fill
                      sizes="100px"
                      unoptimized={!book.cover_image_url.includes(".supabase.co") && !book.cover_image_url.startsWith("/")}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${book.cover_gradient || "from-stone-800 to-zinc-950"} p-2 flex flex-col justify-between text-white`}>
                      <span className="text-[8px] font-serif uppercase tracking-widest text-amber-300">Taleora</span>
                      <span className="font-serif text-[10px] font-bold line-clamp-2 leading-tight">{book.title}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                    Editor&apos;s Selection
                  </span>
                  <Link href={secondaryHref} className="focus:outline-none">
                    <h4 className="font-serif text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {book.title}
                    </h4>
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">
                    by {book.author?.name || "Independent Author"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Star className="w-3 h-3 fill-current" />
                      {(book.average_rating ?? 5.0).toFixed(1)}
                    </span>
                    <span>·</span>
                    <span>{book.total_chapters} ch</span>
                    <span>·</span>
                    <Link href={secondaryHref} className="text-primary hover:underline ml-auto font-medium">
                      Details &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
