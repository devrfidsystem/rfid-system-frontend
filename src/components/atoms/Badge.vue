<template>
    <span :class="badgeClasses">
        <slot />
    </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
    tone?:
        | "neutral"
        | "success"
        | "warning"
        | "error"
        | "info"
        | "purple"
        | "teal";
}>();

const toneMap: Record<string, string> = {
    neutral: "bg-surface-secondary text-text-secondary ring-1 ring-border",
    success: "bg-success-50 text-success-600 ring-1 ring-success-500/20",
    warning: "bg-warning-50 text-warning-600 ring-1 ring-warning-500/20",
    error: "bg-danger-50 text-danger-600 ring-1 ring-danger-500/20",
    info: "bg-info-50 text-info-600 ring-1 ring-info-500/20",
    purple: "bg-purple-50 text-purple-700 ring-1 ring-purple-500/20",
    teal: "bg-teal-50 text-teal-700 ring-1 ring-teal-500/20",
};

const badgeClasses = computed(() =>
    [
        "inline-flex min-h-[20px] items-center rounded-sm px-2 py-0.5 text-xs font-medium",
        toneMap[props.tone ?? "neutral"],
    ].join(" "),
);
</script>
