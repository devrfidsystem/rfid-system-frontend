<template>
    <label class="flex flex-col gap-1.5 text-sm" :for="id">
        <span v-if="label" :class="labelClass ?? 'font-medium text-text-secondary'">
            {{ label }}
        </span>

        <div class="relative">
            <div
                v-if="$slots.icon"
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            >
                <slot name="icon" />
            </div>

            <input
                :id="id"
                :value="modelValue ?? ''"
                :placeholder="placeholder"
                :type="type"
                :disabled="disabled"
                :class="[inputClasses, $slots.icon ? 'pl-10' : '']"
                v-bind="{ ...attrs, ...bindObjectId(objectId) }"
                @input="onInput"
            />
        </div>

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

const props = defineProps<{
    label?: string;
    labelClass?: string;
    id?: string;
    modelValue?: string;
    placeholder?: string;
    error?: string;
    hint?: string;
    type?: string;
    disabled?: boolean;
    invalid?: boolean;
    hideMessage?: boolean;
    objectId?: string;
}>();

const attrs = useAttrs();

const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
}>();

const onInput = (e: Event) => {
    const target = e.target as HTMLInputElement | null;
    emit("update:modelValue", target?.value ?? "");
};

const baseClasses =
    "block h-[var(--control-h-md)] w-full rounded-md border border-border bg-surface px-3 text-sm text-text transition-colors duration-150 placeholder:text-text-muted focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-surface-secondary";

const errorClasses =
    "border-danger-500 bg-danger-50 text-danger-600 placeholder:text-danger-300 focus:border-danger-500 focus:ring-danger-500/30";

const hasVisualError = computed(() => props.invalid || Boolean(props.error));
const inputClasses = computed(() =>
    hasVisualError.value ? `${baseClasses} ${errorClasses}` : baseClasses,
);
</script>
