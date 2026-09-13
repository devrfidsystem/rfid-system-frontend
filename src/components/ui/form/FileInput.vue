<template>
    <label class="flex flex-col gap-1.5 text-sm" :for="objectId">
        <span class="font-medium text-text-secondary">{{ label }}</span>
        <input
            :id="objectId"
            type="file"
            :accept="accept"
            :disabled="disabled"
            class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition-colors duration-150 file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-surface-secondary"
            :aria-invalid="error ? 'true' : undefined"
            :aria-describedby="error ? `${objectId}Error` : undefined"
            :data-testid="objectId"
            :object-id="objectId"
            @change="emitFile"
        />
        <p v-if="selectedFile" class="text-xs text-text-secondary">
            Selected: {{ selectedFile.name }}
        </p>
        <p
            v-if="error"
            :id="`${objectId}Error`"
            class="text-xs text-signal-red"
        >
            {{ error }}
        </p>
    </label>
</template>

<script setup lang="ts">
defineProps<{
    label: string;
    objectId: string;
    accept?: string;
    selectedFile?: File | null;
    disabled?: boolean;
    error?: string;
}>();

const emit = defineEmits<{
    (event: "change", value: File | null): void;
}>();

const emitFile = (event: Event) => {
    const input = event.target as HTMLInputElement | null;
    emit("change", input?.files?.[0] ?? null);
};
</script>
