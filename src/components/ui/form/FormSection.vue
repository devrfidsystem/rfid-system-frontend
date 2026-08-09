<template>
    <section :class="sectionClass">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-xs text-text-muted">
                    {{ subtitle }}
                </p>
                <h2 class="text-lg font-semibold text-text">{{ title }}</h2>
            </div>
            <slot name="actions" />
        </div>
        <p v-if="description" class="text-sm text-text-secondary">
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
        ? "space-y-4 border border-border rounded-md bg-surface px-6 py-5 shadow-sm"
        : "space-y-4",
);
</script>
