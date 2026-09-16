/**
 * REST API: /api/stories/[slug]/chapters
 * GET: List all chapters for a story.
 * POST: Authenticated creation and publishing of a new chapter for an author's story.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withNetworkTelemetry } from "@/lib/network/telemetry";
import { enforceRateLimit } from "@/lib/network/rate-limiter";
import { storyCache } from "@/lib/network/cache";
import { validateChapterPayload } from "@/lib/network/validation";
import { slugify } from "@/lib/utils";

interface RouteProps {
  params: Promise<{ slug: string }>;
}

// GET /api/stories/[slug]/chapters
export async function GET(req: NextRequest, { params }: RouteProps) {
  return withNetworkTelemetry(req, async () => {
    const rateCheck = enforceRateLimit(req, "publicRead");
    if (!rateCheck.allowed) return rateCheck.response;

    const { slug } = await params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    const supabase = await createClient();

    // Resolve book
    const { data: book } = await supabase
      .from("books")
      .select("id")
      .eq(isUuid ? "id" : "slug", slug)
      .maybeSingle();

    if (!book) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const { data: chapters, error } = await supabase
      .from("chapters")
      .select("id, chapter_number, title, slug, status, word_count, estimated_read_minutes, published_at")
      .eq("book_id", book.id)
      .order("chapter_number", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ chapters });
  });
}

// POST /api/stories/[slug]/chapters
export async function POST(req: NextRequest, { params }: RouteProps) {
  return withNetworkTelemetry(req, async () => {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required to publish chapters." },
        { status: 401 }
      );
    }

    const rateCheck = enforceRateLimit(req, "storyPublish", user.id);
    if (!rateCheck.allowed) return rateCheck.response;

    const { slug } = await params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    // Verify user owns the story
    const { data: book, error: bookErr } = await supabase
      .from("books")
      .select("id, user_id, slug, total_chapters")
      .eq(isUuid ? "id" : "slug", slug)
      .maybeSingle();

    if (bookErr || !book) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (book.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden", message: "You do not own this story." },
        { status: 403 }
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validation = validateChapterPayload(rawBody);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: "Validation Error", details: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;
    const words = input.content.trim().split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.round(words / 200));
    const baseSlug = slugify(input.title) || `chapter-${input.chapter_number}`;
    const chapterSlug = `chapter-${input.chapter_number}-${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    let publishedAt: string | null = null;
    if (input.status === "published") {
      publishedAt = new Date().toISOString();
    }

    const { data: chapter, error: insertErr } = await supabase
      .from("chapters")
      .insert({
        book_id: book.id,
        user_id: user.id,
        chapter_number: input.chapter_number,
        title: input.title,
        slug: chapterSlug,
        content: input.content,
        word_count: words,
        estimated_read_minutes: readTime,
        status: input.status,
        schedule_type: input.schedule_type || "immediate",
        scheduled_for: input.status === "scheduled" ? (input.scheduled_for || null) : null,
        published_at: publishedAt,
      })
      .select()
      .single();

    if (insertErr || !chapter) {
      return NextResponse.json(
        { error: "Database Error", message: insertErr?.message || "Failed to create chapter." },
        { status: 500 }
      );
    }

    // Update total chapters in book
    const newTotal = Math.max(book.total_chapters || 0, input.chapter_number);
    await supabase
      .from("books")
      .update({ total_chapters: newTotal, updated_at: new Date().toISOString() })
      .eq("id", book.id);

    // Invalidate caches
    storyCache.invalidate(`story:detail:${slug}`);
    storyCache.invalidate(`story:detail:${book.id}`);
    storyCache.flush();

    return NextResponse.json(
      {
        message: "Chapter successfully published",
        chapter,
      },
      { status: 201 }
    );
  });
}
