<template>
  <label class="flex flex-col gap-1 text-sm text-gray-600">
    <span v-if="label" class="font-semibold text-gray-700">{{ label }}</span>

    <textarea
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="computedRows"
      :class="textareaClasses"
      @input="onInput"
      v-bind="attrs"
    />

    <p v-if="hint && !error && !hideMessage" class="text-xs text-gray-500">{{ hint }}</p>
    <p v-if="error && !hideMessage" class="text-xs text-error-600">{{ error }}</p>
  </label>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

import { computed, useAttrs } from 'vue';

const props = defineProps<{
  label?: string;
  modelValue?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  invalid?: boolean;
  hideMessage?: boolean;
  rows?: number;
}>();

const attrs = useAttrs();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement | null;
  emit('update:modelValue', target?.value ?? '');
};

const baseClasses =
  'w-full rounded-md border bg-white px-3 py-2 text-sm font-medium text-gray-900 transition ' +
  'border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-100';

const errorClasses =
  'border-error-500 bg-error-50 focus:ring-error-50 focus:border-error-500';

const hasVisualError = computed(() => props.invalid || Boolean(props.error));
const textareaClasses = computed(() =>
  hasVisualError.value ? `${baseClasses} ${errorClasses}` : baseClasses
);

const computedRows = computed(() => props.rows ?? 3);
</script>
