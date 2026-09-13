<template>
    <EmptyState
        :title="title"
        :description="description"
        :variant="variant"
        :image="image"
        :alt="alt"
        :action-label="actionLabel"
        :show-action="showAction"
        @action="emit('action')"
    >
        <template v-if="$slots.action" #action>
            <slot name="action" />
        </template>
    </EmptyState>
</template>

<script setup lang="ts">
import EmptyState from "@/components/molecules/EmptyState.vue";

type EmptyStateVariant = "default" | "search" | "filter";

defineProps<{
    title?: string;
    description?: string;
    image?: string;
    alt?: string;
    variant?: EmptyStateVariant;
    actionLabel?: string;
    showAction?: boolean;
}>();

const emit = defineEmits<(event: "action") => void>();
</script>
