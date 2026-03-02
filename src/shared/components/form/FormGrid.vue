<template>
  <div :class="gridClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ columns?: number }>();
const gridClasses = computed(() => {
  const cols = props.columns ?? 2;
  if (cols === 1) {
    return 'grid grid-cols-1 gap-4';
  }
  return 'grid grid-cols-1 gap-4 md:grid-cols-2';
});
</script>
