import * as React from "react";
import Link from "next/link";
import { BookOpen, Feather } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/80 bg-background/50 text-foreground py-10 px-4 sm:px-6 lg:px-8 transition-colors mt-auto pb-24 md:pb-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-serif text-lg font-bold">Taleora</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm">
              Designed for readers who cherish immersive narratives, distraction-free typography, and quiet hours with great books.
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <Link href="/library" className="hover:text-primary transition-colors">
              Library
            </Link>
            <Link href="/explore" className="hover:text-primary transition-colors">
              Explore Shelves
            </Link>
            <Link href="/goals" className="hover:text-primary transition-colors">
              Reading Streaks
            </Link>
            <Link href="/settings" className="hover:text-primary transition-colors">
              Reader Settings
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/50 text-[11px] text-muted-foreground">
          <p className="flex items-center gap-1">
            <span>Crafted with</span>
            <Feather className="w-3.5 h-3.5 text-primary" />
            <span>for story lovers everywhere.</span>
          </p>
          <p>© {new Date().getFullYear()} Taleora. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
