<template>
    <Card :class="cardClass" :object-id="objectId">
        <div class="flex h-full flex-col gap-3">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <p class="text-xs font-semibold uppercase text-text-muted">
                        {{ label }}
                    </p>
                    <p
                        v-if="value !== undefined"
                        class="mt-1 text-2xl font-semibold text-text"
                    >
                        {{ value }}
                    </p>
                </div>
                <div :class="iconClasses">
                    <Icon :icon="icon" :size="18" />
                </div>
            </div>

            <p v-if="description" class="text-xs text-text-secondary">
                {{ description }}
            </p>

            <slot />
        </div>
    </Card>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";
import Card from "@/components/molecules/Card.vue";
import Icon from "@/components/atoms/Icon.vue";

type MetricTone = "primary" | "neutral" | "info" | "success" | "danger";

const props = withDefaults(
    defineProps<{
        label: string;
        icon: Component;
        value?: string | number;
        description?: string;
        tone?: MetricTone;
        cardClass?: string;
        objectId?: string;
    }>(),
    {
        value: undefined,
        description: "",
        tone: "neutral",
        cardClass: "",
        objectId: undefined,
    },
);

const toneClasses: Record<MetricTone, string> = {
    primary: "bg-primary-50 text-primary-600 ring-primary-200",
    neutral: "bg-surface-secondary text-text-secondary ring-border",
    info: "bg-info-50 text-info-600 ring-info-200",
    success: "bg-success-50 text-success-600 ring-success-200",
    danger: "bg-danger-50 text-danger-600 ring-danger-200",
};

const iconClasses = computed(() =>
    [
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1",
        toneClasses[props.tone],
    ].join(" "),
);
</script>
