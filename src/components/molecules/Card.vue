<template>
    <section :class="cardClasses" v-bind="bindObjectId(objectId)">
        <slot />
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { bindObjectId } from "@/utils/objectId";

const props = withDefaults(
    defineProps<{
        class?: string;
        noPadding?: boolean;
        objectId?: string;
    }>(),
    {
        class: "",
        noPadding: false,
        objectId: undefined,
    },
);

const cardClasses = computed(() =>
    [
        "rounded-md border border-border bg-surface shadow-sm",
        props.noPadding ? "" : "px-6 py-5",
        props.class ?? "",
    ]
        .join(" ")
        .trim(),
);
</script>
