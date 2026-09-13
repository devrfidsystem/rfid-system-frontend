<template>
    <div :class="tileClasses">
        <p class="text-[11px] font-medium text-text-secondary">
            {{ label }}
        </p>
        <p :class="valueClasses">
            {{ value }}
        </p>
        <slot />
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
    defineProps<{
        label: string;
        value: string | number;
        class?: string;
        valueClass?: string;
    }>(),
    {
        class: "",
        valueClass: "",
    },
);

const tileClasses = computed(() =>
    ["rounded-md border border-border p-3", props.class].join(" ").trim(),
);

const valueClasses = computed(() =>
    ["mt-1 text-base font-semibold text-text", props.valueClass]
        .join(" ")
        .trim(),
);
</script>
