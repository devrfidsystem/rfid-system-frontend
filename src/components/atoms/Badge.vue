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
    neutral: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
    success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    error: "bg-red-50 text-signal-red ring-1 ring-red-200",
    info: "bg-blue-50 text-primary-600 ring-1 ring-blue-200",
    purple: "bg-purple-50 text-insight-purple ring-1 ring-purple-200",
    teal: "bg-teal-50 text-primary-teal ring-1 ring-teal-200",
};

const badgeClasses = computed(() =>
    [
        "inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full",
        toneMap[props.tone ?? "neutral"],
    ].join(" "),
);
</script>
