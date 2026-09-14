import * as React from "react";
import type { Metadata } from "next";
import { getChapterReaderData } from "@/lib/books/queries";
import { ReaderClientContainer } from "@/components/reader/ReaderClientContainer";

interface ChapterPageProps {
  params: Promise<{
    bookSlug: string;
    chapterSlug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ChapterPageProps): Promise<Metadata> {
  const { bookSlug, chapterSlug } = await params;
  try {
    const data = await getChapterReaderData(bookSlug, chapterSlug);
    if (!data || !data.currentChapter) {
      return {
        title: "Chapter Reader · Taleora",
      };
    }

    return {
      title: `${data.currentChapter.title} — ${data.book.title} · Taleora`,
      description: `Read Chapter ${data.currentChapter.chapter_number} of ${data.book.title} by ${data.book.author?.name} on Taleora.`,
      openGraph: {
        title: `${data.currentChapter.title} — ${data.book.title}`,
        description: `Read Chapter ${data.currentChapter.chapter_number} on Taleora.`,
      },
    };
  } catch {
    return {
      title: "Offline Reader · Taleora",
    };
  }
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { bookSlug, chapterSlug } = await params;
  let data = null;

  try {
    data = await getChapterReaderData(bookSlug, chapterSlug);
  } catch (err) {
    console.warn("Could not fetch reader data on server (offline):", err);
  }

  return (
    <ReaderClientContainer
      bookSlug={bookSlug}
      chapterSlug={chapterSlug}
      initialData={data}
    />
  );
}
