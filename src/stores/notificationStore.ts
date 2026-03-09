import { defineStore } from 'pinia';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
  createdAt: number;
}

type ToastQueueItem = Omit<ToastMessage, 'createdAt'>;

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    toasts: [] as ToastMessage[],
    queue: [] as ToastQueueItem[],
    maxVisible: 3,
    timers: {} as Record<string, number>
  }),

  actions: {
    notify(
      message: string,
      opts?: { variant?: ToastVariant; duration?: number }
    ) {
      const id = `toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const variant = opts?.variant ?? 'neutral';
      const duration = opts?.duration ?? 3500;

      const item: ToastQueueItem = { id, message, variant, duration };

      if (this.toasts.length < this.maxVisible) {
        this.toasts.push({ ...item, createdAt: Date.now() });
        this.startTimer(id, duration);
      } else {
        this.queue.push(item);
      }

      return id;
    },

    startTimer(id: string, duration: number) {
      this.clearTimer(id);
      const t = window.setTimeout(() => this.removeToast(id), duration);
      this.timers[id] = t;
    },

    clearTimer(id: string) {
      const t = this.timers[id];
      if (t) {
        window.clearTimeout(t);
        delete this.timers[id];
      }
    },

    pause(id: string) {
      this.clearTimer(id);
    },

    resume(id: string) {
      const toast = this.toasts.find((t) => t.id === id);
      if (!toast) return;
      this.startTimer(id, Math.min(2000, toast.duration));
    },

    removeToast(id: string) {
      this.clearTimer(id);
      this.toasts = this.toasts.filter((toast) => toast.id !== id);

      const next = this.queue.shift();
      if (next) {
        this.toasts.push({ ...next, createdAt: Date.now() });
        this.startTimer(next.id, next.duration);
      }
    },

    clearAll() {
      this.toasts.forEach((t) => this.clearTimer(t.id));
      this.toasts = [];
      this.queue = [];
      this.timers = {};
    }
  }
});
