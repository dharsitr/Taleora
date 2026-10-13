"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/use-auth";
import { NotificationBell } from "@/components/social";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const { user, profile, signOut, isLoading } = useAuth();

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
  const streakDays = profile?.streak_days ?? 0;

  const navItems = [
    { label: "Explore", href: "/discover" },
    { label: "Library", href: "/library" },
    { label: "Studio", href: "/studio" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65 transition-all shadow-xs">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto gap-4">
        {/* Left: Mobile Menu Trigger & Taleora Logo */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-border/80 text-foreground/80 hover:bg-secondary hover:text-foreground cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-transform active:scale-98"
          >
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 via-primary to-amber-700 text-white shadow-sm shadow-amber-500/25 border border-amber-400/30 group-hover:shadow-md group-hover:shadow-amber-500/40 transition-all">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                Taleora
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-semibold tracking-wider uppercase rounded bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                Reader
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with Glowing Active Pill */}
          <nav className="hidden md:flex items-center gap-1.5 ml-2 lg:ml-4">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all duration-200 ${
                    isActive
                      ? "font-semibold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 shadow-xs shadow-amber-500/10"
                      : "font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Sleek Quick Story Search */}
        <form
          onSubmit={handleSearch}
          className="hidden sm:flex flex-1 max-w-md mx-2 lg:mx-6"
        >
          <div className="relative w-full flex items-center bg-secondary/50 hover:bg-secondary/75 focus-within:bg-card border border-border/70 focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-full h-9 px-3.5 transition-all">
            <Search className="w-3.5 h-3.5 text-muted-foreground mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search stories, authors, or genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground/80 w-full"
            />
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70 bg-background/50 border border-border/60 rounded-md shrink-0">
              ⌘K
            </kbd>
          </div>
        </form>

        {/* Right: Actions, Theme & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Theme Toggle */}
          <ThemeToggle />

          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
          ) : user ? (
            <>
              {/* PWA Install Action */}
              <PwaInstallButton className="hidden md:inline-flex" />

              {/* Author Studio CTA */}
              <Link href="/studio" prefetch={true}>
                <Button
                  size="sm"
                  variant="outline"
                  className="hidden sm:flex items-center gap-1.5 h-8 px-3 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/30 rounded-full font-medium transition-colors cursor-pointer"
                >
                  <Feather className="w-3.5 h-3.5" />
                  <span>Studio</span>
                </Button>
              </Link>

              {/* Reading Streak Pill */}
              <div
                title={`${streakDays} Day Reading Streak`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-semibold cursor-default"
              >
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                <span className="hidden sm:inline">{streakDays}d Streak</span>
                <span className="sm:hidden">{streakDays}d</span>
              </div>

              {/* Standalone Notification Component */}
              <NotificationBell />

              {/* User Avatar & Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-amber-500/30 transition-all cursor-pointer focus:outline-none"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-950 via-stone-900 to-zinc-900 border border-amber-400/40 flex items-center justify-center text-xs font-bold text-amber-200 shadow-xs">
                    {initials}
                  </div>
                  <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:inline" />
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

                      <Link
                        href="/notifications"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors w-full text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bell className="w-4 h-4 text-muted-foreground" />
                          <span>All Notifications</span>
                        </div>
                      </Link>

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
                <Button variant="ghost" size="sm" className="text-xs hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="sm"
                  className="text-xs font-semibold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-md shadow-amber-600/25 border border-amber-500/30"
                >
                  Start Reading
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
