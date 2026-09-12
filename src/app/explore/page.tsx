import * as React from "react";
import { Compass } from "lucide-react";
import { CuratedShelves } from "@/components/home/CuratedShelves";

export const metadata = {
  title: "Explore Shelves · Taleora",
  description: "Discover new stories, authors, and genres curated by the Taleora editorial team.",
};

export default function ExplorePage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b border-border/70 pb-5">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <Compass className="w-4 h-4" />
          <span>Story Discovery</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Explore Shelves & Genres
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse through realms of celestial fantasy, gothic mystery, and thoughtful prose.
        </p>
      </div>

      <CuratedShelves />
    </div>
  );
}
