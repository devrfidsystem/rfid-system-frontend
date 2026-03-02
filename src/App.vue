<template>
  <router-view />
</template>

<script setup lang="ts">
import { useTheme } from '@/app/composables/useTheme';

useTheme();
</script>
