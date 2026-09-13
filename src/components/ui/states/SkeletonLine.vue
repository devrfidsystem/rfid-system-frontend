<template>
    <div
        :class="[
            'animate-pulse rounded-[var(--radius-sm)] bg-surface-secondary',
            widthClass,
            heightClass,
        ]"
    />
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
    width?: string;
    height?: string;
}>();

const widthClass = computed(() => props.width ?? "w-full");
const heightClass = computed(() => props.height ?? "h-3");
</script>
