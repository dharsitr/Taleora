import * as React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { ContinueReadingCard } from "@/components/home/ContinueReadingCard";
import { CuratedShelves } from "@/components/home/CuratedShelves";
import { ReadingPhilosophy } from "@/components/home/ReadingPhilosophy";

export const metadata = {
  title: "Taleora · Modern Story & Book Reader",
  description:
    "Immerse yourself in curated tales and distraction-free stories. Warm paper aesthetics, responsive reader shell, and gentle reading habit tracking.",
};

export default function Home() {
  return (
    <div className="flex flex-col gap-10">
      {/* 1. Welcoming Literary Hero Section */}
      <HeroSection />

      {/* 2. Jump Back In / Continue Reading Card */}
      <ContinueReadingCard />

      {/* 3. Curated Story Shelves with Genre Filters */}
      <CuratedShelves />

      {/* 4. Reading Philosophy & Reader Perks */}
      <ReadingPhilosophy />
    </div>
  );
}
