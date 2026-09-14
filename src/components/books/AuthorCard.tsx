import * as React from "react";
import { Feather, ExternalLink, Globe } from "lucide-react";
import { AuthorRow } from "@/types/books";
import { AuthorFollowButton } from "@/components/social/AuthorFollowButton";

interface AuthorCardProps {
  author: AuthorRow;
}

export function AuthorCard({ author }: AuthorCardProps) {
  const initials = author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <Feather className="w-3.5 h-3.5" />
          <span>About The Author</span>
        </div>

        <AuthorFollowButton
          authorId={author.id}
          authorName={author.name}
          initialFollowerCount={author.follower_count ?? 0}
          size="sm"
        />
      </div>

      <div className="flex items-start gap-4">
        {/* Author Avatar / Monogram */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center text-primary font-serif font-bold text-base shrink-0 shadow-xs">
          {initials}
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="font-serif text-lg font-bold text-foreground">
              {author.name}
            </h4>
            {author.website && (
              <a
                href={author.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Author Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {author.bio ||
              "Prolific storyteller and visionary writer contributing to the literary worlds of Taleora."}
          </p>
        </div>
      </div>
    </div>
  );
}
