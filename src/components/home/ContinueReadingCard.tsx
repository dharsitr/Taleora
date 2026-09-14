import * as React from "react";
import Link from "next/link";
import { BookMarked, Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface ReadingProgress {
  progress_percentage: number;
  last_read_at: string;
  book: {
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    cover_gradient: string | null;
    cover_accent: string | null;
    total_chapters: number;
  } | null;
  chapter: { chapter_number: number } | null;
}

interface Props {
  progress: ReadingProgress;
}

export function ContinueReadingCard({ progress }: Props) {
  const book = progress.book;
  if (!book) return null;

  const chapterNum = progress.chapter?.chapter_number ?? 1;
  const pct = Math.round(progress.progress_percentage);
  const gradient = book.cover_gradient || "from-amber-700 via-stone-800 to-zinc-950";
  const lastRead = new Date(progress.last_read_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-primary" />
          <span>Jump Back In</span>
        </h2>
        <span className="text-xs text-muted-foreground">Last read {lastRead}</span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:border-primary/40 transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Book Cover */}
          <div
            className={`w-20 h-28 sm:w-24 sm:h-32 shrink-0 rounded-lg bg-gradient-to-br ${gradient} p-3 flex flex-col justify-between shadow-md border border-white/10 text-white relative overflow-hidden`}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/20" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300">
              Ch. {chapterNum}
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-xs font-bold leading-tight line-clamp-2">
                {book.title}
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3 w-full">
            <Badge variant="accent">In Progress</Badge>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                {book.title}
              </h3>
              {book.subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {book.subtitle}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Chapter {chapterNum} of {book.total_chapters}
                </span>
                <span className="text-primary font-bold">{pct}%</span>
              </div>
              <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <Link href={`/read/${book.slug}`}>
                <Button size="sm" className="gap-2 cursor-pointer">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume Chapter {chapterNum}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
