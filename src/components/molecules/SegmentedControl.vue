<template>
    <div class="flex flex-wrap gap-1.5" :object-id="objectId">
        <button
            v-for="option in options"
            :key="option.value"
            type="button"
            class="rounded-md px-2.5 py-1 text-xs font-semibold transition-colors"
            :class="
                modelValue === option.value
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-text-secondary hover:bg-surface-secondary'
            "
            :object-id="
                objectIdPrefix ? `${objectIdPrefix}_${option.value}` : undefined
            "
            @click="emit('update:modelValue', option.value)"
        >
            {{ option.label }}
        </button>
    </div>
</template>

<script setup lang="ts">
export type SegmentedControlOption = {
    label: string;
    value: string;
};

withDefaults(
    defineProps<{
        modelValue: string;
        options: SegmentedControlOption[];
        objectId?: string;
        objectIdPrefix?: string;
    }>(),
    {
        objectId: undefined,
        objectIdPrefix: undefined,
    },
);

const emit = defineEmits<{
    (event: "update:modelValue", value: string): void;
}>();
</script>
