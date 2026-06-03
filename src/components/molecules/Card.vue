<template>
    <section :class="cardClasses">
        <slot />
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
    defineProps<{
        class?: string;
        noPadding?: boolean;
    }>(),
    {
        class: "",
        noPadding: false,
    },
);

const cardClasses = computed(() =>
    [
        "rounded-md border border-gray-200 bg-white shadow-sm",
        props.noPadding ? "" : "px-6 py-5",
        props.class ?? "",
    ]
        .join(" ")
        .trim(),
);
</script>
