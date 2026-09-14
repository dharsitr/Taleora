import * as React from "react";
import Link from "next/link";
import { Clock, FileText, CheckCircle2, BookOpen, ArrowRight } from "lucide-react";
import { ChapterRow } from "@/types/books";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface ChapterListProps {
  chapters: ChapterRow[];
  bookTitle: string;
  bookSlug?: string;
}

export function ChapterList({ chapters, bookTitle, bookSlug }: ChapterListProps) {
  if (!chapters || chapters.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center flex flex-col items-center gap-3">
        <BookOpen className="w-8 h-8 text-muted-foreground/60" />
        <h4 className="font-serif text-base font-semibold text-foreground">
          No Chapters Published Yet
        </h4>
        <p className="text-xs text-muted-foreground max-w-sm">
          The author is currently preparing transcripts and passages for {bookTitle}. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
          <span>Chapters & Transcripts</span>
          <span className="text-xs font-sans font-normal text-muted-foreground">
            ({chapters.length} available)
          </span>
        </h3>
        <span className="text-[11px] text-muted-foreground font-medium">
          Sequential Reading Order
        </span>
      </div>

      <div className="divide-y divide-border/60 rounded-xl border border-border bg-card overflow-hidden">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-5 gap-3 hover:bg-secondary/40 transition-colors group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {chapter.chapter_number}
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {chapter.title}
                </span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{chapter.estimated_read_minutes} min read</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{chapter.word_count.toLocaleString()} words</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <Badge
                variant="warm"
                className="text-[10px] uppercase tracking-wider font-semibold py-0.5"
              >
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                Published
              </Badge>

              {bookSlug && (
                <Link href={`/read/${bookSlug}/${chapter.slug}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1 hover:text-primary cursor-pointer"
                  >
                    <span>Read</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
