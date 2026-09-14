import { describe, it, expect } from "vitest";
import {
  sanitizeText,
  escapeHtml,
  validateSafeRedirect,
  validateSlug,
  validateRating,
  validateReviewInput,
  validateCommentInput,
  validateReportInput,
  validateImageUpload,
} from "@/lib/security/validation";

describe("Security Validation & Sanitization Suite", () => {
  describe("sanitizeText", () => {
    it("strips null bytes and non-printable control characters", () => {
      const dirty = "Hello\0World\x07!";
      expect(sanitizeText(dirty)).toBe("HelloWorld !");
    });

    it("strips malicious <script> tags and javascript: URIs", () => {
      const xss = "Normal text <script>alert('XSS')</script> more text javascript:void(0)";
      const clean = sanitizeText(xss);
      expect(clean).not.toContain("<script>");
      expect(clean).not.toContain("alert");
      expect(clean).not.toContain("javascript:");
    });

    it("enforces max length truncation", () => {
      const longStr = "a".repeat(100);
      expect(sanitizeText(longStr, 20).length).toBe(20);
    });

    it("preserves newlines when explicitly enabled", () => {
      const multiline = "Line 1\nLine 2\r\nLine 3";
      const clean = sanitizeText(multiline, 100, { preserveNewlines: true });
      expect(clean).toContain("\n");
      expect(clean).toContain("Line 2");
    });
  });

  describe("escapeHtml", () => {
    it("replaces dangerous HTML characters with entities", () => {
      const input = `<img src="x" onerror='alert(1)'> & "test"`;
      const escaped = escapeHtml(input);
      expect(escaped).toContain("&lt;img");
      expect(escaped).toContain("&quot;x&quot;");
      expect(escaped).toContain("&amp;");
      expect(escaped).not.toContain("<");
      expect(escaped).not.toContain(">");
    });
  });

  describe("validateSafeRedirect", () => {
    it("allows safe relative application paths", () => {
      expect(validateSafeRedirect("/library")).toBe("/library");
      expect(validateSafeRedirect("/books/the-odyssey")).toBe("/books/the-odyssey");
      expect(validateSafeRedirect("/admin?tab=reports")).toBe("/admin?tab=reports");
    });

    it("rejects open redirect attack vectors", () => {
      expect(validateSafeRedirect("//evil.com")).toBe("/library");
      expect(validateSafeRedirect("//attacker.org/phish")).toBe("/library");
      expect(validateSafeRedirect("https://malicious.com")).toBe("/library");
      expect(validateSafeRedirect("javascript:alert(1)")).toBe("/library");
      expect(validateSafeRedirect("/\\evil.com")).toBe("/library");
      expect(validateSafeRedirect(null)).toBe("/library");
      expect(validateSafeRedirect(undefined, "/discover")).toBe("/discover");
    });
  });

  describe("validateSlug", () => {
    it("validates kebab-case URL slugs", () => {
      expect(validateSlug("the-great-gatsby")).toBe(true);
      expect(validateSlug("chapter-12")).toBe(true);
      expect(validateSlug("a")).toBe(true);
    });

    it("rejects invalid slugs containing spaces, uppercase, or special characters", () => {
      expect(validateSlug("The Great Gatsby")).toBe(false);
      expect(validateSlug("chapter_12")).toBe(false);
      expect(validateSlug("-leading-dash")).toBe(false);
      expect(validateSlug("trailing-dash-")).toBe(false);
      expect(validateSlug("double--dash")).toBe(false);
      expect(validateSlug("slug/with/slash")).toBe(false);
    });
  });

  describe("validateRating", () => {
    it("accepts valid ratings 1 to 5", () => {
      expect(validateRating(1)).toBe(1);
      expect(validateRating(5)).toBe(5);
      expect(validateRating("4")).toBe(4);
    });

    it("throws on invalid rating values", () => {
      expect(() => validateRating(0)).toThrow("Rating must be an integer between 1 and 5");
      expect(() => validateRating(6)).toThrow("Rating must be an integer between 1 and 5");
      expect(() => validateRating(3.5)).toThrow("Rating must be an integer between 1 and 5");
      expect(() => validateRating("invalid")).toThrow();
    });
  });

  describe("validateReviewInput", () => {
    it("sanitizes title and content and returns valid payload", () => {
      const result = validateReviewInput({
        rating: 5,
        title: "  Masterpiece! <script>bad()</script> ",
        content: "An incredible literary experience with deep characters and prose.",
      });

      expect(result.rating).toBe(5);
      expect(result.title).toBe("Masterpiece!");
      expect(result.content).toContain("incredible literary experience");
    });

    it("rejects content that is too short", () => {
      expect(() =>
        validateReviewInput({
          rating: 4,
          content: "bad",
        })
      ).toThrow("Review content must be at least 5 characters");
    });
  });

  describe("validateCommentInput", () => {
    it("sanitizes comment content", () => {
      const comment = validateCommentInput("  Great insights on this chapter!  ");
      expect(comment).toBe("Great insights on this chapter!");
    });

    it("rejects empty comments", () => {
      expect(() => validateCommentInput("   ")).toThrow("Comment cannot be empty");
      expect(() => validateCommentInput("\0\0")).toThrow("Comment cannot be empty");
    });
  });

  describe("validateReportInput", () => {
    it("validates report parameters correctly", () => {
      const result = validateReportInput({
        target_type: "review",
        target_id: "d4559d0f-8f9b-4e78-b954-95fb5c092aae",
        reason: "spoiler",
        details: "Unmarked major plot twist in chapter 3",
      });

      expect(result.targetType).toBe("review");
      expect(result.reason).toBe("spoiler");
      expect(result.details).toContain("Unmarked major plot twist");
    });

    it("rejects unsupported target types or reasons", () => {
      expect(() =>
        validateReportInput({
          target_type: "invalid_type",
          target_id: "d4559d0f-8f9b-4e78-b954-95fb5c092aae",
          reason: "spoiler",
        })
      ).toThrow("Invalid report target type");

      expect(() =>
        validateReportInput({
          target_type: "review",
          target_id: "d4559d0f-8f9b-4e78-b954-95fb5c092aae",
          reason: "fake_reason",
        })
      ).toThrow("Invalid report reason");
    });
  });

  describe("validateImageUpload", () => {
    it("accepts valid image uploads", () => {
      const file = {
        name: "cover-art.jpg",
        type: "image/jpeg",
        size: 1024 * 1024, // 1MB
      };
      const result = validateImageUpload(file);
      expect(result.safeExtension).toBe("jpg");
      expect(result.mimeType).toBe("image/jpeg");
    });

    it("rejects oversized images (>5MB)", () => {
      const file = {
        name: "huge-cover.png",
        type: "image/png",
        size: 6 * 1024 * 1024, // 6MB
      };
      expect(() => validateImageUpload(file)).toThrow("exceeds the 5MB limit");
    });

    it("rejects dangerous or disallowed MIME types", () => {
      const file = {
        name: "script.svg",
        type: "image/svg+xml",
        size: 1000,
      };
      expect(() => validateImageUpload(file)).toThrow("Unsupported image format");

      const exeFile = {
        name: "malware.exe",
        type: "application/x-msdownload",
        size: 1000,
      };
      expect(() => validateImageUpload(exeFile)).toThrow("Unsupported image format");
    });
  });
});
