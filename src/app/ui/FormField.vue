<template>
  <div class="space-y-1">
    <div v-if="label || hint" class="flex items-center justify-between gap-2 text-sm font-medium text-gray-700">
      <p v-if="label" class="flex items-center gap-2">
        <span>{{ label }}</span>
        <span v-if="required" class="text-error-600">*</span>
      </p>
      <p v-if="hint" class="text-xs font-normal text-gray-500">{{ hint }}</p>
    </div>
    <div>
      <slot />
    </div>
    <p v-if="error" class="text-xs text-error-600" aria-live="polite">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
}>();
</script>
