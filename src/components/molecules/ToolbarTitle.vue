<template>
    <div class="min-w-0" data-toolbar-title>
        <h3 class="truncate text-base font-semibold text-text">
            {{ title }}
        </h3>
        <p v-if="description" class="mt-1 text-xs text-text-secondary">
            {{ description }}
        </p>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string;
    description?: string;
}>();
</script>
