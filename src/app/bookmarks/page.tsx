import * as React from "react";
import { BookMarked } from "lucide-react";
import { StoryCard } from "@/components/home/StoryCard";
import { MOCK_STORIES } from "@/lib/mock-data";

export const metadata = {
  title: "Saved Bookmarks · Taleora",
  description: "Stories and chapters saved for quiet reading moments.",
};

export default function BookmarksPage() {
  const bookmarkedStories = MOCK_STORIES.slice(1, 4);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b border-border/70 pb-5">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <BookMarked className="w-4 h-4" />
          <span>Curated List</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Saved Bookmarks
        </h1>
        <p className="text-sm text-muted-foreground">
          Your personal archive of passages, novellas, and stories kept close at hand.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookmarkedStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </div>
  );
}
