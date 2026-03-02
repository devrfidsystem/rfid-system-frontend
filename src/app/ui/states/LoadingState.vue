<template>
  <div class="space-y-3">
    <SkeletonLine v-for="n in lines" :key="n" :width="width" />
  </div>
</template>

<script setup lang="ts">
import SkeletonLine from './SkeletonLine.vue';

const props = defineProps<{
  lines?: number;
  width?: string;
}>();

const lines = props.lines ?? 4;
const width = props.width ?? 'w-full';
</script>
