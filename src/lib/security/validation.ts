/**
 * Core validation and sanitization utilities for Taleora.
 * Provides zero-dependency, type-safe guards against XSS, injection,
 * parameter tampering, and corrupted user input.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

/**
 * Escape raw HTML characters to prevent XSS.
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  return str.replace(/[&<>"'/]/g, (match) => HTML_ESCAPE_MAP[match] || match);
}

/**
 * Sanitize text input: strips null bytes, control characters, trims whitespace,
 * and enforces maximum length.
 */
export function sanitizeText(
  input: unknown,
  maxLength = 5000,
  options?: { preserveNewlines?: boolean }
): string {
  if (typeof input !== "string") return "";

  // 1. Remove null bytes and non-printable control characters (except tab/newline if allowed)
  let clean = input.replace(/\0/g, "");
  if (options?.preserveNewlines) {
    clean = clean.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  } else {
    clean = clean.replace(/[\x01-\x1F\x7F]/g, " ");
  }

  // 2. Strip potential malicious tags, scripts, and event handlers
  clean = clean.replace(/<\s*(script|iframe|embed|object)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  clean = clean.replace(/<\s*(script|iframe|embed|object)[^>]*\/?\s*>/gi, "");
  clean = clean.replace(/javascript:/gi, "");
  clean = clean.replace(/vbscript:/gi, "");
  clean = clean.replace(/data:text\/html/gi, "");
  clean = clean.replace(/\son\w+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, "");

  // 3. Trim and enforce length limit
  clean = clean.trim();
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength);
  }

  return clean;
}

/**
 * Validate and sanitize URL redirects to prevent Open Redirect attacks.
 * Only relative URLs starting with a single '/' are permitted.
 */
export function validateSafeRedirect(
  target: string | null | undefined,
  defaultFallback = "/library"
): string {
  if (!target || typeof target !== "string") {
    return defaultFallback;
  }

  const trimmed = target.trim();

  // Reject protocol-relative URLs (//evil.com) or external schemes (http:, https:, javascript:)
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    /^\/[a-z0-9]+:/i.test(trimmed)
  ) {
    return defaultFallback;
  }

  // Basic sanity check: prevent control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return defaultFallback;
  }

  return trimmed;
}

/**
 * Validate URL slugs (lowercase alphanumeric, single hyphens, no trailing/leading hyphens).
 */
export function validateSlug(slug: string): boolean {
  if (!slug || typeof slug !== "string") return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 150;
}

/**
 * Validate review rating (integer 1 through 5).
 */
export function validateRating(rating: unknown): number {
  const num = typeof rating === "number" ? rating : parseInt(String(rating), 10);
  if (isNaN(num) || num < 1 || num > 5 || !Number.isInteger(num)) {
    throw new Error("Rating must be an integer between 1 and 5.");
  }
  return num;
}

/**
 * Validate and sanitize Review submission inputs.
 */
export function validateReviewInput(input: {
  rating: unknown;
  title?: unknown;
  content: unknown;
}) {
  const rating = validateRating(input.rating);

  const title = input.title
    ? sanitizeText(input.title, 120)
    : null;

  const content = sanitizeText(input.content, 5000, { preserveNewlines: true });
  if (!content || content.length < 5) {
    throw new Error("Review content must be at least 5 characters.");
  }

  return { rating, title, content };
}

/**
 * Validate and sanitize Comment submission inputs.
 */
export function validateCommentInput(content: unknown): string {
  const clean = sanitizeText(content, 1500, { preserveNewlines: true });
  if (!clean || clean.length < 1) {
    throw new Error("Comment cannot be empty.");
  }
  return clean;
}

/**
 * Validate community report parameters.
 */
export const VALID_REPORT_TARGETS = [
  "review",
  "comment",
  "user",
  "book",
  "chapter",
  "author",
] as const;

export const VALID_REPORT_REASONS = [
  "spam",
  "harassment",
  "inappropriate",
  "spoiler",
  "other",
] as const;

export function validateReportInput(input: {
  target_type?: unknown;
  targetType?: unknown;
  target_id?: unknown;
  targetId?: unknown;
  reason: unknown;
  details?: unknown;
}) {
  const rawTargetType = input.target_type ?? input.targetType;
  const targetType = String(rawTargetType).toLowerCase();
  if (!VALID_REPORT_TARGETS.includes(targetType as typeof VALID_REPORT_TARGETS[number])) {
    throw new Error(`Invalid report target type: ${targetType}`);
  }

  const rawTargetId = input.target_id ?? input.targetId;
  const targetId = String(rawTargetId).trim();
  if (!targetId || targetId.length < 10) {
    throw new Error("Invalid target ID.");
  }

  const reason = String(input.reason).toLowerCase();
  if (!VALID_REPORT_REASONS.includes(reason as typeof VALID_REPORT_REASONS[number])) {
    throw new Error(`Invalid report reason: ${reason}`);
  }

  const details = input.details
    ? sanitizeText(input.details, 1000, { preserveNewlines: true })
    : null;

  return { targetType, targetId, reason, details };
}

/**
 * File upload validation helpers.
 */
export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"] as const;

export function validateImageUpload(file: {
  name: string;
  type: string;
  size: number;
}) {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  if (file.size > MAX_SIZE) {
    throw new Error("Image file size exceeds the 5MB limit.");
  }

  if (!ALLOWED_IMAGE_MIMES.includes(file.type as typeof ALLOWED_IMAGE_MIMES[number])) {
    throw new Error(`Unsupported image format (${file.type}). Allowed formats: JPEG, PNG, WebP, GIF.`);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext as typeof ALLOWED_IMAGE_EXTENSIONS[number])) {
    throw new Error(`Invalid file extension: .${ext}`);
  }

  return {
    safeExtension: ext === "jpeg" ? "jpg" : ext,
    mimeType: file.type,
  };
}
