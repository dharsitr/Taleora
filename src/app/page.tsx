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

async function UserContinueReading() {
  let progressData = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: currentRead } = await supabase
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
    if (!currentRead) return null;
    progressData = currentRead;
  } catch (err) {
    console.warn("Could not load user reading progress on home:", err);
    return null;
  }

  if (!progressData) return null;
  return <ContinueReadingCard progress={progressData} />;
}

export default async function Home() {
  const books = await getBooks({ sort: "newest" });

  return (
    <div className="flex flex-col gap-10">
      <HeroSection />
      <React.Suspense fallback={null}>
        <UserContinueReading />
      </React.Suspense>
      <CuratedShelves books={books} />
      <ReadingPhilosophy />
    </div>
  );
}
