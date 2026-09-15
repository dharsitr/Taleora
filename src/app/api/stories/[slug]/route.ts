/**
 * REST API: /api/stories/[slug]
 * GET: Fetch single story details and its published chapters (cached with ETag).
 * PUT: Authenticated update of story details and publication status (checks user ownership).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withNetworkTelemetry } from "@/lib/network/telemetry";
import { enforceRateLimit } from "@/lib/network/rate-limiter";
import { buildCachedResponse, storyCache } from "@/lib/network/cache";
import { validateStoryPayload } from "@/lib/network/validation";

interface RouteProps {
  params: Promise<{ slug: string }>;
}

// GET /api/stories/[slug]
export async function GET(req: NextRequest, { params }: RouteProps) {
  return withNetworkTelemetry(req, async () => {
    const rateCheck = enforceRateLimit(req, "publicRead");
    if (!rateCheck.allowed) {
      return rateCheck.response;
    }

    const { slug } = await params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const cacheKey = `story:detail:${slug}`;

    return buildCachedResponse(
      req,
      cacheKey,
      async () => {
        const supabase = await createClient();
        let query = supabase
          .from("books")
          .select(
            `
            *,
            author:authors(*),
            book_genres(
              genre:genres(*)
            ),
            chapters(
              id,
              chapter_number,
              title,
              slug,
              status,
              word_count,
              estimated_read_time_minutes,
              published_at
            )
          `
          )
          .order("chapter_number", { referencedTable: "chapters", ascending: true });

        if (isUuid) {
          query = query.eq("id", slug);
        } else {
          query = query.eq("slug", slug);
        }

        const { data: story, error } = await query.maybeSingle();
        if (error || !story) {
          throw new Error("Story not found");
        }

        const genres = (story.book_genres || [])
          .map((bg: { genre: unknown }) => bg.genre)
          .filter(Boolean);

        return {
          ...story,
          genres,
        };
      },
      120 // 2 minutes TTL
    );
  });
}

// PUT /api/stories/[slug]
export async function PUT(req: NextRequest, { params }: RouteProps) {
  return withNetworkTelemetry(req, async () => {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required to update story." },
        { status: 401 }
      );
    }

    const rateCheck = enforceRateLimit(req, "storyPublish", user.id);
    if (!rateCheck.allowed) {
      return rateCheck.response;
    }

    const { slug } = await params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    // Verify ownership
    const checkQuery = supabase.from("books").select("id, user_id, slug").eq(isUuid ? "id" : "slug", slug);
    const { data: existingStory, error: fetchErr } = await checkQuery.maybeSingle();

    if (fetchErr || !existingStory) {
      return NextResponse.json({ error: "Not Found", message: "Story not found." }, { status: 404 });
    }

    if (existingStory.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden", message: "You do not have permission to modify this story." },
        { status: 403 }
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Bad Request", message: "Invalid JSON body." }, { status: 400 });
    }

    const validation = validateStoryPayload(rawBody);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: "Validation Error", details: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;

    const { data: updated, error: updateErr } = await supabase
      .from("books")
      .update({
        title: input.title,
        subtitle: input.subtitle,
        description: input.description,
        cover_gradient: input.cover_gradient,
        cover_accent: input.cover_accent,
        status: input.status,
        published_at: input.status === "published" ? new Date().toISOString() : null,
      })
      .eq("id", existingStory.id)
      .select("*, author:authors(*)")
      .single();

    if (updateErr) {
      return NextResponse.json(
        { error: "Update Error", message: updateErr.message },
        { status: 500 }
      );
    }

    // Invalidate caches
    storyCache.invalidate(`story:detail:${slug}`);
    storyCache.invalidate(`story:detail:${existingStory.id}`);
    storyCache.flush();

    return NextResponse.json({
      message: "Story successfully updated",
      story: updated,
    });
  });
}

// DELETE /api/stories/[slug]
export async function DELETE(req: NextRequest, { params }: RouteProps) {
  return withNetworkTelemetry(req, async () => {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required to delete a story." },
        { status: 401 }
      );
    }

    const rateCheck = enforceRateLimit(req, "storyPublish", user.id);
    if (!rateCheck.allowed) {
      return rateCheck.response;
    }

    const { slug } = await params;
    const { deleteBookSecurely } = await import("@/lib/books/deletion");
    const result = await deleteBookSecurely(user.id, slug);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete story." },
        { status: result.code || 500 }
      );
    }

    return NextResponse.json({
      message: result.message || "Story successfully deleted.",
    });
  });
}

