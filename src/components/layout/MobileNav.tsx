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
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MAIN_NAV_ITEMS, AUTHOR_NAV_ITEMS } from "./Sidebar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useDailyReadingProgress } from "@/lib/stats/use-daily-reading-progress";
import { useAuth } from "@/lib/auth/use-auth";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const {
    minutesReadToday,
    dailyGoalMinutes,
    progressPercent,
  } = useDailyReadingProgress();
  const { user, profile, signOut } = useAuth();

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

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Reader";

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

            {/* User Profile / Auth State Card */}
            <div className="my-4 p-3 rounded-lg bg-secondary/50 border border-border/60 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-semibold">
                    {profile?.streak_days ?? 14} Day Streak
                  </span>
                </div>
                <ThemeToggle />
              </div>

              {user ? (
                <div className="pt-2 border-t border-border/60">
                  <p className="text-xs font-bold text-foreground truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate font-mono">
                    {user.email}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-secondary text-foreground text-xs font-medium border border-border hover:bg-secondary/80 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href="/signup"
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register</span>
                  </Link>
                </div>
              )}
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

              {/* Creator Studio for Mobile */}
              <div className="pt-2 mt-2 border-t border-border/60 flex flex-col gap-1">
                <span className="px-3.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Creation Studio
                </span>
                {AUTHOR_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground/80 hover:bg-secondary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-primary" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Sign Out Button if Authenticated */}
            {user && (
              <div className="py-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    signOut();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 w-full transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            {/* Mini Goal Footer */}
            <Link
              href="/goals"
              onClick={onClose}
              className="pt-3 border-t border-border text-xs text-muted-foreground block hover:text-foreground transition-colors cursor-pointer"
            >
              <div className="flex justify-between mb-1.5 font-medium text-foreground">
                <span>Daily Reading</span>
                <span>
                  {minutesReadToday} / {dailyGoalMinutes}m
                </span>
              </div>
              <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(progressPercent, 100)}%`,
                  }}
                />
              </div>
            </Link>
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
