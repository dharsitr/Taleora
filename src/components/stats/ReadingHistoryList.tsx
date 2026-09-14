"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { History, BookOpen, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReadingHistoryItem } from "@/types/stats";

interface ReadingHistoryListProps {
  history: ReadingHistoryItem[];
}

function formatRelativeTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffHours === 0) return "Just now";
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export function ReadingHistoryList({ history }: ReadingHistoryListProps) {
  return (
    <Card className="border-border/80 bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <History className="w-4 h-4" />
          <span>Reading History & Timeline</span>
        </div>
        <CardTitle className="text-xl font-bold font-serif text-foreground mt-1">
          Recent Reading Log
        </CardTitle>
        <CardDescription className="text-xs">
          Chronological record of books and chapters read across your sessions.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {history.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-muted/20 border border-dashed border-border/80">
            <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-serif text-base font-semibold text-foreground">
              Your reading log is quiet
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Open a story in Taleora to begin building your personalized reading history and tracking your milestones.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <span>Explore Stories</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {history.map((item) => (
              <div
                key={item.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-muted/20 -mx-4 px-4 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Book Cover Thumbnail */}
                  <div className="relative w-11 h-15 rounded-md overflow-hidden bg-muted shrink-0 border border-border/70 shadow-xs">
                    {item.coverImageUrl ? (
                      <Image
                        src={item.coverImageUrl}
                        alt={item.bookTitle}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-700 to-amber-950 flex items-center justify-center p-1 text-center">
                        <span className="font-serif text-[8px] font-bold text-amber-200 line-clamp-2">
                          {item.bookTitle}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title and Chapter Meta */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/books/${item.bookSlug}`}
                      className="font-serif font-bold text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.bookTitle}
                    </Link>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="truncate">
                        {item.chapterTitle ? item.chapterTitle : `Chapter ${item.chapterNumber}`}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-muted-foreground/70" />
                        <span>{item.durationMinutes}m read</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${Math.min(100, item.progressPercentage)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {Math.round(item.progressPercentage)}%
                      </span>
                      {item.isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Finished</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Timestamp & Resume Action */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                  <Link href={`/read/${item.bookSlug}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all gap-1"
                    >
                      <span>Continue</span>
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
