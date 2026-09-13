<template>
    <div :class="panelClasses" :object-id="objectId">
        <div :class="iconClasses">
            <Icon :icon="icon" :size="20" />
        </div>
        <p class="text-sm font-medium text-text">
            {{ title }}
        </p>
        <p v-if="description" class="mt-1 text-xs text-text-secondary">
            {{ description }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";
import Icon from "@/components/atoms/Icon.vue";

type StatusPanelTone = "success" | "error" | "neutral";

const props = withDefaults(
    defineProps<{
        title: string;
        icon: Component;
        description?: string;
        tone?: StatusPanelTone;
        objectId?: string;
        class?: string;
    }>(),
    {
        description: "",
        tone: "neutral",
        objectId: undefined,
        class: "",
    },
);

const panelToneClasses: Record<StatusPanelTone, string> = {
    success: "border-border bg-surface-secondary/50",
    error: "border-danger-500/20 bg-danger-50",
    neutral: "border-border bg-surface-secondary/50",
};

const iconToneClasses: Record<StatusPanelTone, string> = {
    success: "text-success-600 ring-success-500/20",
    error: "text-danger-600 ring-danger-500/20",
    neutral: "text-text-secondary ring-border",
};

const panelClasses = computed(() =>
    [
        "rounded-md border p-8 text-center",
        "flex flex-col items-center",
        panelToneClasses[props.tone],
        props.class,
    ]
        .join(" ")
        .trim(),
);

const iconClasses = computed(() =>
    [
        "mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-sm ring-1",
        iconToneClasses[props.tone],
    ].join(" "),
);
</script>
