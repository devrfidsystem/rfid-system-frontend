<template>
    <button
        :class="buttonClasses"
        :type="resolvedType"
        :disabled="disabled"
        v-bind="{ ...attrs, ...bindObjectId(objectId) }"
    >
        <slot />
    </button>
</template>

<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { bindObjectId } from "@/utils/objectId";

type IconButtonVariant = "neutral" | "primary" | "danger";
type IconButtonSize = "sm" | "md";

const props = defineProps<{
    variant?: IconButtonVariant;
    size?: IconButtonSize;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    objectId?: string;
}>();

const attrs = useAttrs();

const variant = computed<IconButtonVariant>(() => props.variant ?? "neutral");
const size = computed<IconButtonSize>(() => props.size ?? "md");
const resolvedType = computed(() => props.type ?? "button");

const variantClasses: Record<IconButtonVariant, string> = {
    neutral:
        "border-border bg-surface text-text-secondary hover:bg-surface-secondary hover:text-text focus:ring-4 focus:ring-primary-500/20",
    primary:
        "border-transparent bg-primary-50 text-primary-700 hover:bg-primary-100 focus:ring-4 focus:ring-primary-200",
    danger: "border-transparent bg-danger-50 text-danger-600 hover:bg-danger-50/80 focus:ring-4 focus:ring-danger-500/20",
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
