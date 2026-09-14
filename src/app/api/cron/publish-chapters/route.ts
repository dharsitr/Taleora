import { NextRequest, NextResponse } from "next/server";
import { publishScheduledChapters } from "@/lib/books/queries";
import { RateLimitProfiles } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. Rate limiting guard
  const ip = request.headers.get("x-forwarded-for") || "unknown-client";
  const rateLimit = RateLimitProfiles.api(ip);
  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // 2. Secret Authorization guard
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const customSecretHeader = request.headers.get("x-cron-secret");

  const isAuthorized =
    !cronSecret || // Local development without secret configured
    authHeader === `Bearer ${cronSecret}` ||
    customSecretHeader === cronSecret;

  if (!isAuthorized) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Invalid or missing cron authorization header.",
      },
      { status: 401 }
    );
  }

  try {
    const publishedCount = await publishScheduledChapters();
    return NextResponse.json({
      success: true,
      publishedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron publish error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to publish scheduled chapters",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
