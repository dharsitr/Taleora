import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugifyText } from "@/lib/books/epub-parser";

export const maxDuration = 60; // Allow sufficient time for multi-chapter ingestion

interface IngestChapterInput {
  chapterNumber: number;
  title: string;
  slug: string;
  content: string;
  wordCount: number;
  estimatedReadMinutes: number;
}

interface IngestPayload {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  coverDataUrl?: string | null;
  coverGradient?: string | null;
  coverAccent?: string | null;
  genreIds?: string[];
  status?: "published" | "draft";
  chapters: IngestChapterInput[];
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be signed in to import stories." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as IngestPayload;

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { error: "Validation Error", message: "Story title is required." },
        { status: 400 }
      );
    }

    if (!body.chapters || body.chapters.length === 0) {
      return NextResponse.json(
        { error: "Validation Error", message: "Story must contain at least one chapter." },
        { status: 400 }
      );
    }

    // 1. Ensure or create Author Profile
    let authorId: string;
    const { data: existingAuthor } = await supabase
      .from("authors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingAuthor) {
      authorId = existingAuthor.id;
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, full_name")
        .eq("id", user.id)
        .single();

      const authorName = profile?.full_name || profile?.username || "Taleora Author";
      const { data: newAuthor, error: authorErr } = await supabase
        .from("authors")
        .insert({
          user_id: user.id,
          name: authorName,
          slug: `${slugifyText(authorName)}-${Math.random().toString(36).slice(2, 6)}`,
        })
        .select("id")
        .single();

      if (authorErr || !newAuthor) {
        throw new Error(authorErr?.message || "Failed to initialize author profile.");
      }
      authorId = newAuthor.id;
    }

    // 2. Handle Cover Image (Upload base64 to Supabase Storage if provided)
    let coverImageUrl: string | null = null;
    if (body.coverDataUrl && body.coverDataUrl.startsWith("data:image/")) {
      try {
        const matches = body.coverDataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const extension = matches[1] === "jpeg" ? "jpg" : matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          const fileName = `${user.id}/cover-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${extension}`;

          const { error: storageErr } = await supabase.storage
            .from("book-covers")
            .upload(fileName, buffer, {
              contentType: `image/${matches[1]}`,
              upsert: true,
            });

          if (!storageErr) {
            const { data: publicUrlData } = supabase.storage
              .from("book-covers")
              .getPublicUrl(fileName);
            coverImageUrl = publicUrlData.publicUrl;
          }
        }
      } catch (coverUploadErr) {
        console.warn("Cover image upload warning (fallback to gradient):", coverUploadErr);
      }
    }

    // 3. Create Book Record
    const baseSlug = slugifyText(body.title) || "story";
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
    const totalChapters = body.chapters.length;
    const totalReadMinutes = body.chapters.reduce(
      (sum, c) => sum + (c.estimatedReadMinutes || 3),
      0
    );

    const { data: book, error: bookErr } = await supabase
      .from("books")
      .insert({
        user_id: user.id,
        author_id: authorId,
        title: body.title.trim(),
        subtitle: body.subtitle?.trim() || null,
        description: body.description?.trim() || null,
        slug: uniqueSlug,
        status: body.status || "published",
        cover_image_url: coverImageUrl,
        cover_gradient:
          body.coverGradient || "from-amber-700 via-stone-800 to-zinc-950",
        cover_accent: body.coverAccent || "#E28743",
        total_chapters: totalChapters,
        estimated_read_time_minutes: totalReadMinutes,
        release_schedule: "immediate",
        published_at: new Date().toISOString(),
      })
      .select("id, slug, title")
      .single();

    if (bookErr || !book) {
      throw new Error(bookErr?.message || "Failed to create book record in database.");
    }

    // 4. Connect Genres if supplied
    if (body.genreIds && body.genreIds.length > 0) {
      const genreInserts = body.genreIds.map((gid) => ({
        book_id: book.id,
        genre_id: gid,
      }));
      await supabase.from("book_genres").insert(genreInserts);
    }

    // 5. Batch Insert Chapters with Full Content
    const chapterRows = body.chapters.map((ch, idx) => ({
      book_id: book.id,
      user_id: user.id,
      chapter_number: ch.chapterNumber || idx + 1,
      title: ch.title || `Chapter ${idx + 1}`,
      slug: `chapter-${idx + 1}-${slugifyText(ch.title || `chapter-${idx + 1}`).slice(0, 32)}`,
      content: ch.content,
      word_count: ch.wordCount || ch.content.split(/\s+/).filter(Boolean).length,
      estimated_read_minutes:
        ch.estimatedReadMinutes || Math.max(1, Math.ceil(ch.content.split(/\s+/).length / 220)),
      status: "published",
      published_at: new Date().toISOString(),
    }));

    // Insert in batches of 25 to respect payload sizes
    const BATCH_SIZE = 25;
    for (let i = 0; i < chapterRows.length; i += BATCH_SIZE) {
      const batch = chapterRows.slice(i, i + BATCH_SIZE);
      const { error: chErr } = await supabase.from("chapters").insert(batch);
      if (chErr) {
        console.error("Batch chapter insertion error:", chErr);
        throw new Error(`Failed to insert chapters batch: ${chErr.message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Story "${book.title}" imported successfully with ${totalChapters} chapters!`,
      book: {
        id: book.id,
        slug: book.slug,
        title: book.title,
        totalChapters,
      },
    });
  } catch (err: unknown) {
    console.error("Story ingestion error:", err);
    return NextResponse.json(
      {
        error: "Ingestion Failed",
        message: err instanceof Error ? err.message : "An unexpected error occurred during ingestion.",
      },
      { status: 500 }
    );
  }
}
