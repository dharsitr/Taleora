"use client";

import * as React from "react";
import Link from "next/link";
import { Star, Clock, BookOpen, Bookmark } from "lucide-react";
import { Story } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
  const [isSaved, setIsSaved] = React.useState(false);

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5">
      {/* Visual Cover Banner */}
      <div
        className={`h-44 w-full bg-gradient-to-br ${story.coverGradient} p-5 flex flex-col justify-between text-white relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

        {/* Decorative corner glyphs */}
        <div className="relative z-10 flex items-start justify-between">
          <Badge
            variant="warm"
            className="bg-black/40 text-white border-white/20 backdrop-blur-xs text-[11px]"
          >
            {story.genre}
          </Badge>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
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

        {/* Cover Title Accent */}
        <div className="relative z-10">
          <h4 className="font-serif text-lg font-bold leading-snug line-clamp-2 text-white drop-shadow-xs">
            {story.title}
          </h4>
          <span className="text-xs text-white/80 line-clamp-1 mt-0.5">
            by {story.author}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 flex flex-col p-4 sm:p-5 gap-3">
        {/* Rating & Read time */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-500" />
            <span>{story.rating.toFixed(1)}</span>
            <span className="text-muted-foreground font-normal">
              ({story.reviewsCount})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{story.readTimeMinutes} min read</span>
          </div>
        </div>

        {/* Excerpt */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {story.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
          {story.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Card CTA */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {story.chaptersCount} Chapters
          </span>
          <Link href="/library">
            <Button variant="ghost" size="sm" className="text-xs gap-1.5 hover:text-primary">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read Story</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
