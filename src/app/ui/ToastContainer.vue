<template>
  <div aria-live="polite" aria-atomic="true">
    <Toast :toasts="store.toasts" />
  </div>
</template>

<script setup lang="ts">
import Toast from './Toast.vue';
import { useNotificationStore } from '@/stores/notificationStore';

const store = useNotificationStore();
</script>
