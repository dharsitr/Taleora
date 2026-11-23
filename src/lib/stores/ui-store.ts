import { createStore } from "./create-store";

export interface ToastMessage {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title?: string;
  message: string;
  durationMs?: number;
}

interface UIState {
  // Modals
  mfaModalOpen: boolean;
  profileModalOpen: boolean;
  reportModalData: { isOpen: boolean; targetType?: string; targetId?: string };
  deleteModalData: {
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm?: () => Promise<void> | void;
  };

  // Toast Notifications
  toasts: ToastMessage[];

  // Actions
  setMfaModalOpen: (open: boolean) => void;
  setProfileModalOpen: (open: boolean) => void;
  openReportModal: (targetType: string, targetId: string) => void;
  closeReportModal: () => void;
  openDeleteModal: (config: {
    title: string;
    description: string;
    onConfirm: () => Promise<void> | void;
  }) => void;
  closeDeleteModal: () => void;
  addToast: (toast: Omit<ToastMessage, "id">) => string;
  removeToast: (id: string) => void;
}

export const useUIStore = createStore<UIState>((set) => ({
  mfaModalOpen: false,
  profileModalOpen: false,
  reportModalData: { isOpen: false },
  deleteModalData: {
    isOpen: false,
    title: "",
    description: "",
  },
  toasts: [],

  setMfaModalOpen: (mfaModalOpen) => set({ mfaModalOpen }),
  setProfileModalOpen: (profileModalOpen) => set({ profileModalOpen }),

  openReportModal: (targetType, targetId) =>
    set({ reportModalData: { isOpen: true, targetType, targetId } }),
  closeReportModal: () => set({ reportModalData: { isOpen: false } }),

  openDeleteModal: (config) =>
    set({
      deleteModalData: {
        isOpen: true,
        title: config.title,
        description: config.description,
        onConfirm: config.onConfirm,
      },
    }),
  closeDeleteModal: () =>
    set({
      deleteModalData: {
        isOpen: false,
        title: "",
        description: "",
        onConfirm: undefined,
      },
    }),

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    const duration = toast.durationMs ?? 4000;
    if (duration > 0 && typeof setTimeout !== "undefined") {
      setTimeout(() => {
        useUIStore.getState().removeToast(id);
      }, duration);
    }
    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
