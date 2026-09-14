import * as React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { ContinueReadingCard } from "@/components/home/ContinueReadingCard";
import { CuratedShelves } from "@/components/home/CuratedShelves";
import { ReadingPhilosophy } from "@/components/home/ReadingPhilosophy";
import { createClient } from "@/lib/supabase/server";
import { getBooks } from "@/lib/books/queries";

export const metadata = {
  title: "Taleora · Modern Story & Book Reader",
  description:
    "Immerse yourself in curated tales and distraction-free stories. Warm paper aesthetics, responsive reader shell, and gentle reading habit tracking.",
};

export default async function Home() {
  // Fetch real data server-side
  const [books, supabase] = await Promise.all([
    getBooks({ sort: "newest" }),
    createClient(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch current user's in-progress reading (most recently read book)
  let currentRead = null;
  if (user) {
    const { data } = await supabase
      .from("reading_progress")
      .select(`
        progress_percentage,
        last_read_at,
        current_chapter_id,
        book:books(id, title, slug, subtitle, cover_gradient, cover_accent, total_chapters),
        chapter:chapters!reading_progress_current_chapter_id_fkey(chapter_number)
      `)
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .order("last_read_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    currentRead = data;
  }

  return (
    <div className="flex flex-col gap-10">
      <HeroSection />
      {currentRead && <ContinueReadingCard progress={currentRead} />}
      <CuratedShelves books={books} />
      <ReadingPhilosophy />
    </div>
  );
}
