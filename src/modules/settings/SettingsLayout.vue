<template>
  <section class="space-y-6">
    <PageHeader title="Settings" description="Access and navigation guards." />
    <router-view v-slot="{ Component, route }">
      <component :is="Component" :key="route.fullPath" />
    </router-view>
  </section>
</template>

<script setup lang="ts">
import PageHeader from '@/app/ui/PageHeader.vue';
</script>
