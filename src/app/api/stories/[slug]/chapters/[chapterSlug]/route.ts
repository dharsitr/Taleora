/**
 * REST API: /api/stories/[slug]/chapters/[chapterSlug]
 * GET: Fetch reading payload for a specific chapter with ETag caching and rate limiting.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withNetworkTelemetry } from "@/lib/network/telemetry";
import { enforceRateLimit } from "@/lib/network/rate-limiter";
import { buildCachedResponse } from "@/lib/network/cache";

interface RouteProps {
  params: Promise<{ slug: string; chapterSlug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  return withNetworkTelemetry(req, async () => {
    const rateCheck = enforceRateLimit(req, "publicRead");
    if (!rateCheck.allowed) return rateCheck.response;

    const { slug, chapterSlug } = await params;
    const isBookUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const isChapterUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chapterSlug);

    const cacheKey = `chapter:reader:${slug}:${chapterSlug}`;

    return buildCachedResponse(
      req,
      cacheKey,
      async () => {
        const supabase = await createClient();

        // Fetch book
        const { data: book, error: bookErr } = await supabase
          .from("books")
          .select("id, title, slug, status, author:authors(*)")
          .eq(isBookUuid ? "id" : "slug", slug)
          .single();

        if (bookErr || !book) {
          throw new Error("Story not found");
        }

        // Fetch chapter
        let chapterQuery = supabase
          .from("chapters")
          .select("*")
          .eq("book_id", book.id)
          .eq("status", "published");

        if (isChapterUuid) {
          chapterQuery = chapterQuery.eq("id", chapterSlug);
        } else {
          chapterQuery = chapterQuery.eq("slug", chapterSlug);
        }

        const { data: chapter, error: chErr } = await chapterQuery.maybeSingle();
        if (chErr || !chapter) {
          throw new Error("Chapter not found");
        }

        // Fetch next/prev navigation
        const { data: allChapters } = await supabase
          .from("chapters")
          .select("id, chapter_number, title, slug")
          .eq("book_id", book.id)
          .eq("status", "published")
          .order("chapter_number", { ascending: true });

        const chaptersList = allChapters || [];
        const currentIndex = chaptersList.findIndex((c) => c.id === chapter.id);
        const prevChapter = currentIndex > 0 ? chaptersList[currentIndex - 1] : null;
        const nextChapter = currentIndex < chaptersList.length - 1 ? chaptersList[currentIndex + 1] : null;

        return {
          book,
          chapter,
          navigation: {
            prev: prevChapter,
            next: nextChapter,
            totalChapters: chaptersList.length,
          },
        };
      },
      300 // 5 minutes TTL for reader content
    );
  });
}

// DELETE /api/stories/[slug]/chapters/[chapterSlug]
export async function DELETE(req: NextRequest, { params }: RouteProps) {
  return withNetworkTelemetry(req, async () => {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required to delete a chapter." },
        { status: 401 }
      );
    }

    const rateCheck = enforceRateLimit(req, "storyPublish", user.id);
    if (!rateCheck.allowed) {
      return rateCheck.response;
    }

    const { slug, chapterSlug } = await params;
    const { deleteChapterSecurely } = await import("@/lib/books/deletion");
    const result = await deleteChapterSecurely(user.id, slug, chapterSlug);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete chapter." },
        { status: result.code || 500 }
      );
    }

    return NextResponse.json({
      message: result.message || "Chapter successfully deleted.",
    });
  });
}

