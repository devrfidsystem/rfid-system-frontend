<template>
  <div :class="containerClass">
    <div v-if="$slots.icon || icon" class="mb-4 text-3xl text-gray-400">
      <slot name="icon">
        <component v-if="icon" :is="icon" aria-hidden="true" />
      </slot>
    </div>
    <p class="text-lg font-semibold text-gray-900">{{ title }}</p>
    <p v-if="description" class="text-sm text-gray-600">{{ description }}</p>
    <div v-if="$slots.actions" class="mt-4 flex justify-center">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';

const props = defineProps<{
  title: string;
  description?: string;
  icon?: Component;
  size?: 'sm' | 'md';
}>();

const containerClass = computed(() => [
  'flex flex-col items-center text-center rounded-lg border border-dashed border-gray-200 px-6 py-8',
  props.size === 'sm' ? 'max-w-xs' : 'max-w-md'
]);
</script>
