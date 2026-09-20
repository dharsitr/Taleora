"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Library,
  BookMarked,
  Target,
  Settings,
  Sparkles,
  CheckCircle2,
  Feather,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDailyReadingProgress } from "@/lib/stats/use-daily-reading-progress";
import { useAuth } from "@/lib/auth/use-auth";

export interface NavItemDef {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const MAIN_NAV_ITEMS: NavItemDef[] = [
  { label: "Discover", href: "/", icon: Compass },
  { label: "My Library", href: "/library", icon: Library },
  { label: "Saved Bookmarks", href: "/bookmarks", icon: BookMarked },
  { label: "Reading Goals", href: "/goals", icon: Target },
  { label: "Preferences", href: "/settings", icon: Settings },
];

export const AUTHOR_NAV_ITEMS: NavItemDef[] = [
  { label: "Author Studio", href: "/studio", icon: Feather },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const {
    minutesReadToday,
    dailyGoalMinutes,
    booksCompleted,
    progressPercent,
    hasGoal,
  } = useDailyReadingProgress();

  const handleGoalCardClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setIsRedirecting(true);
      router.push(`/login?next=/goals&notice=${encodeURIComponent("Sign in to view your reading goals")}`);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-xs p-4 gap-6 shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation Section */}
      <div className="flex flex-col gap-1">
        <span className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Story Reader
        </span>
        <nav className="flex flex-col gap-1 mt-2">
          {MAIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            const itemHref =
              !user && item.href === "/goals"
                ? `/login?next=/goals&notice=${encodeURIComponent("Sign in to view your reading goals")}`
                : item.href;

            return (
              <Link
                key={item.href}
                href={itemHref}
                prefetch={true}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary border border-border text-foreground/70">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Creator Studio Section - only visible for logged in authors */}
      {user && (
        <div className="flex flex-col gap-1">
          <span className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Creation Studio
          </span>
          <nav className="flex flex-col gap-1 mt-2">
            {AUTHOR_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Daily Reading Progress Card */}
      <Link
        href={user ? "/goals" : `/login?next=/goals&notice=${encodeURIComponent("Sign in to view your reading goals")}`}
        onClick={handleGoalCardClick}
        prefetch={true}
        className="mt-auto p-4 rounded-xl border border-border/70 bg-secondary/40 flex flex-col gap-3 hover:border-primary/50 transition-all cursor-pointer group"
        title={user ? (hasGoal ? "View and adjust Reading Goals" : "Set your Daily Reading Goal") : "Sign in to view your reading goals"}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-primary/15 text-primary group-hover:scale-105 transition-transform">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-foreground">
              Daily Reading Goal
            </span>
          </div>
          {!user ? (
            <span className="text-[11px] font-semibold text-primary">
              {isRedirecting ? "Redirecting..." : "Sign in to view"}
            </span>
          ) : (
            <span className="text-xs font-bold text-primary">
              {progressPercent}%
            </span>
          )}
        </div>

        {!user ? (
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Track streaks & habits</span>
            <span className="text-xs text-primary font-medium group-hover:underline flex items-center gap-1">
              Sign In &rarr;
            </span>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="w-full bg-border/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{minutesReadToday}m / {dailyGoalMinutes}m goal</span>
              <span className="flex items-center gap-1 text-foreground/80">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {booksCompleted} books
              </span>
            </div>
          </>
        )}
      </Link>

      {/* Literary Note */}
      <div className="text-[11px] text-muted-foreground px-2 italic text-center leading-relaxed">
        &ldquo;Words breathe life into unseen worlds.&rdquo;
      </div>
    </aside>
  );
}
