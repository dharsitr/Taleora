/**
 * Secure error handling and information disclosure prevention.
 * Ensures internal database errors, stack traces, and sensitive schema details
 * are logged securely on the server but never leaked to client responses.
 */

export interface SafeErrorResponse {
  success: false;
  error: string;
  code:
    | "VALIDATION_ERROR"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "RATE_LIMITED"
    | "NOT_FOUND"
    | "CONFLICT"
    | "INTERNAL_ERROR";
}

/**
 * Known user-safe error patterns that can be presented directly to the user.
 */
const SAFE_ERROR_MESSAGES = [
  "Authentication required",
  "Forbidden",
  "Account suspended",
  "Rating must be an integer",
  "Review content must be at least",
  "Comment cannot be empty",
  "Invalid report",
  "Image file size exceeds",
  "Unsupported image format",
  "Rate limit exceeded",
  "Please provide a story title",
  "Invalid credentials",
];

/**
 * Format an unknown error into a sanitized client-facing message.
 */
export function sanitizeErrorMessage(err: unknown, defaultMessage = "An unexpected error occurred. Please try again."): string {
  if (!err) return defaultMessage;

  const rawMessage = err instanceof Error ? err.message : String(err);

  // If the message is explicitly intended for user feedback
  const isSafe = SAFE_ERROR_MESSAGES.some((safe) =>
    rawMessage.toLowerCase().includes(safe.toLowerCase())
  );

  if (isSafe) {
    return rawMessage;
  }

  // Mask database / Postgres / network / system errors
  if (
    rawMessage.includes("postgres") ||
    rawMessage.includes("relation") ||
    rawMessage.includes("column") ||
    rawMessage.includes("foreign key") ||
    rawMessage.includes("violates") ||
    rawMessage.includes("PGRST") ||
    rawMessage.includes("duplicate key")
  ) {
    return "A database constraint prevented this operation. Please verify your inputs.";
  }

  // Log actual raw error internally
  if (process.env.NODE_ENV !== "test") {
    console.error("[Internal Application Error]:", rawMessage);
  }

  return defaultMessage;
}

/**
 * Format a structured SafeErrorResponse.
 */
export function createSafeError(
  err: unknown,
  code: SafeErrorResponse["code"] = "INTERNAL_ERROR",
  fallback = "Action could not be completed"
): SafeErrorResponse {
  return {
    success: false,
    code,
    error: sanitizeErrorMessage(err, fallback),
  };
}
