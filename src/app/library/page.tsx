import * as React from "react";
import { Library, BookMarked, Clock } from "lucide-react";
import { StoryCard } from "@/components/home/StoryCard";
import { MOCK_STORIES } from "@/lib/mock-data";

export const metadata = {
  title: "My Library · Taleora",
  description: "Your saved stories, currently reading titles, and reading history.",
};

export default function LibraryPage() {
  const currentStories = MOCK_STORIES.slice(0, 2);
  const savedStories = MOCK_STORIES.slice(2, 5);

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b border-border/70 pb-5">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <Library className="w-4 h-4" />
          <span>Personal Collection</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          My Literary Library
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your reading journey, resume unread chapters, and revisit saved stories.
        </p>
      </div>

      {/* Currently Reading Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Currently Reading ({currentStories.length})</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </section>

      {/* Saved for Later Section */}
      <section className="flex flex-col gap-4 pt-4 border-t border-border/60">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-amber-500" />
            <span>Saved Bookmarks ({savedStories.length})</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </section>
    </div>
  );
}
