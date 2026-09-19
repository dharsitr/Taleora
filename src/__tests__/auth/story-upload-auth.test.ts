import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createStory,
  uploadCoverImage,
  updateStory,
  createChapter,
} from "@/lib/books/queries";
import { POST as createStoryRoute } from "@/app/api/stories/route";
import { NextRequest } from "next/server";

// Mock Supabase browser client
vi.mock("@/lib/supabase/client", () => ({
  createBrowserClient: vi.fn(() => ({
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  })),
}));

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("Story & Media Upload Authentication Verification", () => {
  const mockCreateClient = vi.mocked(createClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Client Library Auth Checks", () => {
    it("createStory throws an Authentication required error if userId is missing or empty", async () => {
      await expect(
        createStory("", {
          title: "Unauthenticated Story",
        })
      ).rejects.toThrow("Authentication required: You must be logged in to create a story.");

      await expect(
        createStory(null as unknown as string, {
          title: "Unauthenticated Story",
        })
      ).rejects.toThrow("Authentication required: You must be logged in to create a story.");
    });

    it("uploadCoverImage returns null and logs error if userId is missing or empty", async () => {
      const mockFile = new File(["dummy content"], "cover.jpg", { type: "image/jpeg" });
      const result = await uploadCoverImage("", mockFile);
      expect(result).toBeNull();

      const resultNull = await uploadCoverImage(null as unknown as string, mockFile);
      expect(resultNull).toBeNull();
    });

    it("updateStory throws an Authentication required error if userId is missing or empty", async () => {
      await expect(
        updateStory("", "book-123", {
          title: "Updated Story",
        })
      ).rejects.toThrow("Authentication required: You must be logged in to update a story.");
    });

    it("createChapter throws an Authentication required error if userId is missing or empty", async () => {
      await expect(
        createChapter("", "book-123", {
          title: "Chapter 1",
          content: "Chapter content",
          status: "draft",
        })
      ).rejects.toThrow("Authentication required: You must be logged in to create a chapter.");
    });
  });

  describe("REST API POST /api/stories Auth Gate", () => {
    it("returns HTTP 401 Unauthorized when an unauthenticated client tries to POST /api/stories", async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error("No session found"),
          }),
        },
      } as any);

      const request = new NextRequest("http://localhost:3000/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Hack Attempt Story",
          status: "published",
        }),
      });

      const response = await createStoryRoute(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error).toBe("Unauthorized");
      expect(json.message).toContain("Authentication required");
    });
  });
});
