"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Globe, Check, AlertCircle, Feather } from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import {
  getOrCreateAuthorProfile,
  updateAuthorProfile,
} from "@/lib/books/queries";
import { AuthorRow } from "@/types/books";
import { Button } from "@/components/ui/Button";

export default function AuthorProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [author, setAuthor] = React.useState<AuthorRow | null>(null);
  const [name, setName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) return;
    let isMounted = true;

    getOrCreateAuthorProfile(user.id, user.user_metadata?.full_name || "Author")
      .then((res) => {
        if (!isMounted || !res) return;
        setAuthor(res);
        setName(res.name);
        setBio(res.bio || "");
        setWebsite(res.website || "");
        setAvatarUrl(res.avatar_url || "");
      })
      .catch((err) => console.error("Error loading author profile:", err));

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setErrorMessage("Pen Name cannot be empty.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updated = await updateAuthorProfile(user.id, {
        name: name.trim(),
        bio: bio.trim() || null,
        website: website.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });

      if (updated) {
        setAuthor(updated);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        setErrorMessage("Failed to update author profile. Please try again.");
      }
    } catch (err) {
      console.error("Error saving author profile:", err);
      setErrorMessage("An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-16">
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
          <Feather className="w-4 h-4" />
          <span>Creator Persona</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Author Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure the public biography, pen name, and website displayed on your published stories.
        </p>
      </div>

      {/* Feedback Messages */}
      {savedSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>Author profile updated successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Pen Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
            Pen Name / Display Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Julian Sterling, Elena Vance"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
          {author && (
            <span className="text-[11px] text-muted-foreground font-mono">
              Unique handle: @{author.slug}
            </span>
          )}
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bio" className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
            Author Bio / Literary Synopsis
          </label>
          <textarea
            id="bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share your storytelling background, themes, or literary inspirations with readers..."
            className="w-full p-3.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
          />
        </div>

        {/* Website URL */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="website" className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
            Website or Portfolio URL
          </label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
        </div>

        {/* Avatar Image URL */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="avatarUrl" className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
            Author Avatar URL
          </label>
          <input
            id="avatarUrl"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/studio")}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSaving}
            className="gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save Profile"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
