<template>
    <div
        class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
        <div class="min-w-0">
            <div class="flex items-start gap-3">
                <div class="min-w-0">
                    <p
                        v-if="tagline"
                        class="text-sm font-medium text-gray-500 mb-1"
                    >
                        {{ tagline }}
                    </p>

                    <h1
                        class="truncate text-2xl font-bold tracking-tight text-gray-900"
                    >
                        {{ title }}
                    </h1>
                </div>
            </div>

            <p
                v-if="description"
                class="mt-1.5 max-w-3xl text-sm text-gray-500"
            >
                {{ description }}
            </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 sm:justify-end">
            <slot name="actions" />
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string;
    description?: string;
    tagline?: string;
}>();
</script>
