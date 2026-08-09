<template>
    <div
        class="flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between"
        :object-id="objectId"
    >
        <div class="min-w-0">
            <h3 class="text-lg font-semibold text-text">
                {{ title }}
            </h3>
            <p class="mt-1 text-sm text-text-secondary">
                {{ description }}
            </p>
        </div>
        <div
            v-if="$slots.default"
            class="flex w-full items-center gap-3 sm:w-auto"
        >
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string;
    description: string;
    objectId?: string;
}>();
</script>
