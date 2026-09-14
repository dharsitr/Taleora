import { describe, it, expect } from "vitest";
import { sanitizeErrorMessage, createSafeError } from "@/lib/security/error-handler";

describe("Error Sanitization & Information Leakage Prevention Suite", () => {
  it("allows designated user-facing validation and auth messages", () => {
    expect(sanitizeErrorMessage(new Error("Authentication required to perform this action")))
      .toBe("Authentication required to perform this action");

    expect(sanitizeErrorMessage(new Error("Account suspended: Contact support")))
      .toBe("Account suspended: Contact support");

    expect(sanitizeErrorMessage(new Error("Rating must be an integer between 1 and 5")))
      .toBe("Rating must be an integer between 1 and 5");

    expect(sanitizeErrorMessage(new Error("Review content must be at least 5 characters")))
      .toBe("Review content must be at least 5 characters");

    expect(sanitizeErrorMessage(new Error("Image file size exceeds the 5MB limit")))
      .toBe("Image file size exceeds the 5MB limit");

    expect(sanitizeErrorMessage(new Error("Rate limit exceeded. Please wait a moment.")))
      .toBe("Rate limit exceeded. Please wait a moment.");
  });

  it("masks Postgres and database schema leakage", () => {
    const rawPgError = new Error(
      'insert or update on table "chapters" violates foreign key constraint "chapters_book_id_fkey"'
    );
    const sanitized = sanitizeErrorMessage(rawPgError);
    expect(sanitized).toBe("A database constraint prevented this operation. Please verify your inputs.");
    expect(sanitized).not.toContain("chapters_book_id_fkey");
    expect(sanitized).not.toContain("foreign key constraint");

    const pgrstError = new Error("PGRST204: relation public.secret_tokens does not exist");
    const sanitizedPgrst = sanitizeErrorMessage(pgrstError);
    expect(sanitizedPgrst).toBe("A database constraint prevented this operation. Please verify your inputs.");
    expect(sanitizedPgrst).not.toContain("secret_tokens");
    expect(sanitizedPgrst).not.toContain("PGRST204");
  });

  it("masks stack traces and unhandled internal exceptions with fallback", () => {
    const unhandledError = new TypeError("Cannot read properties of undefined (reading 'token_hash')");
    const sanitized = sanitizeErrorMessage(unhandledError);
    expect(sanitized).toBe("An unexpected error occurred. Please try again.");
    expect(sanitized).not.toContain("token_hash");
  });

  it("produces standardized SafeErrorResponse structures via createSafeError", () => {
    const safeResp = createSafeError(
      new Error('duplicate key value violates unique constraint "users_email_key"'),
      "CONFLICT",
      "Email already registered"
    );

    expect(safeResp.success).toBe(false);
    expect(safeResp.code).toBe("CONFLICT");
    expect(safeResp.error).toBe("A database constraint prevented this operation. Please verify your inputs.");
    expect(safeResp.error).not.toContain("users_email_key");
  });

  it("handles null, undefined, or primitive error values gracefully", () => {
    expect(sanitizeErrorMessage(null)).toBe("An unexpected error occurred. Please try again.");
    expect(sanitizeErrorMessage(undefined)).toBe("An unexpected error occurred. Please try again.");
    expect(sanitizeErrorMessage("Raw string error")).toBe("An unexpected error occurred. Please try again.");
  });
});
