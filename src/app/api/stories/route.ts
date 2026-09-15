/**
 * REST API: /api/stories
 * GET: Fetch list of published user-generated stories with search, genre, sort, caching, ETag, and rate limiting.
 * POST: Authenticated creation of a new user-generated story.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withNetworkTelemetry } from "@/lib/network/telemetry";
import { enforceRateLimit } from "@/lib/network/rate-limiter";
import { buildCachedResponse, storyCache } from "@/lib/network/cache";
import {
  validateStoryPayload,
  validateStoryQueryParams,
} from "@/lib/network/validation";
import { slugify } from "@/lib/utils";

// GET /api/stories
export async function GET(req: NextRequest) {
  return withNetworkTelemetry(req, async () => {
    // 1. Rate Limiting Check
    const rateCheck = enforceRateLimit(req, "publicRead");
    if (!rateCheck.allowed) {
      return rateCheck.response;
    }

    const url = new URL(req.url);
    const params = validateStoryQueryParams(url);
    const cacheKey = `stories:list:${JSON.stringify(params)}`;

    // 2. Fetch or Return Cached ETag Response
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
            )
          `
          )
          .eq("status", "published");

        if (params.search) {
          query = query.or(
            `title.ilike.%${params.search}%,description.ilike.%${params.search}%`
          );
        }

        if (params.sort === "rating") {
          query = query.order("average_rating", { ascending: false });
        } else if (params.sort === "popular") {
          query = query.order("reads_count", { ascending: false });
        } else {
          query = query.order("created_at", { ascending: false });
        }

        query = query.range(params.offset, params.offset + params.limit - 1);

        const { data, error } = await query;
        if (error) {
          throw new Error(error.message);
        }

        // Transform genres array
        const stories = (data || []).map((b) => ({
          ...b,
          genres: (b.book_genres || []).map((bg: { genre: unknown }) => bg.genre).filter(Boolean),
        }));

        return {
          stories,
          total: stories.length,
          limit: params.limit,
          offset: params.offset,
        };
      },
      60 // 60 seconds TTL
    );
  });
}

// POST /api/stories
export async function POST(req: NextRequest) {
  return withNetworkTelemetry(req, async () => {
    // 1. Secure Authentication Check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required to publish stories." },
        { status: 401 }
      );
    }

    // 2. Rate Limiting Check
    const rateCheck = enforceRateLimit(req, "storyPublish", user.id);
    if (!rateCheck.allowed) {
      return rateCheck.response;
    }

    // 3. Request Payload Parsing & Validation
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const validation = validateStoryPayload(rawBody);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: "Validation Error", details: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;

    // 4. Ensure or fetch Author Profile
    let authorId: string | null = null;
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

      const authorName = profile?.full_name || profile?.username || "Story Author";
      const { data: newAuthor, error: authorErr } = await supabase
        .from("authors")
        .insert({
          user_id: user.id,
          name: authorName,
          slug: `${slugify(authorName)}-${Math.random().toString(36).slice(2, 6)}`,
        })
        .select("id")
        .single();

      if (authorErr || !newAuthor) {
        return NextResponse.json(
          { error: "Database Error", message: "Failed to create author profile." },
          { status: 500 }
        );
      }
      authorId = newAuthor.id;
    }

    // 5. Generate unique slug and insert story
    const baseSlug = slugify(input.title) || "story";
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

    const { data: story, error: insertErr } = await supabase
      .from("books")
      .insert({
        user_id: user.id,
        author_id: authorId,
        title: input.title,
        subtitle: input.subtitle,
        slug: uniqueSlug,
        description: input.description,
        cover_gradient: input.cover_gradient,
        cover_accent: input.cover_accent,
        status: input.status,
        release_schedule: input.release_schedule || "immediate",
        published_at: input.status === "published" ? new Date().toISOString() : null,
      })
      .select(
        `
        *,
        author:authors(*)
      `
      )
      .single();

    if (insertErr || !story) {
      return NextResponse.json(
        { error: "Database Error", message: insertErr?.message || "Failed to create story." },
        { status: 500 }
      );
    }

    // 6. Associate genres if provided
    if (input.genreIds.length > 0) {
      const genreInserts = input.genreIds.map((genre_id) => ({
        book_id: story.id,
        genre_id,
      }));
      await supabase.from("book_genres").insert(genreInserts);
    }

    // 7. Invalidate stories cache
    storyCache.flush();

    return NextResponse.json(
      {
        message: "Story successfully created",
        story,
      },
      {
        status: 201,
        headers: rateCheck.headers,
      }
    );
  });
}
