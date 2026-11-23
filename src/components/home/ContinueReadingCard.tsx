import * as React from "react";
import Link from "next/link";
import { BookMarked, Play, Clock, Sparkles, Flame } from "lucide-react";
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
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <BookMarked className="w-5 h-5 text-amber-500" />
          <span>Jump Back In</span>
        </h2>
        <span className="text-xs text-muted-foreground/80 font-medium">Last read {lastRead}</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/80 dark:border-white/10 bg-card/85 dark:bg-[#12151D]/85 backdrop-blur-2xl p-5 sm:p-6 shadow-xl hover:border-amber-500/40 hover:shadow-2xl transition-all duration-300 group">
        {/* Subtle Ambient Glow on Hover */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/15 transition-colors" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5 sm:gap-6">
          {/* 3D Tactile Book Thumbnail */}
          <div
            className={`w-20 h-28 sm:w-24 sm:h-32 shrink-0 rounded-xl bg-gradient-to-br ${gradient} p-3.5 flex flex-col justify-between shadow-xl border border-white/15 text-white relative overflow-hidden group-hover:scale-102 transition-transform duration-300`}
          >
            {/* Tactile Book Spine Crease */}
            <div className="absolute left-0 top-0 bottom-0 w-2.5 book-spine-shadow z-10 pointer-events-none" />
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 z-10 pointer-events-none" />

            {/* Crimson Satin Ribbon Corner Notch */}
            <div className="absolute top-0 right-2 w-2.5 h-6 crimson-satin-ribbon shadow-sm pointer-events-none rounded-b-xs" />

            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 relative z-10">
              Ch. {chapterNum}
            </span>
            <div className="flex flex-col relative z-10">
              <span className="font-serif text-xs font-bold leading-tight line-clamp-2 drop-shadow-sm">
                {book.title}
              </span>
            </div>
          </div>

          {/* Reading Details & Progress */}
          <div className="flex-1 flex flex-col gap-3.5 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold">
                In Progress
              </Badge>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Live Serial</span>
              </span>

              <span className="text-[11px] text-muted-foreground/75 hidden sm:inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>42 readers online</span>
              </span>
            </div>

            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground group-hover:text-amber-400 transition-colors">
                {book.title}
              </h3>
              {book.subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {book.subtitle}
                </p>
              )}
            </div>

            {/* Multi-Metric Progress Bar */}
            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chapter {chapterNum} of {book.total_chapters}</span>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-amber-400 font-semibold">~18m left</span>
                </span>
                <span className="text-amber-500 font-mono font-bold">{pct}%</span>
              </div>
              <div className="w-full bg-secondary/80 dark:bg-stone-800/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-border/40">
                <div
                  className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 h-full rounded-full shadow-sm shadow-amber-500/40 transition-all duration-500"
                  style={{ width: `${Math.max(pct, 4)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="w-full md:w-auto flex items-center justify-end shrink-0 pt-2 md:pt-0">
            <Link href={`/read/${book.slug}`} className="w-full md:w-auto">
              <Button
                size="lg"
                className="w-full md:w-auto h-11 px-5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-white shadow-xl shadow-amber-500/25 border border-amber-400/40 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Chapter {chapterNum}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
