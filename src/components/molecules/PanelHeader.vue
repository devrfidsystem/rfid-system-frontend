<template>
    <div
        class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        data-panel-header
    >
        <div class="min-w-0">
            <h2 class="text-sm font-semibold text-text">
                {{ title }}
            </h2>
            <p v-if="description" class="mt-1 text-xs text-text-secondary">
                {{ description }}
            </p>
        </div>
        <div v-if="$slots.default" class="flex shrink-0 items-center gap-2">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string;
    description?: string;
}>();
</script>
