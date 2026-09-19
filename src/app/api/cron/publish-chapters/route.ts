import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { publishScheduledChapters } from "@/lib/books/queries";
import { RateLimitProfiles } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function safeCompare(input: string | null, expected: string): boolean {
  if (!input) return false;
  const inputBuffer = Buffer.from(input, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (inputBuffer.length !== expectedBuffer.length) {
    // Perform dummy timing-safe comparison on equal-length buffer to mitigate micro-timing variance
    timingSafeEqual(expectedBuffer, expectedBuffer);
    return false;
  }
  return timingSafeEqual(inputBuffer, expectedBuffer);
}

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

  // 2. Secret Authorization guard (Fail-Closed)
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      {
        success: false,
        error: "Server Configuration Error: CRON_SECRET is not configured. Execution denied.",
      },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const customSecretHeader = request.headers.get("x-cron-secret");

  const isBearerMatch = safeCompare(authHeader, `Bearer ${cronSecret}`);
  const isCustomHeaderMatch = safeCompare(customSecretHeader, cronSecret);
  const isAuthorized = isBearerMatch || isCustomHeaderMatch;

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
