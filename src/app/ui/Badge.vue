<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  tone?: 'neutral' | 'success' | 'warning' | 'error';
}>();

const toneMap: Record<string, string> = {
  neutral: 'bg-gray-100 text-gray-700',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  error: 'bg-error-50 text-error-600',
  info: 'bg-primary-50 text-primary-600'
};

const badgeClasses = ['inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', toneMap[props.tone ?? 'neutral']].join(' ');
</script>
