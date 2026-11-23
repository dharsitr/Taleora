import { createStore } from "./create-store";
import { ReaderSettings, HighlightRow } from "@/types/books";

export type ReaderDrawerType = "none" | "chapters" | "settings" | "bookmarks" | "highlights";

interface ReaderState {
  // Settings
  settings: ReaderSettings;
  updateSettings: (newSettings: Partial<ReaderSettings>) => void;
  resetSettings: () => void;

  // Active Reading Session
  activeDrawer: ReaderDrawerType;
  setActiveDrawer: (drawer: ReaderDrawerType) => void;
  currentPage: number;
  totalPages: number;
  setPage: (page: number, total?: number) => void;

  // Highlights & Notes
  selectedHighlight: HighlightRow | null;
  setSelectedHighlight: (highlight: HighlightRow | null) => void;
  isNoteModalOpen: boolean;
  setIsNoteModalOpen: (open: boolean) => void;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: "light",
  fontSize: 18,
  lineHeight: 1.8,
  width: "standard",
  fontFamily: "serif",
  zenMode: false,
  pageLayout: "spread",
  readerMode: "3d",
};

export const useReaderStore = createStore<ReaderState>(
  (set) => ({
    settings: DEFAULT_SETTINGS,
    updateSettings: (newSettings) =>
      set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),
    resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

    activeDrawer: "none",
    setActiveDrawer: (drawer) => set({ activeDrawer: drawer }),

    currentPage: 1,
    totalPages: 1,
    setPage: (currentPage, total) =>
      set((state) => ({
        currentPage,
        totalPages: total !== undefined ? total : state.totalPages,
      })),

    selectedHighlight: null,
    setSelectedHighlight: (selectedHighlight) => set({ selectedHighlight }),
    isNoteModalOpen: false,
    setIsNoteModalOpen: (isNoteModalOpen) => set({ isNoteModalOpen }),
  }),
  {
    persistKey: "taleora-reader-settings-v2",
  }
);
