import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Clock,
  Layers,
  BookOpen,
  Calendar,
  Sparkles,
  Play,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/books/${slug}`)}&notice=${encodeURIComponent("Please sign in to explore books")}`);
  }

  const book = await getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  const coverGradient =
    book.cover_gradient || "from-amber-700 via-stone-800 to-zinc-950";
  const primaryGenre = book.genres?.[0]?.name || "Novella";
  const formattedDate = book.published_at
    ? new Date(book.published_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  // First chapter link for the primary Read action
  const firstChapterSlug = book.chapters?.[0]?.slug;
  const readUrl = firstChapterSlug
    ? `/read/${book.slug}/${firstChapterSlug}`
    : `/read/${book.slug}`;

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      {/* Top Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link
          href="/library"
          className="hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Library</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
        <Link href="/discover" className="hover:text-primary transition-colors">
          Explore
        </Link>
        <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
        <span className="text-foreground font-medium truncate max-w-xs sm:max-w-md">
          {book.title}
        </span>
      </nav>

      {/* Cinematic Book Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card/90 via-card/50 to-background/95 p-6 sm:p-10 lg:p-12 shadow-2xl backdrop-blur-xl">
        {/* Warm Ambient Backdrop Halo */}
        <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-amber-500/12 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: 3D Luxury Hardcover Novella Showcase */}
          <div className="lg:col-span-5 flex items-center justify-center relative min-h-[340px] sm:min-h-[400px]">
            {/* Ambient Book Aura */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 sm:w-72 sm:h-72 bg-amber-500/15 rounded-full blur-3xl" />
            </div>

            {/* 3D Tilted Hardcover Book */}
            <div
              className="relative transition-transform duration-700 hover:scale-102"
              style={{ perspective: "1200px" }}
            >
              <div
                className="relative w-52 sm:w-60 h-76 sm:h-88 rounded-r-xl rounded-l-xs shadow-2xl shadow-black/70 transition-transform duration-500"
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
                    book.cover_gradient
                      ? `bg-gradient-to-br ${book.cover_gradient}`
                      : "bg-gradient-to-br from-stone-900 via-neutral-900 to-zinc-950"
                  }`}
                >
                  {/* Real Book Cover Image Overlay */}
                  {book.cover_image_url && (
                    <Image
                      src={book.cover_image_url}
                      alt={book.title}
                      fill
                      sizes="300px"
                      priority
                      unoptimized={
                        !book.cover_image_url.includes(".supabase.co") &&
                        !book.cover_image_url.startsWith("/")
                      }
                      className="absolute inset-0 w-full h-full object-cover object-center opacity-40 mix-blend-overlay"
                    />
                  )}

                  {/* Ornate Gold Foil Filigree Borders */}
                  <div className="absolute inset-3 border border-amber-400/40 rounded-lg pointer-events-none" />
                  <div className="absolute inset-4 border border-amber-500/20 rounded-md pointer-events-none" />

                  {/* Corner Ornaments */}
                  <div className="absolute top-4 left-4 w-3 h-3 border-t-2 border-l-2 border-amber-400/60" />
                  <div className="absolute top-4 right-4 w-3 h-3 border-t-2 border-r-2 border-amber-400/60" />
                  <div className="absolute bottom-4 left-4 w-3 h-3 border-b-2 border-l-2 border-amber-400/60" />
                  <div className="absolute bottom-4 right-4 w-3 h-3 border-b-2 border-r-2 border-amber-400/60" />

                  {/* Book Top Header */}
                  <div className="relative z-10 flex flex-col items-center pt-2 text-center">
                    <div className="w-8 h-8 rounded-full border border-amber-400/40 flex items-center justify-center text-amber-400/90 mb-1">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] tracking-[0.2em] uppercase text-amber-300/80 font-serif">
                      Taleora Edition
                    </span>
                  </div>

                  {/* Title & Author in Gold Foil */}
                  <div className="relative z-10 text-center my-auto px-2">
                    <h3 className="font-serif text-lg sm:text-xl font-bold tracking-normal text-amber-100 drop-shadow-md leading-tight line-clamp-3">
                      {book.title}
                    </h3>
                    <div className="w-10 h-[1px] bg-amber-400/50 mx-auto my-2" />
                    <p className="text-[11px] text-amber-200/80 font-serif italic tracking-wide">
                      {book.author?.name || "Independent Author"}
                    </p>
                  </div>

                  {/* Book Bottom Badge */}
                  <div className="relative z-10 text-center pb-1">
                    <span className="text-[8px] text-amber-400/70 uppercase tracking-widest font-mono">
                      Novella
                    </span>
                  </div>
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
            </div>
          </div>

          {/* Right Column: Book Details, Metadata & Actions */}
          <div className="lg:col-span-7 flex flex-col gap-5 text-left">
            {/* Title & Subtitle */}
            <div className="flex flex-col gap-2">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.12]">
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="font-serif italic text-sm sm:text-base text-muted-foreground">
                  &ldquo;{book.subtitle}&rdquo;
                </p>
              )}
              <p className="text-sm font-medium text-foreground/80">
                by{" "}
                <span className="font-semibold text-primary underline decoration-primary/30 underline-offset-4">
                  {book.author?.name || "Unknown Author"}
                </span>
              </p>
            </div>

            {/* Badges & Metrics Row */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs pt-1">
              {/* Star Rating Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <span>{(book.average_rating ?? 5.0).toFixed(1)}</span>
                <span className="text-muted-foreground font-normal">
                  ({book.ratings_count ?? 0} reviews)
                </span>
              </div>

              {/* Read Time & Chapter Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 border border-border/80 text-foreground/80 font-medium">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{book.estimated_read_time_minutes} min read</span>
                <span>·</span>
                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{book.total_chapters} Chapters</span>
              </div>

              {/* Genre Pills */}
              {book.genres?.map((genre) => (
                <Badge
                  key={genre.id}
                  variant="outline"
                  className="bg-secondary/40 border-border/70 text-foreground/80 text-xs px-2.5 py-1"
                >
                  #{genre.name}
                </Badge>
              ))}

              {book.featured && (
                <Badge
                  variant="accent"
                  className="bg-amber-500 text-zinc-950 font-bold text-xs px-2.5 py-1"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>

            {/* Quick Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              {/* Primary Read Action */}
              <Link href={readUrl}>
                <Button
                  size="lg"
                  className="h-12 px-6 rounded-xl font-semibold bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-white shadow-lg shadow-amber-500/25 border border-amber-400/30 gap-2 cursor-pointer transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Read Chapter 1</span>
                </Button>
              </Link>

              {/* Library Action Button */}
              <LibraryActionButton
                bookId={book.id}
                bookTitle={book.title}
                size="lg"
                className="h-12 px-5 rounded-xl border-border/80 bg-secondary/60 hover:bg-secondary cursor-pointer shadow-xs"
              />

              {/* Offline Download Button */}
              <OfflineDownloadButton
                bookId={book.id}
                bookTitle={book.title}
                size="lg"
                className="h-12 px-5 rounded-xl border-border/80 bg-secondary/60 hover:bg-secondary cursor-pointer shadow-xs"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2-Column Content Layout Below Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Story Synopsis & Chapter Index */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Story Synopsis Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm flex flex-col gap-4">
            <h3 className="font-serif text-xl font-bold text-foreground">
              Story Synopsis
            </h3>

            {book.description ? (
              <p className="font-serif text-sm sm:text-base text-foreground/85 leading-relaxed first-letter:float-left first-letter:text-4xl first-letter:font-bold first-letter:mr-2.5 first-letter:text-primary first-letter:font-serif">
                {book.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No synopsis currently provided for this literary work.
              </p>
            )}

            {formattedDate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border/60">
                <Calendar className="w-3.5 h-3.5" />
                <span>Originally published on {formattedDate}</span>
              </div>
            )}
          </div>

          {/* Chapter Index Section */}
          <ChapterList
            chapters={book.chapters}
            bookTitle={book.title}
            bookSlug={book.slug}
          />
        </div>

        {/* Right Column (4 cols): Author Spotlight & Reader Community Reviews */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Author Spotlight */}
          {book.author && <AuthorCard author={book.author} />}

          {/* Reader Community Reviews */}
          <BookReviewsSection
            bookId={book.id}
            bookTitle={book.title}
          />
        </div>
      </div>
    </div>
  );
}
