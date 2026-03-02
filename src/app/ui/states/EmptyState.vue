<template>
  <div class="table-empty">
    <Icon :icon="iconToRender" :size="32" className="text-gray-400" />
    <p class="text-base font-semibold text-gray-900">{{ title }}</p>
    <p v-if="description" class="text-sm text-gray-500">{{ description }}</p>
    <div v-if="$slots.action" class="mt-2 flex justify-center">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '@/app/ui/Icon.vue';
import { Inbox } from 'lucide-vue-next';
import type { Component } from 'vue';

const props = defineProps<{
  title: string;
  description?: string;
  icon?: Component;
}>();

const iconToRender = props.icon ?? Inbox;
</script>
