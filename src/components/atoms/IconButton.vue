<template>
    <button
        :class="buttonClasses"
        :type="resolvedType"
        :disabled="disabled"
        v-bind="attrs"
    >
        <slot />
    </button>
</template>

<script setup lang="ts">
import { computed, useAttrs } from "vue";

type IconButtonVariant = "neutral" | "primary" | "danger";
type IconButtonSize = "sm" | "md";

const props = defineProps<{
    variant?: IconButtonVariant;
    size?: IconButtonSize;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
}>();

const attrs = useAttrs();

const variant = computed<IconButtonVariant>(() => props.variant ?? "neutral");
const size = computed<IconButtonSize>(() => props.size ?? "md");
const resolvedType = computed(() => props.type ?? "button");

const variantClasses: Record<IconButtonVariant, string> = {
    neutral:
        "border-gray-200 bg-white text-text-secondary hover:bg-gray-100 hover:text-gray-900 focus:ring-4 focus:ring-gray-200",
    primary:
        "border-transparent bg-primary-50 text-primary-700 hover:bg-primary-100 focus:ring-4 focus:ring-primary-200",
    danger: "border-transparent bg-red-50 text-signal-red hover:bg-red-100 focus:ring-4 focus:ring-red-200",
};

const sizeClasses: Record<IconButtonSize, string> = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
};

const buttonClasses = computed(() => [
    "inline-flex items-center justify-center rounded-md border transition-colors duration-150",
    "focus:outline-none focus:ring-4",
    variantClasses[variant.value],
    sizeClasses[size.value],
    props.disabled ? "cursor-not-allowed opacity-70" : "",
]);
</script>
