<template>
    <EmptyState :title="titleText" :description="description" size="md">
        <template #icon>
            <span aria-hidden="true">⚠️</span>
        </template>
        <template #actions>
            <slot name="actions" />
            <Button
                v-if="showRetry"
                variant="primary"
                size="sm"
                type="button"
                :loading="loading"
                :disabled="loading"
                data-testid="button-emit-retry"
                @click="$emit('retry')"
            >
                {{ retryText }}
            </Button>
        </template>
        <slot />
    </EmptyState>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Button from "@/components/atoms/Button.vue";
import EmptyState from "./EmptyState.vue";

const props = defineProps<{
    title?: string;
    description?: string;
    showRetry?: boolean;
    retryText?: string;
    loading?: boolean;
}>();

defineEmits<{
    (e: "retry"): void;
}>();

const titleText = computed(() => props.title ?? "Something went wrong");
const showRetry = computed(() => props.showRetry ?? true);
const retryText = computed(() => props.retryText ?? "Try again");
</script>
