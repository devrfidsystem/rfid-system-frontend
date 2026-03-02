<template>
  <section :class="cardClasses">
    <slot />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ class?: string }>();

const cardClasses = computed(() =>
  ['rounded-md border border-gray-200 bg-white shadow-sm px-5 py-4', props.class ?? '']
    .join(' ')
    .trim()
);
</script>
