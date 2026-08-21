<template>
    <div
        :class="[
            'w-full rounded-md border text-text',
            compact ? 'px-3 py-2' : 'px-4 py-3',
            variantClasses,
        ]"
        :role="variantRole"
        :aria-live="ariaLive"
    >
        <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3">
                <span v-if="$slots.icon" class="mt-0.5 text-current">
                    <slot name="icon" />
                </span>
                <Icon
                    v-else
                    :icon="icon"
                    :size="16"
                    class-name="mt-0.5 text-current"
                    aria-hidden="true"
                />
                <div class="space-y-1">
                    <p v-if="title" class="text-sm font-semibold text-text">
                        {{ title }}
                    </p>
                    <p v-if="description" class="text-sm text-text-secondary">
                        {{ description }}
                    </p>
                    <slot />
                </div>
            </div>
            <div class="flex items-center gap-2">
                <slot name="actions" />
                <Button
                    v-if="closable"
                    variant="ghost"
                    size="sm"
                    type="button"
                    class="px-1"
                    aria-label="Close alert"
                    data-testid="button-emit-close"
                    @click="$emit('close')"
                >
                    ×
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    Info,
} from "lucide-vue-next";
import type { Component } from "vue";

const iconMap: Record<"info" | "success" | "warning" | "error", Component> = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
};

const props = defineProps<{
    variant?: "info" | "success" | "warning" | "error";
    title?: string;
    description?: string;
    closable?: boolean;
    compact?: boolean;
}>();

defineEmits<{
    (e: "close"): void;
}>();

const computedVariant = computed(() => props.variant ?? "info");
const variantClassMap: Record<
    "info" | "success" | "warning" | "error",
    string
> = {
    info: "bg-info-50 border-info-500/20 text-info-600",
    success: "bg-success-50 border-success-500/20 text-success-600",
    warning: "bg-warning-50 border-warning-500/20 text-warning-600",
    error: "bg-danger-50 border-danger-500/20 text-danger-600",
};
const variantClasses = computed(() => variantClassMap[computedVariant.value]);
const variantRole = computed(() =>
    computedVariant.value === "warning" || computedVariant.value === "error"
        ? "alert"
        : "status",
);
const ariaLive = computed(() =>
    computedVariant.value === "warning" || computedVariant.value === "error"
        ? "assertive"
        : "polite",
);
const icon = computed(() => iconMap[computedVariant.value]);
</script>
