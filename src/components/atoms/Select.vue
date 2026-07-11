<template>
    <label class="flex flex-col gap-1.5 text-sm" :for="id">
        <span v-if="label" :class="labelClass ?? 'font-medium text-text-secondary'">
            {{ label }}
        </span>
        <div>
            <select
                :id="id"
                :value="modelValue"
                :disabled="disabled"
                :class="selectClasses"
                v-bind="{ ...attrs, ...bindObjectId(objectId) }"
                @change="
                    $emit(
                        'update:modelValue',
                        ($event.target as HTMLSelectElement).value,
                    )
                "
            >
                <option
                    v-if="placeholder"
                    value=""
                    :disabled="placeholderDisabled"
                >
                    {{ placeholder }}
                </option>
                <option
                    v-for="option in options"
                    :key="option.value"
                    :value="option.value"
                >
                    {{ option.label }}
                </option>
            </select>
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
    options: { label: string; value: string | number }[];
    placeholder?: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    invalid?: boolean;
    hideMessage?: boolean;
    placeholderDisabled?: boolean;
    objectId?: string;
}>();

const attrs = useAttrs();
const placeholderDisabled = computed(() => props.placeholderDisabled ?? true);

defineEmits<{
    (e: "update:modelValue", value: string): void;
}>();

const baseClasses =
    "h-[var(--control-h-md)] w-full rounded-md border border-border bg-surface px-3 text-sm font-medium text-text transition-colors duration-150 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-surface-secondary";

const errorClasses =
    "border-danger-500 bg-danger-50 text-danger-600 focus:border-danger-500 focus:ring-danger-500/30";

const hasVisualError = computed(() => props.invalid || Boolean(props.error));
const selectClasses = computed(() =>
    hasVisualError.value ? `${baseClasses} ${errorClasses}` : baseClasses,
);
</script>
