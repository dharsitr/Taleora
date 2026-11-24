"use client";

import * as React from "react";
import { Sparkles, ChevronDown, ChevronUp, BookOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChapterRecapCardProps {
  chapterNumber: number;
  prevChapterTitle?: string;
  recapText?: string;
}

export function ChapterRecapCard({
  chapterNumber,
  prevChapterTitle,
  recapText,
}: ChapterRecapCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Default atmospheric synopsis if no custom recap is provided
  const displayText =
    recapText ||
    `In the preceding events of Chapter ${chapterNumber - 1}${
      prevChapterTitle ? ` ("${prevChapterTitle}")` : ""
    }, delicate alliances were forged in the shadows, leaving behind lingering questions of loyalty as dawn broke over the city.`;

  return (
    <div className="mb-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 backdrop-blur-md p-3.5 sm:p-4 text-xs transition-all shadow-xs">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2 text-amber-500 font-serif font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Previously in Chapter {chapterNumber - 1}...</span>
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-amber-500 p-0.5 transition-colors"
          aria-label={isExpanded ? "Collapse Recap" : "Expand Recap"}
        >
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <p className="mt-2 text-foreground/80 font-serif italic leading-relaxed animate-in fade-in duration-200 pl-5 border-l-2 border-amber-500/40">
          {displayText}
        </p>
      )}
    </div>
  );
}
