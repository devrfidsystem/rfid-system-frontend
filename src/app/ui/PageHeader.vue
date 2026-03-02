<template>
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="min-w-0">
      <div class="flex items-start gap-3">
        <div
          v-if="icon"
          class="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary-100 bg-primary-50 text-primary-700 shadow-sm"
        >
          <Icon :icon="icon" :size="20" />
        </div>

        <div class="min-w-0">
          <p v-if="tagline" class="text-[11px] font-semibold uppercase tracking-[0.28em] text-gray-400">
            {{ tagline }}
          </p>

          <h1 class="mt-1 truncate text-xl font-semibold leading-tight text-gray-900 sm:text-2xl">
            {{ title }}
          </h1>
        </div>
      </div>

      <p v-if="description" class="mt-2 max-w-3xl text-sm leading-relaxed text-gray-500">
        {{ description }}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2 sm:justify-end">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from './Icon.vue';
import type { Component } from 'vue';

defineProps<{
  title: string;
  description?: string;
  tagline?: string;
  icon?: Component;
}>();
</script>