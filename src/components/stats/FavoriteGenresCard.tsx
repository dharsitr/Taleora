"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, BookMarked, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { GenreStat } from "@/types/stats";

interface FavoriteGenresCardProps {
  genres: GenreStat[];
}

const GENRE_COLORS = [
  "from-amber-500 to-amber-600 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "from-primary to-primary/80 bg-primary/10 text-primary border-primary/30",
  "from-emerald-500 to-emerald-600 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  "from-sky-500 to-sky-600 bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
  "from-purple-500 to-purple-600 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  "from-rose-500 to-rose-600 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
];

export function FavoriteGenresCard({ genres }: FavoriteGenresCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/80 bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Compass className="w-4 h-4" />
            <span>Favorite Literary Genres</span>
          </div>

          <Link
            href="/explore"
            className="text-xs font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <CardTitle className="text-xl font-bold font-serif text-foreground mt-1">
          Genre Distribution
        </CardTitle>
        <CardDescription className="text-xs">
          Your reading landscape across distinct fictional and narrative genres.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {genres.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-muted/30 border border-dashed border-border/80 my-2">
            <BookMarked className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No genres recorded yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start reading stories in Explore to discover and map your favorite literary genres.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-primary hover:underline"
            >
              <span>Browse Genres</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {genres.map((g, idx) => {
              const colorConfig = GENRE_COLORS[idx % GENRE_COLORS.length];
              const barGradient = colorConfig.split(" ").slice(0, 2).join(" ");
              const badgeStyle = colorConfig.split(" ").slice(2).join(" ");

              return (
                <div key={g.genreId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <Link
                      href={`/explore?genre=${g.slug}`}
                      className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <span>{g.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                        {g.booksCount} {g.booksCount === 1 ? "story" : "stories"}
                      </span>
                    </Link>
                    <span className="font-semibold text-muted-foreground">
                      {g.percentage}%
                    </span>
                  </div>

                  <div className="w-full bg-muted/80 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500`}
                      style={{ width: `${g.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
