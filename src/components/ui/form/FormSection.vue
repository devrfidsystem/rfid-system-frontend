<template>
    <section :class="sectionClass">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-xs uppercase tracking-wider text-gray-400">
                    {{ subtitle }}
                </p>
                <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
            </div>
            <slot name="actions" />
        </div>
        <p v-if="description" class="text-sm text-gray-500">
            {{ description }}
        </p>
        <div>
            <slot />
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{
    title: string;
    subtitle?: string;
    description?: string;
    variant?: "card" | "plain";
}>();

const sectionClass = computed(() =>
    props.variant === "card"
        ? "space-y-4 border border-gray-200 rounded-md bg-white p-6 shadow-sm"
        : "space-y-4",
);
</script>
