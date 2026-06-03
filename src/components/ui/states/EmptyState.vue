<template>
    <BaseEmptyState
        :title="title"
        :description="description"
        :image="image"
        :alt="alt"
        :action-label="actionLabel"
        :show-action="showAction"
        :variant="variant"
        @action="emit('action')"
    >
        <template v-if="$slots.action" #action>
            <slot name="action" />
        </template>
    </BaseEmptyState>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import BaseEmptyState from "@/components/molecules/EmptyState.vue";

type EmptyStateVariant = "default" | "search" | "filter";

const props = defineProps<{
    title?: string;
    description?: string;
    image?: string;
    alt?: string;
    actionLabel?: string;
    showAction?: boolean;
    variant?: EmptyStateVariant;
    // Backward compatibility for legacy icon-based usages.
    icon?: Component;
}>();

const emit = defineEmits<(event: "action") => void>();

const { title, description, image, alt, actionLabel, showAction, variant } =
    props;
</script>
