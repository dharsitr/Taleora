"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  Flame,
  Bell,
  Menu,
  LogOut,
  Settings,
  Library,
  Target,
  ChevronDown,
  Feather,
  HardDrive,
  ShieldAlert,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/use-auth";
import { NotificationsDrawer } from "@/components/social";
import { getUnreadNotificationCount } from "@/lib/social/queries";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const { user, profile, signOut, isLoading } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Load unread notification count
  React.useEffect(() => {
    if (!user) return;
    let isMounted = true;
    getUnreadNotificationCount(user.id)
      .then((count) => {
        if (isMounted) setUnreadCount(count);
      })
      .catch((err) => console.error("Failed to load unread count:", err));

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/discover");
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Reader";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const streakDays = profile?.streak_days ?? 14;

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
        <form
          onSubmit={handleSearch}
          className="hidden sm:flex flex-1 max-w-md mx-6"
        >
          <Input
            placeholder="Search stories, authors, or genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="bg-secondary/40 border-border/70 focus:bg-card"
          />
        </form>

        {/* Right: Actions, Theme & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {isLoading ? (
            <div className="w-9 h-9 rounded-full bg-secondary animate-pulse" />
          ) : user ? (
            <>
              {/* PWA Install Action */}
              <PwaInstallButton className="hidden md:inline-flex" />

              {/* Author Studio CTA */}
              <Link href="/studio" prefetch={true}>
                <Button
                  size="sm"
                  variant="outline"
                  className="hidden sm:flex items-center gap-1.5 h-8 px-3 text-xs border-primary/40 text-primary hover:bg-primary/10 hover:border-primary transition-colors cursor-pointer"
                >
                  <Feather className="w-3.5 h-3.5" />
                  <span>Studio</span>
                </Button>
              </Link>

              {/* Reading Streak Pill */}
              <div
                title={`${streakDays} Day Reading Streak`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold cursor-default"
              >
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                <span className="hidden sm:inline">{streakDays}d Streak</span>
                <span className="sm:hidden">{streakDays}d</span>
              </div>

              {/* Notification Bell */}
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(true)}
                aria-label={
                  unreadCount > 0
                    ? `Activity notifications (${unreadCount} unread)`
                    : "Activity notifications"
                }
                className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* User Avatar & Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer focus:outline-none"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/40 to-accent/30 border border-border flex items-center justify-center text-xs font-bold text-foreground">
                    {initials}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:inline" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-border/70 mb-1">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate font-mono">
                        {user.email}
                      </p>
                      {profile?.username && (
                        <span className="inline-block text-[10px] text-primary mt-0.5">
                          @{profile.username}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5">
                      {(profile?.role === "admin" || profile?.role === "moderator") && (
                        <Link
                          href="/admin"
                          prefetch={true}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 transition-colors mb-1"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          <span>Admin Workspace</span>
                        </Link>
                      )}

                      <Link
                        href="/studio"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Feather className="w-4 h-4" />
                        <span>Author Studio</span>
                      </Link>

                      <Link
                        href="/library"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <Library className="w-4 h-4 text-muted-foreground" />
                        <span>My Library</span>
                      </Link>

                      <Link
                        href="/goals"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span>Reading Goals</span>
                      </Link>

                      <Link
                        href="/settings"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <span>Preferences</span>
                      </Link>

                      <Link
                        href="/offline"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <HardDrive className="w-4 h-4 text-muted-foreground" />
                        <span>Offline Stories</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          setIsNotificationsOpen(true);
                        }}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors w-full text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bell className="w-4 h-4 text-muted-foreground" />
                          <span>Notifications</span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      <div className="border-t border-border/70 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut();
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors w-full text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <PwaInstallButton size="sm" className="hidden sm:inline-flex" />
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-xs">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="text-xs">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onCountChange={setUnreadCount}
      />
    </header>
  );
}
