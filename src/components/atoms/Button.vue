<template>
    <button
        :class="buttonClasses"
        :type="resolvedType"
        :disabled="isDisabled"
        v-bind="attrs"
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

type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "neutral";
type ButtonSize = "sm" | "md";

const props = defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
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
        "text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 focus:outline-none border-transparent",
    outline:
        "text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 focus:outline-none",
    ghost: "text-gray-700 bg-transparent hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 focus:outline-none",
    danger: "text-white bg-signal-red hover:bg-red-700 focus:ring-4 focus:ring-red-200 focus:outline-none border-transparent",
    neutral:
        "text-gray-900 bg-gray-50 border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 focus:outline-none",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
};

const buttonClasses = computed(() => [
    "inline-flex items-center justify-center gap-2 rounded-md transition-all duration-150 font-medium",
    variantClasses[variant.value],
    sizeClasses[size.value],
    isDisabled.value ? "cursor-not-allowed opacity-50" : "",
]);
</script>
