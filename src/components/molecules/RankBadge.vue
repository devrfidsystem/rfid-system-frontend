<template>
    <span :class="badgeClasses">
        <slot>{{ label }}</slot>
    </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

type RankBadgeTone = "primary" | "success" | "error";

const props = withDefaults(
    defineProps<{
        label?: string | number;
        tone?: RankBadgeTone;
    }>(),
    {
        label: "",
        tone: "primary",
    },
);

const toneClasses: Record<RankBadgeTone, string> = {
    primary: "bg-primary-50 text-primary-600",
    success: "bg-success-50 text-success-600",
    error: "bg-danger-50 text-danger-600",
};

const badgeClasses = computed(() =>
    [
        "flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold",
        toneClasses[props.tone],
    ].join(" "),
);
</script>
