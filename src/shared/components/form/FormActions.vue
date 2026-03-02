<template>
  <div :class="actionClass">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ sticky?: boolean }>();
const actionClass = computed(() =>
  props.sticky ? 'flex justify-end gap-3 border-t border-gray-100 pt-3 sticky bottom-0 bg-white' : 'flex justify-end gap-3'
);
</script>
