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
    <header className="sticky top-3 sm:top-4 z-50 w-full px-3 sm:px-6 pointer-events-none">
      <div className="max-w-5xl mx-auto h-14 sm:h-16 px-4 sm:px-6 rounded-full border border-amber-500/25 bg-background/85 dark:bg-[#0B0D11]/90 backdrop-blur-2xl shadow-2xl shadow-black/50 flex items-center justify-between gap-3 sm:gap-4 pointer-events-auto transition-all">
        {/* Left: Mobile Menu Trigger & Taleora Wireframe Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full border border-border/80 text-foreground/80 hover:bg-secondary hover:text-foreground cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>

          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-transform active:scale-98 focus:outline-none"
          >
            {/* Elegant Gold Wireframe Book Emblem */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-400 shadow-xs shadow-amber-500/20 group-hover:bg-amber-500/20 group-hover:border-amber-400 transition-all">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground group-hover:text-amber-400 transition-colors">
              Taleora
            </span>
          </Link>
        </div>

        {/* Center: Segmented Navigation Dock & Command Search */}
        <div className="flex items-center gap-2.5">
          {/* Segmented Nav Capsule */}
          <nav className="hidden md:flex items-center bg-secondary/50 dark:bg-stone-900/60 p-1 rounded-full border border-border/60">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 ${
                    isActive
                      ? "font-semibold bg-amber-500/20 text-amber-400 dark:text-amber-300 border border-amber-500/35 shadow-xs shadow-amber-500/10"
                      : "font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Compact Command-Bar Search Trigger */}
          <form
            onSubmit={handleSearch}
            className="hidden lg:flex items-center bg-secondary/40 hover:bg-secondary/65 focus-within:bg-card border border-border/70 focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-full h-8 px-3 transition-all w-40 xl:w-48"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground mr-1.5 shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground/75 w-full font-sans"
            />
            <kbd className="inline-flex items-center gap-0.5 px-1 py-0.2 text-[9px] font-mono text-muted-foreground/70 bg-background/60 border border-border/60 rounded shrink-0">
              ⌘K
            </kbd>
          </form>
        </div>

        {/* Right: Unified Action Dock */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Theme Toggle */}
          <ThemeToggle />

          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
          ) : user ? (
            <>
              {/* Reading Streak Capsule */}
              <div
                title={`${streakDays} Day Reading Streak`}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-xs shadow-amber-500/10 cursor-default"
              >
                <span className="font-mono">{streakDays}</span>
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
              </div>

              {/* Notification Bell */}
              <NotificationBell />

              {/* User Avatar & Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-amber-500/40 transition-all cursor-pointer focus:outline-none"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-950 via-stone-900 to-zinc-900 border border-amber-400/50 flex items-center justify-center text-xs font-bold text-amber-200 shadow-sm">
                    {initials}
                  </div>
                  <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:inline" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-border/80 bg-card/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-border/70 mb-1">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate font-mono">
                        {user.email}
                      </p>
                      {profile?.username && (
                        <span className="inline-block text-[10px] text-amber-400 mt-0.5 font-mono">
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
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 transition-colors mb-1"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          <span>Admin Workspace</span>
                        </Link>
                      )}

                      <Link
                        href="/studio"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        <Feather className="w-4 h-4" />
                        <span>Author Studio</span>
                      </Link>

                      <Link
                        href="/library"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <Library className="w-4 h-4 text-muted-foreground" />
                        <span>My Library</span>
                      </Link>

                      <Link
                        href="/goals"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span>Reading Goals</span>
                      </Link>

                      <Link
                        href="/settings"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <span>Preferences</span>
                      </Link>

                      <Link
                        href="/offline"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <HardDrive className="w-4 h-4 text-muted-foreground" />
                        <span>Offline Stories</span>
                      </Link>

                      <Link
                        href="/notifications"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <Bell className="w-4 h-4 text-muted-foreground" />
                        <span>All Notifications</span>
                      </Link>

                      <div className="border-t border-border/70 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut();
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-500 hover:bg-red-500/10 transition-colors w-full text-left cursor-pointer font-medium"
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
              <Link href="/login" prefetch={true}>
                <Button
                  size="sm"
                  className="rounded-full px-4 h-8 text-xs font-semibold bg-amber-500 text-stone-950 hover:bg-amber-400 border-none shadow-sm cursor-pointer"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
