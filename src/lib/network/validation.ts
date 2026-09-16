/**
 * Request Validation Schemas and Guards for Taleora REST API.
 * Ensures strict input validation, parameter sanitization, and prevents injection/malformed payloads.
 */

import { sanitizeText } from "@/lib/security/validation";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

export interface ValidatedStoryInput {
  title: string;
  subtitle: string | null;
  description: string | null;
  genreIds: string[];
  cover_gradient: string;
  cover_accent: string;
  status: "draft" | "published";
  release_schedule?: "immediate" | "weekly" | "biweekly" | "monthly";
}

export function validateStoryPayload(raw: unknown): ValidationResult<ValidatedStoryInput> {
  const errors: Record<string, string> = {};

  if (!raw || typeof raw !== "object") {
    return { success: false, errors: { body: "Invalid JSON request body" } };
  }

  const input = raw as Record<string, unknown>;

  // Title validation
  const rawTitle = typeof input.title === "string" ? input.title.trim() : "";
  if (!rawTitle) {
    errors.title = "Story title is required";
  } else if (rawTitle.length < 2) {
    errors.title = "Story title must be at least 2 characters";
  } else if (rawTitle.length > 150) {
    errors.title = "Story title must not exceed 150 characters";
  }

  // Subtitle
  const subtitle =
    typeof input.subtitle === "string" && input.subtitle.trim()
      ? sanitizeText(input.subtitle, 200)
      : null;

  // Description
  const description =
    typeof input.description === "string" && input.description.trim()
      ? sanitizeText(input.description, 3000, { preserveNewlines: true })
      : null;

  // Genres
  let genreIds: string[] = [];
  if (Array.isArray(input.genreIds)) {
    genreIds = input.genreIds
      .filter((g): g is string => typeof g === "string" && g.trim().length > 0)
      .map((g) => g.trim());
  }

  // Cover Gradient & Accent
  const cover_gradient =
    typeof input.cover_gradient === "string" && input.cover_gradient.trim()
      ? input.cover_gradient.trim()
      : "from-amber-700 via-stone-800 to-zinc-950";

  const cover_accent =
    typeof input.cover_accent === "string" && input.cover_accent.trim()
      ? input.cover_accent.trim()
      : "#E28743";

  // Status
  const status: "draft" | "published" =
    input.status === "published" ? "published" : "draft";

  const release_schedule = (
    ["immediate", "weekly", "biweekly", "monthly"].includes(String(input.release_schedule))
      ? input.release_schedule
      : "immediate"
  ) as "immediate" | "weekly" | "biweekly" | "monthly";

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      title: sanitizeText(rawTitle, 150),
      subtitle,
      description,
      genreIds,
      cover_gradient,
      cover_accent,
      status,
      release_schedule,
    },
  };
}

export interface ValidatedChapterInput {
  chapter_number: number;
  title: string;
  content: string;
  status: "draft" | "published" | "scheduled";
  schedule_type?: string;
  scheduled_for?: string | null;
}

export function validateChapterPayload(raw: unknown): ValidationResult<ValidatedChapterInput> {
  const errors: Record<string, string> = {};

  if (!raw || typeof raw !== "object") {
    return { success: false, errors: { body: "Invalid JSON request body" } };
  }

  const input = raw as Record<string, unknown>;

  // Chapter Number
  const rawNum = Number(input.chapter_number);
  if (isNaN(rawNum) || rawNum < 1 || !Number.isInteger(rawNum)) {
    errors.chapter_number = "Chapter number must be an integer greater than or equal to 1";
  }

  // Title
  const rawTitle = typeof input.title === "string" ? input.title.trim() : "";
  if (!rawTitle) {
    errors.title = "Chapter title is required";
  } else if (rawTitle.length > 150) {
    errors.title = "Chapter title must not exceed 150 characters";
  }

  // Content
  const rawContent = typeof input.content === "string" ? input.content.trim() : "";
  if (!rawContent) {
    errors.content = "Chapter content cannot be empty";
  } else if (rawContent.length < 10) {
    errors.content = "Chapter content must contain at least 10 characters";
  }

  // Status
  let status: "draft" | "published" | "scheduled" = "draft";
  if (input.status === "published") {
    status = "published";
  } else if (input.status === "scheduled") {
    status = "scheduled";
  }

  const schedule_type = typeof input.schedule_type === "string" ? input.schedule_type : "immediate";
  const scheduled_for = typeof input.scheduled_for === "string" ? input.scheduled_for : null;

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      chapter_number: rawNum,
      title: sanitizeText(rawTitle, 150),
      content: sanitizeText(rawContent, 100000, { preserveNewlines: true }),
      status,
      schedule_type,
      scheduled_for,
    },
  };
}

export interface ValidatedStoryQueryParams {
  search?: string;
  genre?: string;
  sort?: "newest" | "rating" | "popular" | "trending";
  limit: number;
  offset: number;
}

export function validateStoryQueryParams(url: URL): ValidatedStoryQueryParams {
  const search = url.searchParams.get("q") || url.searchParams.get("search");
  const genre = url.searchParams.get("genre");
  const sortParam = url.searchParams.get("sort");
  const limitParam = parseInt(url.searchParams.get("limit") || "24", 10);
  const offsetParam = parseInt(url.searchParams.get("offset") || "0", 10);

  const sort = ["newest", "rating", "popular", "trending"].includes(sortParam || "")
    ? (sortParam as ValidatedStoryQueryParams["sort"])
    : "newest";

  const limit = Math.min(100, Math.max(1, isNaN(limitParam) ? 24 : limitParam));
  const offset = Math.max(0, isNaN(offsetParam) ? 0 : offsetParam);

  return {
    search: search ? sanitizeText(search, 100) : undefined,
    genre: genre && genre !== "all" ? sanitizeText(genre, 50) : undefined,
    sort,
    limit,
    offset,
  };
}
