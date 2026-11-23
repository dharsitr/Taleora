import { NextRequest, NextResponse } from "next/server";

interface CachedIdempotentResponse {
  status: number;
  body: string;
  headers: Record<string, string>;
  createdAt: number;
  inProgress: boolean;
}

// In-memory sliding cache for idempotency keys
const idempotencyStore = new Map<string, CachedIdempotentResponse>();

// Clean up expired keys every 10 minutes (TTL: 24 hours)
const TTL_MS = 24 * 60 * 60 * 1000;
if (typeof setInterval !== "undefined") {
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of idempotencyStore.entries()) {
      if (now - value.createdAt > TTL_MS) {
        idempotencyStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
  if (cleanup.unref) cleanup.unref();
}

/**
 * Validates whether an idempotency key conforms to a safe string pattern (e.g. UUID or alphanumeric hash).
 */
export function isValidIdempotencyKey(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  return /^[a-zA-Z0-9_-]{16,128}$/.test(key);
}

/**
 * Wraps an API route handler with idempotency protection.
 * If the client provides an `Idempotency-Key` header, duplicate requests return
 * the cached response without re-executing business logic.
 */
export async function withIdempotency(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const idempotencyKey = req.headers.get("idempotency-key");

  // If no idempotency key provided, proceed normally
  if (!idempotencyKey) {
    return handler();
  }

  if (!isValidIdempotencyKey(idempotencyKey)) {
    return NextResponse.json(
      { error: "Invalid Idempotency-Key. Expected 16-128 alphanumeric characters, hyphens, or underscores." },
      { status: 400 }
    );
  }

  const existing = idempotencyStore.get(idempotencyKey);

  // If request is currently processing, prevent duplicate concurrent execution
  if (existing && existing.inProgress) {
    return NextResponse.json(
      { error: "A request with this Idempotency-Key is currently being processed." },
      { status: 409, headers: { "Retry-After": "2" } }
    );
  }

  // If already resolved, replay cached response
  if (existing && !existing.inProgress) {
    const replayResponse = new NextResponse(existing.body, {
      status: existing.status,
      headers: {
        ...existing.headers,
        "X-Idempotent-Replay": "true",
      },
    });
    return replayResponse;
  }

  // Mark as in-progress
  idempotencyStore.set(idempotencyKey, {
    status: 0,
    body: "",
    headers: {},
    createdAt: Date.now(),
    inProgress: true,
  });

  try {
    const response = await handler();

    // Cache the response clone
    const cloned = response.clone();
    const bodyText = await cloned.text();
    const headersObj: Record<string, string> = {};
    response.headers.forEach((v, k) => {
      headersObj[k] = v;
    });

    idempotencyStore.set(idempotencyKey, {
      status: response.status,
      body: bodyText,
      headers: headersObj,
      createdAt: Date.now(),
      inProgress: false,
    });

    return response;
  } catch (error) {
    // Evict failed requests so client can retry with same key
    idempotencyStore.delete(idempotencyKey);
    throw error;
  }
}
