<template>
    <div
        class="rounded-md border border-error-200 bg-error-50 p-4 text-center text-sm text-error-600"
    >
        <p class="text-base font-semibold text-error-600">{{ title }}</p>
        <p v-if="description" class="text-sm text-error-700">
            {{ description }}
        </p>
        <div v-if="onRetry" class="mt-3 flex justify-center">
            <Button
                variant="outline"
                size="sm"
                data-testid="button-onretry"
                @click="onRetry"
                >Retry</Button
            >
        </div>
    </div>
</template>

<script setup lang="ts">
import Button from "@/components/atoms/Button.vue";

defineProps<{
    title: string;
    description?: string;
    onRetry?: () => void;
}>();
</script>
