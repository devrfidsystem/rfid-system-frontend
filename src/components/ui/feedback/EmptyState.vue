<template>
    <div :class="containerClass">
        <div v-if="$slots.icon || icon" class="mb-4 text-2xl text-text-muted">
            <slot name="icon">
                <component :is="icon" v-if="icon" aria-hidden="true" />
            </slot>
        </div>
        <p class="text-lg font-semibold text-text">{{ title }}</p>
        <p v-if="description" class="text-sm text-text-secondary">
            {{ description }}
        </p>
        <div v-if="$slots.actions" class="mt-4 flex justify-center">
            <slot name="actions" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";

const props = defineProps<{
    title: string;
    description?: string;
    icon?: Component;
    size?: "sm" | "md";
}>();

const containerClass = computed(() => [
    "flex flex-col items-center text-center rounded-md border border-border bg-surface-secondary/50 px-6 py-8",
    props.size === "sm" ? "max-w-xs" : "max-w-md",
]);
</script>
