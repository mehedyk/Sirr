import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms, default 4000
}

interface ToastState {
  toasts: Toast[];
  push: (type: ToastType, message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (type, message, duration = 4000) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, type, message, duration }] }));
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Convenience helpers — import these anywhere
export const toast = {
  success: (msg: string, d?: number) => useToastStore.getState().push('success', msg, d),
  error:   (msg: string, d?: number) => useToastStore.getState().push('error',   msg, d),
  warning: (msg: string, d?: number) => useToastStore.getState().push('warning', msg, d),
  info:    (msg: string, d?: number) => useToastStore.getState().push('info',    msg, d),
};
