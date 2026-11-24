import { createStore } from "./create-store";
import { ChapterStatus, ScheduleType } from "@/types/books";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface LocalDraftBackup {
  chapterId?: string;
  bookId: string;
  title: string;
  content: string;
  chapterNumber: number;
  wordCount: number;
  updatedAt: number;
}

const DRAFT_STORAGE_PREFIX = "taleora_draft_backup_";
const inMemoryDrafts = new Map<string, string>();

/**
 * Persists a snapshot of an author's active chapter draft into localStorage.
 */
export function saveLocalDraftBackup(key: string, data: LocalDraftBackup): void {
  const serialized = JSON.stringify(data);
  inMemoryDrafts.set(key, serialized);
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(`${DRAFT_STORAGE_PREFIX}${key}`, serialized);
    } catch (err) {
      console.warn("Failed to write draft backup to localStorage:", err);
    }
  }
}

/**
 * Retrieves a previously saved local draft backup if one exists.
 */
export function getLocalDraftBackup(key: string): LocalDraftBackup | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${key}`);
      if (raw) return JSON.parse(raw);
    } catch {
      // Fallback to in-memory store
    }
  }
  const mem = inMemoryDrafts.get(key);
  return mem ? JSON.parse(mem) : null;
}

/**
 * Purges a local draft backup after a successful database publication or manual discard.
 */
export function clearLocalDraftBackup(key: string): void {
  inMemoryDrafts.delete(key);
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${key}`);
    } catch {
      // Ignore storage exceptions
    }
  }
}

interface StudioDraftState {
  bookId: string | null;
  chapterId: string | null;
  title: string;
  chapterNumber: number;
  slug: string;
  content: string;
  status: ChapterStatus;
  scheduleType: ScheduleType;
  scheduledDateTime: string;

  // Autosave & Dirty tracking
  isDirty: boolean;
  autosaveStatus: AutosaveStatus;
  lastSavedAt: number | null;

  // Actions
  initDraft: (data: {
    bookId: string;
    chapterId?: string;
    title: string;
    chapterNumber: number;
    slug: string;
    content: string;
    status: ChapterStatus;
    scheduleType?: ScheduleType;
    scheduledDateTime?: string;
  }) => void;
  updateField: (
    field:
      | "title"
      | "content"
      | "slug"
      | "chapterNumber"
      | "status"
      | "scheduleType"
      | "scheduledDateTime",
    value: any
  ) => void;
  setAutosaveStatus: (status: AutosaveStatus) => void;
  markSaved: () => void;
  resetDraft: () => void;
}

export const useStudioStore = createStore<StudioDraftState>(
  (set) => ({
    bookId: null,
    chapterId: null,
    title: "",
    chapterNumber: 1,
    slug: "",
    content: "",
    status: "draft",
    scheduleType: "immediate",
    scheduledDateTime: "",

    isDirty: false,
    autosaveStatus: "idle",
    lastSavedAt: null,

    initDraft: (data) =>
      set({
        bookId: data.bookId,
        chapterId: data.chapterId || null,
        title: data.title,
        chapterNumber: data.chapterNumber,
        slug: data.slug,
        content: data.content,
        status: data.status,
        scheduleType: data.scheduleType || "immediate",
        scheduledDateTime: data.scheduledDateTime || "",
        isDirty: false,
        autosaveStatus: "idle",
      }),

    updateField: (field, value) =>
      set((state) => ({
        ...state,
        [field]: value,
        isDirty: true,
        autosaveStatus: "idle",
      })),

    setAutosaveStatus: (autosaveStatus) =>
      set((state) => ({
        autosaveStatus,
        lastSavedAt: autosaveStatus === "saved" ? Date.now() : state.lastSavedAt,
        isDirty: autosaveStatus === "saved" ? false : state.isDirty,
      })),

    markSaved: () =>
      set({
        isDirty: false,
        autosaveStatus: "saved",
        lastSavedAt: Date.now(),
      }),

    resetDraft: () =>
      set({
        bookId: null,
        chapterId: null,
        title: "",
        chapterNumber: 1,
        slug: "",
        content: "",
        status: "draft",
        scheduleType: "immediate",
        scheduledDateTime: "",
        isDirty: false,
        autosaveStatus: "idle",
        lastSavedAt: null,
      }),
  }),
  {
    persistKey: "taleora-studio-draft-backup",
  }
);
