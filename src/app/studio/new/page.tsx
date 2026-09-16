"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Upload,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import {
  getGenres,
  slugify,
  uploadCoverImage,
} from "@/lib/books/queries";
import { GenreRow, BookStatus, ReleaseCadence } from "@/types/books";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/network/api-client";

const GRADIENT_PRESETS = [
  {
    name: "Warm Amber & Stone",
    gradient: "from-amber-700 via-stone-800 to-zinc-950",
    accent: "#E28743",
  },
  {
    name: "Midnight Obsidian",
    gradient: "from-slate-800 via-zinc-900 to-black",
    accent: "#38bdf8",
  },
  {
    name: "Verdant Emerald",
    gradient: "from-emerald-800 via-teal-950 to-zinc-950",
    accent: "#34d399",
  },
  {
    name: "Royal Amethyst",
    gradient: "from-purple-900 via-indigo-950 to-zinc-950",
    accent: "#c084fc",
  },
  {
    name: "Rosewood Crimson",
    gradient: "from-rose-800 via-stone-900 to-zinc-950",
    accent: "#fb7185",
  },
];

export default function CreateStoryPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Form states
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [isCustomSlug, setIsCustomSlug] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);
  const [allGenres, setAllGenres] = React.useState<GenreRow[]>([]);
  const [status, setStatus] = React.useState<BookStatus>("draft");
  const [releaseSchedule, setReleaseSchedule] =
    React.useState<ReleaseCadence>("immediate");

  // Cover styling states
  const [coverType, setCoverType] = React.useState<"preset" | "upload">("preset");
  const [selectedGradient, setSelectedGradient] = React.useState(
    GRADIENT_PRESETS[0].gradient
  );
  const [accentColor, setAccentColor] = React.useState(GRADIENT_PRESETS[0].accent);
  const [coverImageUrl, setCoverImageUrl] = React.useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = React.useState(false);

  // Status & Error handling
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    getGenres()
      .then((res) => setAllGenres(res))
      .catch((err) => console.error("Error loading genres:", err));
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isCustomSlug) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCustomSlug(true);
    setSlug(slugify(e.target.value));
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Cover image must be smaller than 5MB.");
      return;
    }

    setUploadingFile(true);
    setErrorMessage(null);

    try {
      const publicUrl = await uploadCoverImage(user.id, file);
      if (publicUrl) {
        setCoverImageUrl(publicUrl);
        setCoverType("upload");
      } else {
        setErrorMessage("Cover upload failed. Please try again.");
      }
    } catch (err) {
      console.error("Cover upload error:", err);
      setErrorMessage("Error uploading image.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      setErrorMessage("Please provide a story title.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Dispatch via resilient REST API transport
      const res = await apiClient.post<{ message: string; story: { id: string } }>("/api/stories", {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        description: description.trim() || null,
        genreIds: selectedGenres,
        cover_image_url: coverType === "upload" ? coverImageUrl : null,
        cover_gradient: selectedGradient,
        cover_accent: accentColor,
        status,
        release_schedule: releaseSchedule,
      });

      if (res.ok && res.data?.story) {
        // Direct to chapters management to begin writing Chapter 1!
        router.push(`/studio/${res.data.story.id}/chapters`);
      } else {
        setErrorMessage(res.error || "Failed to create story. Please check inputs.");
      }
    } catch (err) {
      console.error("Error creating story via API:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Network error creating story."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-20">
      {/* Back Link */}
      <Link
        href="/studio"
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Author Studio</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border/70 pb-5">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>New Story Initiation</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Create a Story
        </h1>
        <p className="text-sm text-muted-foreground">
          Establish the literary foundation, aesthetics, and release cadence for your novella.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Section 1: Basic Information */}
        <div className="flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card">
          <h2 className="font-serif text-lg font-bold text-foreground">
            Story Details
          </h2>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="title"
              className="text-xs font-semibold uppercase tracking-wider text-foreground/80"
            >
              Story Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={handleTitleChange}
              placeholder="e.g. The Cartographer of Lost Constellations"
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="subtitle"
                className="text-xs font-semibold uppercase tracking-wider text-foreground/80"
              >
                Subtitle (Optional)
              </label>
              <input
                id="subtitle"
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. A Memoir of Forgotten Stars"
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="slug"
                className="text-xs font-semibold uppercase tracking-wider text-foreground/80"
              >
                URL Slug
              </label>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="the-cartographer-of-lost-constellations"
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
              <span className="text-[11px] text-muted-foreground">
                Path: /books/{slug || "story-slug"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="description"
              className="text-xs font-semibold uppercase tracking-wider text-foreground/80"
            >
              Synopsis / Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A compelling overview to introduce readers to your characters, world, and themes..."
              className="w-full p-3.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
            />
          </div>

          {/* Genres */}
          <div className="flex flex-col gap-2 pt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
              Genres & Themes
            </label>
            <div className="flex flex-wrap gap-2">
              {allGenres.map((g) => {
                const isSelected = selectedGenres.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGenre(g.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-secondary/60 text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Cover Art & Appearance */}
        <div className="flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-foreground">
              Book Cover Design
            </h2>

            {/* Switch between Preset & Upload */}
            <div className="flex items-center p-1 rounded-xl bg-secondary/50 border border-border text-xs font-medium">
              <button
                type="button"
                onClick={() => setCoverType("preset")}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                  coverType === "preset"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Curated Gradient
              </button>
              <button
                type="button"
                onClick={() => setCoverType("upload")}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                  coverType === "upload"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Upload Image
              </button>
            </div>
          </div>

          {/* Cover Preview Box */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-secondary/20 border border-border/80">
            <div
              className={cn(
                "w-36 h-52 rounded-xl p-4 flex flex-col justify-between text-white shadow-md relative overflow-hidden bg-gradient-to-br",
                selectedGradient
              )}
            >
              {coverType === "upload" && coverImageUrl && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-overlay"
                  style={{ backgroundImage: `url(${coverImageUrl})` }}
                />
              )}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20" />
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 relative z-10">
                Taleora
              </span>
              <div className="relative z-10">
                <span className="font-serif text-xs font-bold line-clamp-2 leading-tight">
                  {title || "Untitled Story"}
                </span>
                <span className="text-[9px] opacity-75 mt-0.5 block line-clamp-1">
                  By You
                </span>
              </div>
            </div>

            {/* Customizer Controls */}
            <div className="flex-1 flex flex-col gap-4">
              {coverType === "preset" ? (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-medium text-foreground">
                    Select Palette Preset:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {GRADIENT_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setSelectedGradient(p.gradient);
                          setAccentColor(p.accent);
                        }}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer",
                          selectedGradient === p.gradient
                            ? "border-primary ring-2 ring-primary/20 bg-card shadow-xs"
                            : "border-border/80 hover:bg-card"
                        )}
                      >
                        <div
                          className={cn(
                            "w-6 h-6 rounded-md shadow-xs bg-gradient-to-br shrink-0",
                            p.gradient
                          )}
                        />
                        <span className="font-medium text-foreground">
                          {p.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-medium text-foreground">
                    Upload Custom Cover (JPG, PNG, WebP up to 5MB):
                  </span>
                  <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-card cursor-pointer transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                    <span className="text-xs font-medium text-foreground">
                      {uploadingFile ? "Uploading cover..." : "Choose Image File"}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-1">
                      Recommended aspect ratio: 2:3 (e.g. 800x1200)
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Publishing & Release Cadence */}
        <div className="flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card">
          <h2 className="font-serif text-lg font-bold text-foreground">
            Publishing Status & Release Cadence
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Story Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                Initial Story Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BookStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="draft">Draft (Private in your studio)</option>
                <option value="published">Published (Visible in public catalog)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Default Release Cadence */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                Chapter Release Schedule
              </label>
              <select
                value={releaseSchedule}
                onChange={(e) => setReleaseSchedule(e.target.value as ReleaseCadence)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="immediate">Publish Immediately</option>
                <option value="manual">Manual (Specific Date/Time per chapter)</option>
                <option value="weekly">Weekly Cadence (Every 7 days)</option>
                <option value="biweekly">Biweekly Cadence (Every 14 days)</option>
                <option value="monthly">Monthly Cadence (Every 30 days)</option>
                <option value="custom">Custom Schedule</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/studio")}
            className="cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || uploadingFile}
            className="gap-2 cursor-pointer shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? "Creating Story..." : "Create Story & Continue"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
