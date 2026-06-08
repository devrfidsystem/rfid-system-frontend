<template>
    <label class="flex flex-col gap-1.5 text-sm">
        <span v-if="label" class="font-semibold text-gray-700">{{
            label
        }}</span>
        <div>
            <select
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
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 transition-colors duration-150 focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-50";

const errorClasses =
    "border-signal-red bg-red-50 text-signal-red focus:ring-red-500 focus:border-signal-red";

const hasVisualError = computed(() => props.invalid || Boolean(props.error));
const selectClasses = computed(() =>
    hasVisualError.value ? `${baseClasses} ${errorClasses}` : baseClasses,
);
</script>
