<template>
  <div class="fixed right-6 top-6 z-[60] w-[360px] max-w-[calc(100vw-3rem)] space-y-3">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="group relative overflow-hidden rounded-md border bg-white shadow-sm"
      :class="variantClass(toast.variant)"
      role="status"
      aria-live="polite"
      @mouseenter="$emit('pause', toast.id)"
      @mouseleave="$emit('resume', toast.id)"
    >
      <div class="flex items-start gap-3 px-4 py-3">
        <div class="mt-0.5 shrink-0">
          <Icon :icon="variantIcon(toast.variant)" :size="18" :className="variantIconClass(toast.variant)" />
        </div>

        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-gray-900">
            {{ toast.message }}
          </p>
        </div>

        <button
          type="button"
          class="rounded-md p-1 text-gray-400 opacity-0 transition hover:bg-gray-50 hover:text-gray-600 group-hover:opacity-100 focus-visible:opacity-100"
          @click="$emit('close', toast.id)"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      <div class="h-1 w-full" :class="variantBarClass(toast.variant)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '@/app/ui/Icon.vue';
import type { ToastVariant } from '@/stores/notificationStore';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-vue-next';

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
};

defineProps<{
  toasts: ToastItem[];
}>();

defineEmits<{
  (e: 'close', id: string): void;
  (e: 'pause', id: string): void;
  (e: 'resume', id: string): void;
}>();

const variantClass = (v: ToastVariant) => {
  switch (v) {
    case 'success':
      return 'border-success-50';
    case 'error':
      return 'border-error-50';
    case 'warning':
      return 'border-warning-50';
    case 'info':
      return 'border-secondary-500/20';
    default:
      return 'border-gray-200';
  }
};

const variantBarClass = (v: ToastVariant) => {
  switch (v) {
    case 'success':
      return 'bg-success-500';
    case 'error':
      return 'bg-error-500';
    case 'warning':
      return 'bg-warning-500';
    case 'info':
      return 'bg-secondary-500';
    default:
      return 'bg-gray-200';
  }
};

const variantIcon = (v: ToastVariant) => {
  switch (v) {
    case 'success':
      return CheckCircle2;
    case 'error':
      return XCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Info;
    default:
      return Info;
  }
};

const variantIconClass = (v: ToastVariant) => {
  switch (v) {
    case 'success':
      return 'text-success-500';
    case 'error':
      return 'text-error-500';
    case 'warning':
      return 'text-warning-500';
    case 'info':
      return 'text-secondary-500';
    default:
      return 'text-gray-500';
  }
};
</script>
