<template>
    <label class="flex flex-col gap-1.5 text-sm">
        <span v-if="label" class="font-semibold text-gray-700">{{
            label
        }}</span>

        <textarea
            :value="modelValue ?? ''"
            :placeholder="placeholder"
            :disabled="disabled"
            :rows="computedRows"
            :class="textareaClasses"
            v-bind="{ ...attrs, ...bindObjectId(objectId) }"
            @input="onInput"
        />

        <p
            v-if="hint && !error && !hideMessage"
            class="text-xs text-text-secondary"
        >
            {{ hint }}
        </p>
        <p v-if="error && !hideMessage" class="text-xs text-signal-red">
            {{ error }}
        </p>
    </label>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

import { computed, useAttrs } from "vue";
import { bindObjectId } from "@/utils/objectId";

const props = withDefaults(
    defineProps<{
        label?: string;
        modelValue?: string;
        placeholder?: string;
        error?: string;
        hint?: string;
        disabled?: boolean;
        invalid?: boolean;
        hideMessage?: boolean;
        rows?: number;
        objectId?: string;
    }>(),
    {
        label: undefined,
        modelValue: undefined,
        placeholder: undefined,
        error: undefined,
        hint: undefined,
        disabled: false,
        invalid: false,
        hideMessage: false,
        rows: 3,
        objectId: undefined,
    },
);

const attrs = useAttrs();

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
}>();

const onInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement | null;
    emit("update:modelValue", target?.value ?? "");
};

const baseClasses =
    "w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text transition-colors duration-150 placeholder:text-text-muted " +
    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 " +
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-surface-secondary";

const errorClasses =
    "border-signal-red bg-red-50 focus:ring-red-500 focus:border-signal-red";

const hasVisualError = computed(() => props.invalid || Boolean(props.error));
const textareaClasses = computed(() =>
    hasVisualError.value ? `${baseClasses} ${errorClasses}` : baseClasses,
);

const computedRows = computed(() => props.rows ?? 3);
</script>
