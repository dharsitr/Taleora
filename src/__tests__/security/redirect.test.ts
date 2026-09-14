import { describe, it, expect } from "vitest";
import { validateSafeRedirect } from "@/lib/security/validation";

describe("Open Redirect Protection Suite", () => {
  it("allows standard internal relative navigation paths", () => {
    expect(validateSafeRedirect("/")).toBe("/");
    expect(validateSafeRedirect("/library")).toBe("/library");
    expect(validateSafeRedirect("/books/crime-and-punishment")).toBe("/books/crime-and-punishment");
    expect(validateSafeRedirect("/books/123/read?chapter=5")).toBe("/books/123/read?chapter=5");
    expect(validateSafeRedirect("/admin/reports#resolved")).toBe("/admin/reports#resolved");
    expect(validateSafeRedirect("/studio/new")).toBe("/studio/new");
  });

  it("blocks protocol-relative URL exploits (//evil.com)", () => {
    expect(validateSafeRedirect("//evil.com")).toBe("/library");
    expect(validateSafeRedirect("//attacker.com/login")).toBe("/library");
    expect(validateSafeRedirect("///attacker.com")).toBe("/library");
  });

  it("blocks absolute URLs to external hosts", () => {
    expect(validateSafeRedirect("https://google.com")).toBe("/library");
    expect(validateSafeRedirect("http://malicious-site.org/phish")).toBe("/library");
    expect(validateSafeRedirect("ftp://files.attacker.com")).toBe("/library");
  });

  it("blocks backslash evasion attacks (/\\evil.com)", () => {
    expect(validateSafeRedirect("/\\evil.com")).toBe("/library");
    expect(validateSafeRedirect("/\\/attacker.com")).toBe("/library");
    expect(validateSafeRedirect("\\\\evil.com")).toBe("/library");
  });

  it("blocks javascript: and data: pseudo-protocols", () => {
    expect(validateSafeRedirect("javascript:alert(document.cookie)")).toBe("/library");
    expect(validateSafeRedirect("data:text/html,<script>alert(1)</script>")).toBe("/library");
    expect(validateSafeRedirect("vbscript:msgbox")).toBe("/library");
  });

  it("supports customizable default fallback paths", () => {
    expect(validateSafeRedirect("https://evil.com", "/discover")).toBe("/discover");
    expect(validateSafeRedirect(null, "/profile")).toBe("/profile");
    expect(validateSafeRedirect(undefined, "/auth/login")).toBe("/auth/login");
    expect(validateSafeRedirect("", "/home")).toBe("/home");
  });
});
