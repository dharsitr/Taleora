import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeRichText } from "@/lib/security/validation";
import { checkRateLimit, checkDistributedRateLimit } from "@/lib/security/rate-limit";
import { isValidIdempotencyKey } from "@/lib/security/idempotency";
import { encodeWatermark, extractContentWatermark } from "@/lib/security/content-protection";
import { useReaderStore } from "@/lib/stores/reader-store";
import {
  useStudioStore,
  saveLocalDraftBackup,
  getLocalDraftBackup,
  clearLocalDraftBackup,
} from "@/lib/stores/studio-store";
import { useOfflineStore } from "@/lib/stores/offline-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { ambientSoundscapes } from "@/lib/audio/ambient-soundscapes";
import { textToSpeechEngine } from "@/lib/audio/text-to-speech";

describe("Enterprise Security & State Management Hardening", () => {
  describe("Deep Sanitization & Rich Text Validation", () => {
    it("strips dangerous SVG, MATH, and FORM vectors", () => {
      const payload = `<svg onload="alert(1)"><form action="/steal"><input name="pass"></form></svg>Hello Story`;
      const clean = sanitizeText(payload);
      expect(clean).not.toContain("<svg");
      expect(clean).not.toContain("<form");
      expect(clean).not.toContain("onload");
      expect(clean).toContain("Hello Story");
    });

    it("sanitizeRichText allows safe semantic tags while stripping scripts and attributes", () => {
      const richContent = `<p>Chapter One</p><script>hack()</script><b>Bold</b> <i onclick="bad()">Italic</i><blockquote>Quote</blockquote>`;
      const clean = sanitizeRichText(richContent);
      expect(clean).toContain("<p>Chapter One</p>");
      expect(clean).toContain("<b>Bold</b>");
      expect(clean).toContain("<i>Italic</i>");
      expect(clean).toContain("<blockquote>Quote</blockquote>");
      expect(clean).not.toContain("<script>");
      expect(clean).not.toContain("onclick");
      expect(clean).not.toContain("bad()");
    });
  });

  describe("Distributed Rate Limiting & Idempotency", () => {
    it("validates idempotency keys strictly", () => {
      expect(isValidIdempotencyKey("idem-key-1234567890abcdef")).toBe(true);
      expect(isValidIdempotencyKey("short")).toBe(false);
      expect(isValidIdempotencyKey("invalid;drop table")).toBe(false);
    });

    it("distributed rate limiter falls back gracefully to in-memory sliding window", async () => {
      const result = await checkDistributedRateLimit("test-dist-key", 5, 10000);
      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
    });
  });

  describe("Steganographic Content Watermarking", () => {
    it("encodes and successfully extracts user watermark from leaked text", () => {
      const secretUserId = "usr-8f9b-4e78-b954";
      const chapterText = "The dragon soared into the tempestuous skies above the citadel.";

      const watermarked = `${chapterText}\u200D${encodeWatermark(secretUserId)}\u200D`;
      const extracted = extractContentWatermark(watermarked);

      expect(extracted).toBe(secretUserId);
    });

    it("returns null when no watermark is present", () => {
      expect(extractContentWatermark("Plain chapter text without watermark.")).toBeNull();
    });
  });

  describe("Unified State Stores", () => {
    it("manages Reader Store updates cleanly", () => {
      useReaderStore.getState().updateSettings({ fontSize: 22, theme: "sepia" });
      const current = useReaderStore.getState();
      expect(current.settings.fontSize).toBe(22);
      expect(current.settings.theme).toBe("sepia");
    });

    it("tracks Studio draft dirty state and autosave status", () => {
      useStudioStore.getState().initDraft({
        bookId: "book-123",
        title: "New Novel",
        chapterNumber: 1,
        slug: "new-novel",
        content: "Draft content...",
        status: "draft",
      });

      expect(useStudioStore.getState().isDirty).toBe(false);
      useStudioStore.getState().updateField("content", "Updated chapter draft...");
      expect(useStudioStore.getState().isDirty).toBe(true);

      useStudioStore.getState().markSaved();
      expect(useStudioStore.getState().isDirty).toBe(false);
      expect(useStudioStore.getState().autosaveStatus).toBe("saved");
    });

    it("saves, retrieves, and clears local chapter draft backups", () => {
      const mockKey = "test-chapter-123";
      const mockBackup = {
        chapterId: "test-chapter-123",
        bookId: "book-abc",
        title: "Chapter 1: The Awakening",
        content: "Deep in the enchanted forest...",
        chapterNumber: 1,
        wordCount: 5,
        updatedAt: Date.now(),
      };

      saveLocalDraftBackup(mockKey, mockBackup);
      const retrieved = getLocalDraftBackup(mockKey);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.title).toBe("Chapter 1: The Awakening");
      expect(retrieved?.content).toContain("enchanted forest");

      clearLocalDraftBackup(mockKey);
      expect(getLocalDraftBackup(mockKey)).toBeNull();
    });

    it("updates Offline Store connectivity and storage quota", () => {
      useOfflineStore.getState().setOnline(false);
      expect(useOfflineStore.getState().isOnline).toBe(false);

      useOfflineStore.getState().setStorageQuota({
        usedBytes: 10000,
        quotaBytes: 100000,
        percentUsed: 10,
      });
      expect(useOfflineStore.getState().storageQuota.percentUsed).toBe(10);
    });

    it("manages UI store toast queue", () => {
      const toastId = useUIStore.getState().addToast({
        type: "success",
        message: "Chapter saved successfully!",
        durationMs: 0, // don't auto-dismiss during test
      });

      expect(useUIStore.getState().toasts.some((t) => t.id === toastId)).toBe(true);
      useUIStore.getState().removeToast(toastId);
      expect(useUIStore.getState().toasts.some((t) => t.id === toastId)).toBe(false);
    });
  });

  describe("Web Audio Ambient Soundscapes & Speech Synthesis", () => {
    it("handles ambient soundscape volume and activation gracefully", () => {
      ambientSoundscapes.setVolume(0.7);
      expect(ambientSoundscapes.getVolume()).toBe(0.7);
      ambientSoundscapes.stop();
      expect(ambientSoundscapes.getActive()).toBeNull();
    });

    it("verifies TextToSpeech state and pace adjustment", () => {
      textToSpeechEngine.setSpeed(1.25);
      const state = textToSpeechEngine.getState();
      expect(state.speed).toBe(1.25);
      expect(state.isPlaying).toBe(false);
      textToSpeechEngine.stop();
    });
  });
});
