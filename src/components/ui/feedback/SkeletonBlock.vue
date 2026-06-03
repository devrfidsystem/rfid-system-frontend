<template>
    <div
        class="animate-pulse bg-gray-200"
        :class="[roundedClass, widthClass, heightClass]"
        :style="customStyle"
    />
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
    height?: string;
    width?: string;
    rounded?: "sm" | "md" | "lg" | "full";
}>();

const roundedClass = computed(() => {
    switch (props.rounded) {
        case "full":
            return "rounded-full";
        case "lg":
            return "rounded-md";
        case "sm":
            return "rounded-md";
        default:
            return "rounded-md";
    }
});

const widthClass = computed(() =>
    props.width && props.width.startsWith("w-") ? props.width : "w-full",
);
const heightClass = computed(() =>
    props.height && props.height.startsWith("h-") ? props.height : "h-4",
);

const customStyle = computed(() => {
    const style: Record<string, string> = {};
    if (props.width && !props.width.startsWith("w-")) {
        style.width = props.width;
    }
    if (props.height && !props.height.startsWith("h-")) {
        style.height = props.height;
    }
    return Object.keys(style).length ? style : undefined;
});
</script>
