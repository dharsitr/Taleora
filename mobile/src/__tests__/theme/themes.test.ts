import { describe, it, expect } from "vitest";
import { themes } from "@/context/ThemeContext";

describe("Taleora Mobile Themes Suite", () => {
  it("provides complete Dark, Light, and Sepia palettes", () => {
    expect(themes.dark).toBeDefined();
    expect(themes.light).toBeDefined();
    expect(themes.sepia).toBeDefined();
  });

  it("dark theme contains obsidian background and gold accents", () => {
    expect(themes.dark.background).toBe("#0b0f17");
    expect(themes.dark.accent).toBe("#f59e0b");
    expect(themes.dark.textPrimary).toBe("#f8fafc");
  });

  it("light theme contains clean white surfaces and readable text", () => {
    expect(themes.light.background).toBe("#f8fafc");
    expect(themes.light.surface).toBe("#ffffff");
    expect(themes.light.textPrimary).toBe("#0f172a");
  });

  it("sepia theme contains warm parchment tones", () => {
    expect(themes.sepia.background).toBe("#f6edd9");
    expect(themes.sepia.textPrimary).toBe("#432818");
    expect(themes.sepia.accent).toBe("#9c4a1a");
  });

  it("includes all 5 highlight tint colors across themes", () => {
    ["dark", "light", "sepia"].forEach((mode) => {
      const palette = themes[mode as keyof typeof themes];
      expect(palette.highlightAmber).toBeDefined();
      expect(palette.highlightEmerald).toBeDefined();
      expect(palette.highlightSky).toBeDefined();
      expect(palette.highlightRose).toBeDefined();
      expect(palette.highlightViolet).toBeDefined();
    });
  });
});
