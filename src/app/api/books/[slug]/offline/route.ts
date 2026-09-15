import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLocalChapterContent } from "@/lib/books/local-content";
import { enforceRateLimit } from "@/lib/network/rate-limiter";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  // 1. Rate Limiting Check (protects database & storage from hydration flooding)
  const rateCheck = enforceRateLimit(request, "publicRead");
  if (!rateCheck.allowed) {
    return rateCheck.response;
  }

  const { slug } = await params;
  const supabase = await createClient();

  // 1. Fetch Book with Author and Genres (by slug or id)
  let query = supabase
    .from("books")
    .select(
      `
      *,
      author:authors(*),
      book_genres(
        genre:genres(*)
      )
    `
    )
    .eq("status", "published");

  // Check if slug is a uuid or text slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  if (isUuid) {
    query = query.eq("id", slug);
  } else {
    query = query.eq("slug", slug);
  }

  const { data: bookData, error: bookErr } = await query.maybeSingle();

  if (bookErr || !bookData) {
    return NextResponse.json(
      { success: false, error: "Book not found." },
      { status: 404 }
    );
  }

  // 2. Fetch all published chapters for this book
  const { data: chaptersData, error: chaptersErr } = await supabase
    .from("chapters")
    .select("*")
    .eq("book_id", bookData.id)
    .eq("status", "published")
    .order("chapter_number", { ascending: true });

  if (chaptersErr || !chaptersData) {
    return NextResponse.json(
      { success: false, error: "Could not fetch chapters." },
      { status: 500 }
    );
  }

  // 3. Hydrate chapters with local content or Supabase Storage if empty in DB
  const { fetchBookChaptersFromStorage } = await import("@/lib/books/chapter-storage");
  const storageChapters = await fetchBookChaptersFromStorage(bookData.slug);

  const hydratedChapters = chaptersData.map((ch) => {
    if (!ch.content || ch.content.trim() === "") {
      const localContent = getLocalChapterContent(bookData.slug, ch.slug);
      if (localContent) {
        return { ...ch, content: localContent };
      }
      if (storageChapters && storageChapters[ch.slug]) {
        return { ...ch, content: storageChapters[ch.slug] };
      }
    }
    return ch;
  });

  return NextResponse.json(
    {
      success: true,
      book: bookData,
      chapters: hydratedChapters,
    },
    {
      headers: rateCheck.headers,
    }
  );
}
