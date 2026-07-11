<template>
    <button
        :class="buttonClasses"
        :type="resolvedType"
        :disabled="isDisabled"
        v-bind="{ ...attrs, ...bindObjectId(objectId) }"
    >
        <span
            v-if="loading"
            class="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            aria-hidden="true"
        />
        <span v-if="$slots.leftIcon" class="flex items-center">
            <slot name="leftIcon" />
        </span>
        <span class="inline-flex items-center justify-center gap-2">
            <slot />
        </span>
    </button>
</template>

<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { bindObjectId } from "@/utils/objectId";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "neutral";
type ButtonSize = "sm" | "md";

const props = defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    objectId?: string;
}>();

const attrs = useAttrs();

const variant = computed<ButtonVariant>(() => props.variant ?? "primary");
const size = computed<ButtonSize>(() => props.size ?? "md");

const isDisabled = computed(
    () => Boolean(props.disabled) || Boolean(props.loading),
);
const loading = computed(() => Boolean(props.loading));
const resolvedType = computed(() => props.type ?? "button");

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        "border-transparent bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500/30 focus:outline-none",
    outline:
        "border border-border bg-surface text-text hover:bg-surface-secondary focus:ring-2 focus:ring-primary-500/20 focus:outline-none",
    ghost: "border border-transparent bg-transparent text-text-secondary hover:bg-surface-secondary focus:ring-2 focus:ring-primary-500/20 focus:outline-none",
    danger:
        "border-transparent bg-danger-500 text-white hover:bg-danger-600 focus:ring-2 focus:ring-danger-500/30 focus:outline-none",
    neutral:
        "border border-border bg-surface text-text hover:bg-surface-secondary focus:ring-2 focus:ring-primary-500/20 focus:outline-none",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "h-[var(--control-h-sm)] px-3 text-xs",
    md: "h-[var(--control-h-md)] px-4 text-sm",
};

const buttonClasses = computed(() => [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-150",
    variantClasses[variant.value],
    sizeClasses[size.value],
    isDisabled.value ? "cursor-not-allowed opacity-50" : "",
]);
</script>
