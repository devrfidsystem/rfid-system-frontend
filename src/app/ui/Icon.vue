<template>
  <component
    :is="icon"
    :width="size"
    :height="size"
    :class="['inline-flex', className]"
    stroke-width="1.5"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';

const props = defineProps<{ icon: Component; size?: number; className?: string }>();

const size = computed(() => props.size ?? 18);
const className = computed(() => props.className ?? '');
</script>
