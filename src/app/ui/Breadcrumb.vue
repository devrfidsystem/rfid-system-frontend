<template>
  <nav class="text-xs text-gray-500" aria-label="breadcrumb">
    <ul class="flex items-center gap-2">
      <li v-for="(item, index) in items" :key="item.label" class="flex items-center gap-2">
        <span :class="item.active ? 'text-gray-900 font-semibold' : ''">{{ item.label }}</span>
        <span v-if="index < items.length - 1">/</span>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{
  items: { label: string; active?: boolean }[];
}>();
</script>
