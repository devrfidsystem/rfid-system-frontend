<template>
  <label class="flex flex-col gap-1 text-sm text-gray-600">
    <span v-if="label" class="font-semibold text-gray-700">{{ label }}</span>
    <div class="relative">
      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        :disabled="disabled"
        :class="selectClasses"
        v-bind="attrs"
      >
        <option v-if="placeholder" value="">{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <Icon class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" :icon="ChevronDown" :size="18" />
    </div>
    <p v-if="hint && !error && !hideMessage" class="text-xs text-gray-500">{{ hint }}</p>
    <p v-if="error && !hideMessage" class="text-xs text-error-600">{{ error }}</p>
  </label>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

import { computed, useAttrs } from 'vue';
import Icon from './Icon.vue';
import { ChevronDown } from 'lucide-vue-next';

const props = defineProps<{
  label?: string;
  modelValue?: string;
  options: { label: string; value: string | number }[];
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  invalid?: boolean;
  hideMessage?: boolean;
}>();

const attrs = useAttrs();

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const baseClasses =
  'w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm font-medium text-gray-900 transition focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 disabled:cursor-not-allowed disabled:opacity-60';

const errorClasses = 'border-error-500 focus:ring-error-100 focus:border-error-500';

const hasVisualError = computed(() => props.invalid || Boolean(props.error));
const selectClasses = computed(() =>
  hasVisualError.value ? `${baseClasses} ${errorClasses}` : baseClasses
);
</script>
