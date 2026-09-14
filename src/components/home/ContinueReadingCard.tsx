import * as React from "react";
import Link from "next/link";
import { BookMarked, Play, Clock } from "lucide-react";
import { MOCK_CURRENT_READ } from "@/lib/mock-data";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function ContinueReadingCard() {
  const story = MOCK_CURRENT_READ;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-primary" />
          <span>Jump Back In</span>
        </h2>
        <span className="text-xs text-muted-foreground">
          Last read {story.lastReadAt}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:border-primary/40 transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Aesthetic Book Spine & Cover Preview */}
          <div
            className={`w-20 h-28 sm:w-24 sm:h-32 shrink-0 rounded-lg bg-gradient-to-br ${story.coverGradient} p-3 flex flex-col justify-between shadow-md border border-white/10 text-white relative overflow-hidden`}
          >
            {/* Book Spine Accent */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/20" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300">
              Ch. {story.currentChapter}
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-xs font-bold leading-tight line-clamp-2">
                {story.title}
              </span>
              <span className="text-[9px] text-white/80 line-clamp-1 mt-0.5">
                {story.author}
              </span>
            </div>
          </div>

          {/* Details & Progress */}
          <div className="flex-1 flex flex-col gap-3 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">{story.genre}</Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>Chapter {story.currentChapter} of {story.chaptersCount}</span>
              </div>
            </div>

            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground hover:text-primary transition-colors">
                {story.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {story.subtitle}
              </p>
            </div>

            {/* Reading Progress */}
            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">Reading Progress</span>
                <span className="text-primary font-bold">{story.progressPercentage}%</span>
              </div>
              <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${story.progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Estimated ~45m left in current section
              </span>
              <Link
                href="/read/the-cartographer-of-lost-constellations"
                className="sm:ml-auto"
              >
                <Button size="sm" className="gap-2 cursor-pointer">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume Chapter {story.currentChapter}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
