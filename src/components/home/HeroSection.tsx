import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, BookOpen, Quote } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LITERARY_QUOTES } from "@/lib/constants";

export function HeroSection() {
  const quote = LITERARY_QUOTES[0];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-secondary/50 via-card to-background p-6 sm:p-8 md:p-10 shadow-sm">
      {/* Subtle decorative glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex-1 max-w-2xl flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to Taleora · The Art of Reading</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
            Every page turned is a new world awakened.
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Immerse yourself in thoughtfully curated tales, novels, and reflective essays.
            Designed with warm paper tones, refined typography, and zero distractions for true story lovers.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/library">
              <Button size="lg" className="gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Open Library</span>
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline" size="lg" className="gap-2">
                <span>Browse Shelves</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Daily Literary Quote Widget */}
        <div className="w-full lg:w-80 rounded-xl border border-border/70 bg-card/80 backdrop-blur-xs p-5 flex flex-col gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-primary">
            <Quote className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Thought of the Day
            </span>
          </div>
          <p className="font-serif italic text-sm text-foreground/90 leading-relaxed">
            &ldquo;{quote.quote}&rdquo;
          </p>
          <span className="text-xs text-muted-foreground self-end font-medium">
            — {quote.author}
          </span>
        </div>
      </div>
    </section>
  );
}
