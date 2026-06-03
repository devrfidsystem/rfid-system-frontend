<template>
    <div class="space-y-1.5">
        <div
            v-if="label || hint"
            class="flex items-center justify-between gap-2 text-sm font-semibold text-gray-700"
        >
            <p v-if="label" class="flex items-center gap-2">
                <span>{{ label }}</span>
                <span v-if="required" class="text-signal-red">*</span>
            </p>
            <p
                v-if="hint"
                class="text-[11px] font-normal uppercase tracking-wider text-text-secondary"
            >
                {{ hint }}
            </p>
        </div>
        <div>
            <slot />
        </div>
        <p v-if="error" class="text-xs text-signal-red" aria-live="polite">
            {{ error }}
        </p>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    label?: string;
    required?: boolean;
    hint?: string;
    error?: string;
}>();
</script>
