"use client";

import * as React from "react";
import Link from "next/link";
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

  const filteredStories = stories.filter((story) => {
    if (filterStatus === "all") return true;
    return story.status === filterStatus;
  });

  const isLoading = authLoading || loading;

  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Verifying Author Studio access...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-16">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
            <Feather className="w-4 h-4" />
            <span>Author Studio & Publishing</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Creation Workspace
          </h1>
          <p className="text-sm text-muted-foreground">
            Craft your novellas, manage chapters, and schedule releases for readers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/studio/profile">
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
              <SettingsIcon className="w-4 h-4 text-muted-foreground" />
              <span>Author Profile</span>
            </Button>
          </Link>
          <Link href="/studio/new">
            <Button size="sm" className="gap-2 shadow-sm cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>New Story</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Author Profile Quick Banner */}
      {author && (
        <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 border border-border flex items-center justify-center text-lg font-serif font-bold text-primary">
              {author.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base text-foreground">
                  {author.name}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  @{author.slug}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                {author.bio || "No bio set yet. Click Edit Profile to add your literary synopsis."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {author.website && (
              <a
                href={author.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Website</span>
              </a>
            )}
            <Link
              href="/studio/profile"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 font-medium transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-primary" />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Stories
          </span>
          <span className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            {stats.totalStories}
          </span>
          <span className="text-[11px] text-primary flex items-center gap-1 mt-0.5">
            <BookOpen className="w-3 h-3" />
            <span>Active novellas</span>
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Published Chapters
          </span>
          <span className="font-serif text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.publishedChapters}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span>Live to readers</span>
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Scheduled Releases
          </span>
          <span className="font-serif text-2xl sm:text-3xl font-bold text-sky-600 dark:text-sky-400">
            {stats.scheduledChapters}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3 text-sky-500" />
            <span>Auto-publishing queue</span>
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Words
          </span>
          <span className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            {stats.totalWords.toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <FileText className="w-3 h-3 text-primary" />
            <span>{stats.draftChapters} draft chapters</span>
          </span>
        </div>
      </div>

      {/* Stories Management Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-xl font-bold text-foreground">
            Your Stories
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-secondary text-foreground">
            {stories.length}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary/40 border border-border/80 w-fit text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
              filterStatus === "all"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All Stories ({stories.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("published")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
              filterStatus === "published"
                ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Published
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("draft")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
              filterStatus === "draft"
                ? "bg-card text-amber-600 dark:text-amber-400 shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Drafts
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("archived")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
              filterStatus === "archived"
                ? "bg-card text-muted-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-6 h-48 animate-pulse bg-secondary/50"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredStories.length === 0 && (
        <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-border bg-card/40 flex flex-col items-center gap-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
            <Feather className="w-8 h-8 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-serif text-lg font-bold text-foreground">
              {filterStatus === "all"
                ? "No Stories Created Yet"
                : `No ${filterStatus} stories found`}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {filterStatus === "all"
                ? "Begin your writing voyage today. Create a story, write captivating chapters, and schedule your release cadence."
                : `Switch to another filter or create a new story to get started.`}
            </p>
          </div>
          <Link href="/studio/new">
            <Button size="sm" className="gap-2 mt-2 cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Create Your First Story</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Stories Grid */}
      {!isLoading && filteredStories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStories.map((story) => {
            const coverGradient =
              story.cover_gradient || "from-amber-700 via-stone-800 to-zinc-950";

            return (
              <div
                key={story.id}
                className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all group"
              >
                {/* Top Section: Banner & Details */}
                <div className="flex flex-col">
                  {/* Visual Header Banner */}
                  <div
                    className={cn(
                      "h-28 w-full p-4 flex items-start justify-between relative overflow-hidden text-white bg-gradient-to-r",
                      coverGradient
                    )}
                  >
                    {story.cover_image_url && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
                        style={{ backgroundImage: `url(${story.cover_image_url})` }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                    <div className="relative z-10 flex items-center gap-2">
                      <Badge
                        variant="warm"
                        className={cn(
                          "backdrop-blur-xs text-[11px] font-semibold uppercase tracking-wider",
                          story.status === "published" && "bg-emerald-600/80 text-white border-emerald-400/40",
                          story.status === "draft" && "bg-amber-600/80 text-white border-amber-400/40",
                          story.status === "archived" && "bg-zinc-700/80 text-white border-zinc-500/40"
                        )}
                      >
                        {story.status}
                      </Badge>
                      <span className="text-[11px] text-white/80 font-medium">
                        {story.genres?.[0]?.name || "Fiction"}
                      </span>
                    </div>

                    <div className="relative z-10 text-right text-xs font-medium text-white/90">
                      {story.release_schedule !== "immediate" && (
                        <span className="px-2 py-0.5 rounded-full bg-black/40 border border-white/20 text-[10px] capitalize">
                          {story.release_schedule} Cadence
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col gap-3">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {story.title}
                      </h3>
                      {story.subtitle && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {story.subtitle}
                        </p>
                      )}
                    </div>

                    {story.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {story.description}
                      </p>
                    )}

                    {/* Counts Row */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/60 text-xs">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Chapters
                        </span>
                        <span className="font-semibold text-foreground">
                          {story.chaptersCount}{" "}
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({story.publishedChaptersCount} live)
                          </span>
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Scheduled
                        </span>
                        <span className="font-semibold text-sky-600 dark:text-sky-400">
                          {story.scheduledChaptersCount} queued
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Word Count
                        </span>
                        <span className="font-semibold text-foreground">
                          {story.totalWords.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="px-5 py-3.5 bg-secondary/30 border-t border-border/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Link href={`/studio/${story.id}/chapters/new`}>
                      <Button size="sm" className="h-8 gap-1.5 text-xs cursor-pointer">
                        <Feather className="w-3.5 h-3.5" />
                        <span>Write Chapter</span>
                      </Button>
                    </Link>
                    <Link href={`/studio/${story.id}/chapters`}>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs cursor-pointer">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Chapters ({story.chaptersCount})</span>
                      </Button>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/studio/${story.id}`}
                      title="Edit Story Details"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    {story.status === "published" && (
                      <Link
                        href={`/books/${story.slug}`}
                        title="View Public Story Page"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors cursor-pointer"
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
