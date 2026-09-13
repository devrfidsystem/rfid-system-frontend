<template>
    <div class="flex items-center gap-1.5">
        <div
            role="progressbar"
            :aria-valuenow="normalizedValue"
            aria-valuemin="0"
            aria-valuemax="100"
            :class="trackClasses"
        >
            <div
                class="h-full rounded-full"
                :class="toneClasses[tone]"
                :style="{ width: `${normalizedValue}%` }"
            ></div>
        </div>
        <span v-if="showValue" class="text-xs text-text-muted">
            {{ normalizedValue }}%
        </span>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

type ProgressTone = "primary" | "success" | "warning" | "error";

const props = withDefaults(
    defineProps<{
        value: number;
        tone?: ProgressTone;
        showValue?: boolean;
        trackClass?: string;
    }>(),
    {
        tone: "success",
        showValue: true,
        trackClass: "w-16",
    },
);

const toneClasses: Record<ProgressTone, string> = {
    primary: "bg-primary-600",
    success: "bg-success-600",
    warning: "bg-warning-500",
    error: "bg-danger-600",
};

const trackClasses = computed(() =>
    [
        "h-1.5 overflow-hidden rounded-full bg-surface-secondary",
        props.trackClass,
    ]
        .join(" ")
        .trim(),
);

const normalizedValue = computed(() =>
    Math.min(100, Math.max(0, Math.round(props.value))),
);
</script>
