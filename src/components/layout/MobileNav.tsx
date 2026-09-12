"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Library,
  BookOpen,
  Target,
  X,
  Flame,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MAIN_NAV_ITEMS } from "./Sidebar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { MOCK_READING_STATS } from "@/lib/mock-data";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const stats = MOCK_READING_STATS;

  // Prevent background scrolling when mobile drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Slide-out Mobile Navigation Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-4/5 max-w-xs bg-background border-r border-border p-6 shadow-xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-base">
                  T
                </div>
                <span className="font-serif text-lg font-bold">Taleora</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Streak card */}
            <div className="my-4 p-3 rounded-lg bg-secondary/50 border border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-xs font-semibold">14 Day Streak</span>
              </div>
              <ThemeToggle />
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-1.5 flex-1 mt-2">
              {MAIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground/80 hover:bg-secondary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Mini Goal Footer */}
            <div className="pt-4 border-t border-border text-xs text-muted-foreground">
              <div className="flex justify-between mb-1.5 font-medium text-foreground">
                <span>Daily Reading</span>
                <span>{stats.minutesReadToday} / {stats.dailyGoalMinutes}m</span>
              </div>
              <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full"
                  style={{
                    width: `${Math.min(
                      (stats.minutesReadToday / stats.dailyGoalMinutes) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Nav Bar for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-3 py-2 flex items-center justify-around shadow-lg">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs transition-colors",
            pathname === "/" ? "text-primary font-semibold" : "text-muted-foreground"
          )}
        >
          <Compass className="w-5 h-5" />
          <span>Discover</span>
        </Link>

        <Link
          href="/library"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs transition-colors",
            pathname.startsWith("/library")
              ? "text-primary font-semibold"
              : "text-muted-foreground"
          )}
        >
          <Library className="w-5 h-5" />
          <span>Library</span>
        </Link>

        <Link
          href="/explore"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs transition-colors",
            pathname.startsWith("/explore")
              ? "text-primary font-semibold"
              : "text-muted-foreground"
          )}
        >
          <BookOpen className="w-5 h-5" />
          <span>Explore</span>
        </Link>

        <Link
          href="/goals"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs transition-colors",
            pathname.startsWith("/goals")
              ? "text-primary font-semibold"
              : "text-muted-foreground"
          )}
        >
          <Target className="w-5 h-5" />
          <span>Goals</span>
        </Link>

        <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs transition-colors",
            pathname.startsWith("/settings")
              ? "text-primary font-semibold"
              : "text-muted-foreground"
          )}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </div>
    </>
  );
}
