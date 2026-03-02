<template>
  <div :class="['grid gap-4', columnsClass]">
    <div v-for="field in fieldsComputed" :key="`field-${field}`" class="space-y-2">
      <SkeletonBlock height="0.75rem" width="60%" />
      <SkeletonBlock height="2.25rem" width="100%" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SkeletonBlock from './SkeletonBlock.vue';

const props = defineProps<{
  fields?: number;
  columns?: 1 | 2;
}>();

const fieldsComputed = computed(() => Array.from({ length: props.fields ?? 6 }, (_, index) => index));
const columnsClass = computed(() =>
  props.columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
);
</script>
