"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Search, Flame, Bell, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Input } from "@/components/ui/Input";

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Left: Mobile Menu Trigger & Taleora Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-border text-foreground/80 hover:bg-secondary hover:text-foreground cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-transform active:scale-98"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm shadow-primary/20 group-hover:shadow-md group-hover:shadow-primary/30 transition-all">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  Taleora
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-semibold tracking-wider uppercase rounded bg-primary/10 text-primary border border-primary/20">
                  Reader
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Quick Story Search */}
        <div className="hidden sm:flex flex-1 max-w-md mx-6">
          <Input
            placeholder="Search stories, authors, or genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="bg-secondary/40 border-border/70 focus:bg-card"
          />
        </div>

        {/* Right: Reading Streak & Theme & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak Indicator */}
          <div
            title="14-day reading streak! Keep the flame alive."
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold cursor-default"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
            <span className="hidden sm:inline">14d Streak</span>
            <span className="sm:hidden">14d</span>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Subtle Notifications placeholder */}
          <button
            type="button"
            aria-label="Story updates & bookmarks"
            className="relative hidden md:flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
          </button>

          {/* Reader Profile Pill */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary/30 to-accent/20 border border-border flex items-center justify-center text-xs font-bold text-foreground">
              DL
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
