import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Clock,
  Layers,
  BookOpen,
  Calendar,
  Sparkles,
} from "lucide-react";
import { getBookBySlug } from "@/lib/books/queries";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LibraryActionButton } from "@/components/books/LibraryActionButton";
import { OfflineDownloadButton } from "@/components/offline/OfflineDownloadButton";
import { ChapterList } from "@/components/books/ChapterList";
import { AuthorCard } from "@/components/books/AuthorCard";
import { BookReviewsSection } from "@/components/social";

interface BookPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    return {
      title: "Book Not Found · Taleora",
    };
  }

  return {
    title: `${book.title} · Taleora`,
    description:
      book.description ||
      book.subtitle ||
      `Read ${book.title} by ${book.author?.name} on Taleora.`,
    openGraph: {
      title: book.title,
      description: book.description || book.subtitle || undefined,
    },
  };
}

export default async function BookDetailsPage({ params }: BookPageProps) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  const coverGradient =
    book.cover_gradient || "from-amber-700 via-stone-800 to-zinc-950";
  const primaryGenre = book.genres?.[0]?.name || "Story";
  const formattedDate = book.published_at
    ? new Date(book.published_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex flex-col gap-10 max-w-5xl mx-auto">
      {/* Back to Explore Navigation */}
      <div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Story Catalog</span>
        </Link>
      </div>

      {/* Hero Book Banner & Identity */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div
          className={`w-full bg-gradient-to-br ${coverGradient} p-6 sm:p-10 text-white relative overflow-hidden`}
        >
          {/* Subtle atmospheric vignette */}
          <div className="absolute inset-0 bg-black/35" />

          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
            {/* Book Spine / Cover Mock */}
            <div className="w-36 h-52 sm:w-44 sm:h-64 rounded-xl bg-black/40 border border-white/25 shadow-2xl p-4 flex flex-col justify-between shrink-0 relative overflow-hidden backdrop-blur-xs">
              {book.cover_image_url && (
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35" />
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-white/20 z-10" />
              <Badge
                variant="warm"
                className="bg-black/50 text-white border-white/20 text-[10px] self-start relative z-10"
              >
                {primaryGenre}
              </Badge>
              <div>
                <h2 className="font-serif text-base font-bold text-white leading-tight line-clamp-3">
                  {book.title}
                </h2>
                <p className="text-xs text-white/80 mt-1 line-clamp-1">
                  {book.author?.name}
                </p>
              </div>
            </div>

            {/* Book Core Metadata & Synopsis */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Genre Pills */}
              <div className="flex flex-wrap gap-2 items-center">
                {book.genres?.map((genre) => (
                  <Badge
                    key={genre.id}
                    variant="warm"
                    className="bg-black/50 text-white border-white/20 text-xs font-semibold backdrop-blur-xs"
                  >
                    {genre.name}
                  </Badge>
                ))}
                {book.featured && (
                  <Badge
                    variant="accent"
                    className="bg-amber-500/90 text-zinc-950 font-bold text-xs"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>

              {/* Title & Subtitle */}
              <div>
                <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight drop-shadow-xs">
                  {book.title}
                </h1>
                {book.subtitle && (
                  <p className="text-sm sm:text-base text-white/85 font-serif italic mt-1.5 leading-relaxed">
                    &ldquo;{book.subtitle}&rdquo;
                  </p>
                )}
              </div>

              {/* Author & Metric row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-white/90 pt-1">
                <span className="font-medium text-white">
                  By{" "}
                  <span className="font-bold underline decoration-white/40 underline-offset-4">
                    {book.author?.name}
                  </span>
                </span>

                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Star className="w-4 h-4 fill-amber-300" />
                  <span>{(book.average_rating ?? 5.0).toFixed(1)}</span>
                  <span className="text-white/70 font-normal">
                    ({book.ratings_count ?? 0} reviews)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{book.estimated_read_time_minutes} mins total</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>{book.total_chapters} chapters</span>
                </div>

                {formattedDate && (
                  <div className="flex items-center gap-1.5 text-white/75">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Published {formattedDate}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                <LibraryActionButton
                  bookId={book.id}
                  bookTitle={book.title}
                  size="lg"
                  className="shadow-md"
                />

                <OfflineDownloadButton
                  bookId={book.id}
                  bookTitle={book.title}
                  size="lg"
                  className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-xs shadow-md"
                />

                <Link href={`/read/${book.slug}`}>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="gap-2 cursor-pointer bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-xs shadow-md"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Start Reading</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Synopsis Area */}
        <div className="p-6 sm:p-8 flex flex-col gap-3 border-t border-border">
          <h3 className="font-serif text-lg font-bold text-foreground">
            Story Synopsis
          </h3>
          <p className="text-sm text-foreground/80 leading-relaxed max-w-3xl">
            {book.description ||
              "No synopsis currently provided for this literary work."}
          </p>
        </div>
      </div>

      {/* Author Profile Card */}
      {book.author && <AuthorCard author={book.author} />}

      {/* Chapters & Transcripts Listing */}
      <ChapterList
        chapters={book.chapters}
        bookTitle={book.title}
        bookSlug={book.slug}
      />

      {/* Reader Reviews & Community Section */}
      <BookReviewsSection
        bookId={book.id}
        bookTitle={book.title}
      />
    </div>
  );
}
