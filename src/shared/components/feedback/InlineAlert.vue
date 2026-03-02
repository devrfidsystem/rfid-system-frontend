<template>
  <div
    :class="['w-full rounded-md border px-4 py-3 text-gray-900', variantClasses]"
    :role="variantRole"
    :aria-live="ariaLive"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-start gap-3">
        <span v-if="$slots.icon" class="text-lg text-current">
          <slot name="icon" />
        </span>
        <span v-else class="text-lg text-current" aria-hidden="true">{{ icon }}</span>
        <div class="space-y-1">
          <p v-if="title" class="text-sm font-semibold text-gray-900">{{ title }}</p>
          <p v-if="description" class="text-sm text-gray-600">{{ description }}</p>
          <slot />
        </div>
      </div>
      <div class="flex items-center gap-2">
        <slot name="actions" />
        <Button
          v-if="closable"
          variant="ghost"
          size="sm"
          type="button"
          class="px-1"
          aria-label="Close alert"
          @click="$emit('close')"
        >
          ×
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Button from '@/app/ui/Button.vue';

const iconMap: Record<'info' | 'success' | 'warning' | 'error', string> = {
  info: 'ℹ️',
  success: '✓',
  warning: '⚠️',
  error: '✕'
};

const props = defineProps<{
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  description?: string;
  closable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const computedVariant = computed(() => props.variant ?? 'info');
const variantClassMap: Record<'info' | 'success' | 'warning' | 'error', string> = {
  info: 'bg-blue-50 border-blue-200',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  error: 'bg-error-50 border-error-200'
};
const variantClasses = computed(() => variantClassMap[computedVariant.value]);
const variantRole = computed(() =>
  computedVariant.value === 'warning' || computedVariant.value === 'error' ? 'alert' : 'status'
);
const ariaLive = computed(() =>
  computedVariant.value === 'warning' || computedVariant.value === 'error' ? 'assertive' : 'polite'
);
const icon = computed(() => iconMap[computedVariant.value]);
</script>
