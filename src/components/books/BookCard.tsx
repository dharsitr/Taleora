"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Clock, BookOpen, Layers } from "lucide-react";
import { BookWithAuthorAndGenres } from "@/types/books";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LibraryActionButton } from "./LibraryActionButton";

interface BookCardProps {
  book: BookWithAuthorAndGenres;
}

export function BookCard({ book }: BookCardProps) {
  const primaryGenre = book.genres?.[0]?.name || "Story";
  const authorName = book.author?.name || "Unknown Author";

  const coverGradient =
    book.cover_gradient || "from-stone-800 via-zinc-900 to-black";

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5">
      {/* Visual Cover Banner */}
      <div
        className={`h-48 w-full bg-gradient-to-br ${coverGradient} p-5 flex flex-col justify-between text-white relative overflow-hidden`}
      >
        {book.cover_image_url && (
          <Image
            src={book.cover_image_url}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={!book.cover_image_url.includes(".supabase.co") && !book.cover_image_url.startsWith("/")}
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/35 group-hover:from-black/75 transition-colors" />

        {/* Decorative spine crease effect */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/25 z-10" />

        {/* Top bar: Genre Badge & Library Action Toggle */}
        <div className="relative z-10 flex items-start justify-between gap-2">
          <Badge
            variant="warm"
            className="bg-black/45 text-white border-white/20 backdrop-blur-xs text-[11px] font-medium"
          >
            {primaryGenre}
          </Badge>

          <LibraryActionButton
            bookId={book.id}
            bookTitle={book.title}
            iconOnly
          />
        </div>

        {/* Cover Title & Author */}
        <div className="relative z-10">
          <Link href={`/books/${book.slug}`} className="block focus:outline-hidden">
            <h3 className="font-serif text-lg font-bold leading-snug line-clamp-2 text-white drop-shadow-xs group-hover:text-amber-200 transition-colors">
              {book.title}
            </h3>
          </Link>
          <p className="text-xs text-white/85 line-clamp-1 mt-0.5">
            by {authorName}
          </p>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 flex flex-col p-4 sm:p-5 gap-3">
        {/* Rating & Read time */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-500" />
            <span>{(book.average_rating ?? 5.0).toFixed(1)}</span>
            <span className="text-muted-foreground font-normal">
              ({book.ratings_count ?? 0})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{book.estimated_read_time_minutes} min read</span>
          </div>
        </div>

        {/* Synopsis Excerpt */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {book.description || book.subtitle || "A captivating literary story in Taleora."}
        </p>

        {/* Genres & Chapter metadata */}
        <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-2">
          {book.genres?.slice(0, 2).map((genre) => (
            <span
              key={genre.id}
              className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
            >
              {genre.name}
            </span>
          ))}
          <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>{book.total_chapters} chs</span>
          </span>
        </div>

        {/* Card CTA: Read / Book Details */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {book.trending ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                Trending Story
              </span>
            ) : book.featured ? (
              <span className="text-primary font-medium text-[11px]">
                Featured Title
              </span>
            ) : (
              <span className="text-[11px]">Published</span>
            )}
          </span>

          <Link href={`/books/${book.slug}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5 hover:text-primary cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Explore Book</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
