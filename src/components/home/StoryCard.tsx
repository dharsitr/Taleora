"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Clock, BookOpen, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/use-auth";
import type { BookWithAuthorAndGenres } from "@/types/books";

interface StoryCardProps {
  book: BookWithAuthorAndGenres;
}

export function StoryCard({ book }: StoryCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaved, setIsSaved] = React.useState(false);
  const gradient = book.cover_gradient || "from-amber-700 via-stone-800 to-zinc-950";
  const genre = book.genres[0]?.name ?? "Story";
  const authorName = book.author?.name ?? "Unknown Author";

  const bookHref = user
    ? `/books/${book.slug}`
    : `/login?next=${encodeURIComponent(`/books/${book.slug}`)}&notice=${encodeURIComponent("Please sign in to explore books")}`;

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5">
      {/* Visual Cover Banner */}
      <div
        className={`h-44 w-full bg-gradient-to-br ${gradient} p-5 flex flex-col justify-between text-white relative overflow-hidden`}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30 group-hover:from-black/75 transition-colors" />

        <div className="relative z-10 flex items-start justify-between">
          <Badge
            variant="warm"
            className="bg-black/40 text-white border-white/20 backdrop-blur-xs text-[11px]"
          >
            {genre}
          </Badge>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (!user) {
                router.push(`/login?next=${encodeURIComponent(`/books/${book.slug}`)}&notice=${encodeURIComponent("Please sign in to bookmark stories")}`);
                return;
              }
              setIsSaved(!isSaved);
            }}
            aria-label={isSaved ? "Remove from bookmarks" : "Save bookmark"}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
          >
            <Bookmark
              className={`w-4 h-4 ${isSaved ? "fill-amber-400 text-amber-400" : ""}`}
            />
          </button>
        </div>

        <div className="relative z-10">
          <Link href={bookHref}>
            <h4 className="font-serif text-lg font-bold leading-snug line-clamp-2 text-white drop-shadow-xs hover:text-amber-200 transition-colors">
              {book.title}
            </h4>
          </Link>
          <span className="text-xs text-white/80 line-clamp-1 mt-0.5">
            by {authorName}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 flex flex-col p-4 sm:p-5 gap-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-500" />
            <span>{Number(book.average_rating).toFixed(1)}</span>
            <span className="text-muted-foreground font-normal">
              ({book.ratings_count})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{book.estimated_read_time_minutes} min read</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {book.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
          {book.genres.slice(0, 2).map((g) => (
            <span
              key={g.id}
              className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
            >
              #{g.name}
            </span>
          ))}
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {book.total_chapters} Chapters
          </span>
          <Link href={bookHref}>
            <Button variant="ghost" size="sm" className="text-xs gap-1.5 hover:text-primary cursor-pointer">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Explore Book</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
