"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Feather,
  Plus,
  BookOpen,
  Calendar,
  FileText,
  Sparkles,
  Edit,
  ExternalLink,
  Layers,
  UserCheck,
  Globe,
  Settings as SettingsIcon,
  Search,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import {
  getAuthorStats,
  getAuthorStories,
  getOrCreateAuthorProfile,
} from "@/lib/books/queries";
import {
  AuthorRow,
  AuthorStats,
  AuthorStoryWithCounts,
  BookStatus,
} from "@/types/books";
import {
  getAuthorStudioCache,
  setAuthorStudioCache,
} from "@/lib/books/cache";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export default function AuthorStudioPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Redirect to login if user is unauthenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?next=/studio");
    }
  }, [authLoading, user, router]);

  const cachedStudio = user ? getAuthorStudioCache(user.id) : null;

  const [author, setAuthor] = React.useState<AuthorRow | null>(
    cachedStudio?.author || null
  );
  const [stats, setStats] = React.useState<AuthorStats>(
    cachedStudio?.stats || {
      totalStories: 0,
      publishedChapters: 0,
      scheduledChapters: 0,
      draftChapters: 0,
      totalWords: 0,
    }
  );
  const [stories, setStories] = React.useState<AuthorStoryWithCounts[]>(
    cachedStudio?.stories || []
  );
  const [filterStatus, setFilterStatus] = React.useState<"all" | BookStatus>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [loading, setLoading] = React.useState(!cachedStudio);

  React.useEffect(() => {
    if (!user) return;

    // Seed from cache if available
    const cached = getAuthorStudioCache(user.id);
    if (cached) {
      setAuthor(cached.author);
      setStats(cached.stats);
      setStories(cached.stories);
      setLoading(false);
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        const defaultName =
          user.user_metadata?.full_name || user.email?.split("@")[0] || "Author";

        // Fetch author profile, statistics, and stories in parallel to eliminate waterfall
        const [authorProfile, authorStats, authorStories] = await Promise.all([
          getOrCreateAuthorProfile(user.id, defaultName),
          getAuthorStats(user.id),
          getAuthorStories(user.id),
        ]);

        if (isMounted) {
          setAuthor(authorProfile);
          setStats(authorStats);
          setStories(authorStories);
          setLoading(false);
          setAuthorStudioCache(user.id, {
            author: authorProfile,
            stats: authorStats,
            stories: authorStories,
          });
        }
      } catch (err) {
        console.error("Error loading author studio:", err);
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const filteredStories = React.useMemo(() => {
    return stories.filter((story) => {
      const matchesFilter = filterStatus === "all" || story.status === filterStatus;
      const matchesSearch =
        searchQuery.trim() === "" ||
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.genres?.some((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [stories, filterStatus, searchQuery]);

  const countByStatus = React.useMemo(() => {
    return {
      all: stories.length,
      published: stories.filter((s) => s.status === "published").length,
      draft: stories.filter((s) => s.status === "draft").length,
      archived: stories.filter((s) => s.status === "archived").length,
    };
  }, [stories]);

  const isLoading = authLoading || loading;

  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-amber-500/80 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-muted-foreground tracking-wide">
          Verifying Author Studio credentials...
        </p>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col gap-8 sm:gap-10">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Studio Header (Creative Sanctum) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/60 pb-8">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit text-amber-500 text-[11px] font-semibold uppercase tracking-widest">
            <Feather className="w-3.5 h-3.5 text-amber-500" />
            <span>Creative Sanctum • Author Studio</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            {author ? `Welcome back, ${author.name}` : "Creation Workspace"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Craft your novellas, manage serialized chapters, and schedule releases for your readers.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/studio/profile">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 rounded-full border-border/80 bg-background/50 hover:bg-secondary/80 backdrop-blur-md gap-2 cursor-pointer transition-all"
            >
              <SettingsIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold">Author Profile</span>
            </Button>
          </Link>
          <Link href="/studio/new">
            <Button
              size="sm"
              className="h-10 px-5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 text-stone-950 stroke-[2.5]" />
              <span className="text-xs font-bold tracking-wide">Write New Novella</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Author Profile Quick Capsule Banner */}
      {author && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-card/60 backdrop-blur-xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="absolute top-0 right-0 w-64 h-full bg-radial from-amber-500/10 to-transparent pointer-events-none" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 via-primary/10 to-transparent border border-amber-500/30 flex items-center justify-center text-xl font-serif font-bold text-amber-500 shadow-inner">
              {author.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-serif font-bold text-lg text-foreground">
                  {author.name}
                </span>
                <span className="text-xs text-amber-500/90 font-mono font-medium px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                  @{author.slug}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  Active Author
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 max-w-xl">
                {author.bio || "No synopsis provided. Personalize your author profile to tell readers about yourself."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 relative z-10">
            {author.website && (
              <a
                href={author.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border/80 bg-background/50 hover:bg-secondary text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Website</span>
                <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
              </a>
            )}
            <Link
              href="/studio/profile"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-secondary/80 hover:bg-secondary text-foreground text-xs font-semibold border border-border/70 transition-all cursor-pointer shadow-2xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Edit Bio & Links</span>
            </Link>
          </div>
        </div>
      )}

      {/* 4 Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 backdrop-blur-md p-5 flex flex-col justify-between hover:border-amber-500/40 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Novellas
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {stats.totalStories}
            </span>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span>Literary works created</span>
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 backdrop-blur-md p-5 flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Live Chapters
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-emerald-500 tracking-tight">
              {stats.publishedChapters}
            </span>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-semibold">Live</span>
              <span>to all active readers</span>
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 backdrop-blur-md p-5 flex flex-col justify-between hover:border-sky-500/40 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Scheduled Releases
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-sky-500 tracking-tight">
              {stats.scheduledChapters}
            </span>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span>In automated publishing queue</span>
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 backdrop-blur-md p-5 flex flex-col justify-between hover:border-amber-500/40 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Words Penned
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {stats.totalWords.toLocaleString()}
            </span>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-amber-500 font-semibold">{stats.draftChapters} drafts</span>
              <span>under composition</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stories Controls: Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/50 border border-border/80 backdrop-blur-md w-fit text-xs font-semibold overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap",
              filterStatus === "all"
                ? "bg-card text-foreground shadow-xs font-bold border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All Novellas ({countByStatus.all})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("published")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap",
              filterStatus === "published"
                ? "bg-emerald-500/15 text-emerald-400 shadow-xs font-bold border border-emerald-500/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Published ({countByStatus.published})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("draft")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap",
              filterStatus === "draft"
                ? "bg-amber-500/15 text-amber-400 shadow-xs font-bold border border-amber-500/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Drafts ({countByStatus.draft})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("archived")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap",
              filterStatus === "archived"
                ? "bg-card text-muted-foreground shadow-xs font-bold border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Archived ({countByStatus.archived})
          </button>
        </div>

        {/* Live Search Filter */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search your stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-full bg-secondary/40 border border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-border/70 bg-card/60 p-6 h-80 animate-pulse bg-secondary/30 flex flex-col justify-between"
            >
              <div className="w-full h-32 rounded-2xl bg-secondary/60 mb-4" />
              <div className="w-3/4 h-5 rounded-md bg-secondary/60 mb-2" />
              <div className="w-1/2 h-4 rounded-md bg-secondary/40" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredStories.length === 0 && (
        <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-amber-500/30 bg-card/40 backdrop-blur-md flex flex-col items-center gap-5 max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
            <Feather className="w-10 h-10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="font-serif text-2xl font-bold text-foreground">
              {stories.length === 0
                ? "Start Your Literary Journey"
                : searchQuery
                ? "No Novellas Match Your Search"
                : `No ${filterStatus} novellas found`}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
              {stories.length === 0
                ? "Begin crafting your serialized novellas today. Publish chapters, schedule automated releases, and captivate readers."
                : "Try resetting your search query or switching tabs to view other works."}
            </p>
          </div>
          <Link href="/studio/new">
            <Button
              size="sm"
              className="h-10 px-5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)] gap-2 mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Your First Novella</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Modern Stories Bento Grid */}
      {!isLoading && filteredStories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => {
            const coverGradient =
              story.cover_gradient || "from-amber-900 via-stone-900 to-zinc-950";
            const primaryGenre = story.genres?.[0]?.name || "Fiction";
            const publishedPct = story.chaptersCount > 0
              ? Math.round((story.publishedChaptersCount / story.chaptersCount) * 100)
              : 0;

            return (
              <div
                key={story.id}
                className="group relative rounded-3xl border border-border/80 bg-card/80 backdrop-blur-md overflow-hidden flex flex-col justify-between hover:border-amber-500/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition-all duration-300"
              >
                {/* Top Section: Visual Book Cover Banner */}
                <div>
                  <div
                    className={cn(
                      "h-44 w-full p-4 flex flex-col justify-between relative overflow-hidden text-white bg-gradient-to-br",
                      coverGradient
                    )}
                  >
                    {story.cover_image_url && (
                      <Image
                        src={story.cover_image_url}
                        alt={story.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        unoptimized={
                          !story.cover_image_url.includes(".supabase.co") &&
                          !story.cover_image_url.startsWith("/")
                        }
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 group-hover:from-black/80 transition-colors" />

                    {/* Book Spine 3D Crease Effect on left */}
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/60 via-white/20 to-transparent z-20 pointer-events-none" />

                    {/* Top Badges: Status & Release Cadence */}
                    <div className="relative z-10 flex items-start justify-between gap-2">
                      <Badge
                        variant="warm"
                        className={cn(
                          "backdrop-blur-md text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                          story.status === "published" && "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
                          story.status === "draft" && "bg-amber-500/20 text-amber-300 border-amber-500/40",
                          story.status === "archived" && "bg-zinc-800/80 text-zinc-300 border-zinc-600/40"
                        )}
                      >
                        {story.status}
                      </Badge>

                      {story.release_schedule && story.release_schedule !== "immediate" && (
                        <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-medium capitalize text-white/90">
                          {story.release_schedule} Cadence
                        </span>
                      )}
                    </div>

                    {/* Bottom of Banner: Genre & Read Time */}
                    <div className="relative z-10 flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white/90">
                        {primaryGenre}
                      </span>
                      {story.estimated_read_time_minutes ? (
                        <span className="flex items-center gap-1 text-[11px] text-white/80">
                          <Clock className="w-3 h-3" />
                          {story.estimated_read_time_minutes} min
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col gap-3.5">
                    <div>
                      <Link
                        href={`/studio/${story.id}`}
                        className="font-serif text-xl font-bold text-foreground group-hover:text-amber-400 transition-colors line-clamp-1 block focus:outline-hidden"
                      >
                        {story.title}
                      </Link>
                      {story.subtitle && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-medium">
                          {story.subtitle}
                        </p>
                      )}
                    </div>

                    {story.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {story.description}
                      </p>
                    )}

                    {/* Chapter Progress Bar */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium">
                          Publishing Progress
                        </span>
                        <span className="font-bold text-foreground">
                          {story.publishedChaptersCount} / {story.chaptersCount} chapters ({publishedPct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-secondary/80 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${Math.min(publishedPct, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Counts Row */}
                    <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-secondary/40 border border-border/60 text-xs">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Chapters
                        </span>
                        <span className="font-bold text-foreground mt-0.5">
                          {story.chaptersCount}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Queued
                        </span>
                        <span className="font-bold text-sky-500 mt-0.5">
                          {story.scheduledChaptersCount}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Total Words
                        </span>
                        <span className="font-bold text-foreground mt-0.5">
                          {story.totalWords.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Dock */}
                <div className="px-5 py-4 bg-secondary/20 border-t border-border/70 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Link href={`/studio/${story.id}/chapters/new`}>
                      <Button
                        size="sm"
                        className="h-8 px-3 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 gap-1.5 text-xs font-semibold cursor-pointer transition-all"
                      >
                        <Feather className="w-3.5 h-3.5" />
                        <span>Write Chapter</span>
                      </Button>
                    </Link>
                    <Link href={`/studio/${story.id}/chapters`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded-full border-border/80 bg-background/50 hover:bg-secondary gap-1.5 text-xs font-medium cursor-pointer transition-all"
                      >
                        <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Chapters</span>
                      </Button>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/studio/${story.id}`}
                      title="Edit Story Details"
                      className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    {story.status === "published" && (
                      <Link
                        href={`/books/${story.slug}`}
                        title="View Public Story Page"
                        className="p-2 rounded-full text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

