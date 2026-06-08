<template>
    <label class="flex flex-col gap-1.5 text-sm">
        <span v-if="label" class="font-semibold text-gray-700">{{
            label
        }}</span>

        <div class="relative">
            <div
                v-if="$slots.icon"
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            >
                <slot name="icon" />
            </div>

            <input
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
    "bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 transition-colors duration-150 placeholder:text-gray-400 " +
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-50";

const errorClasses =
    "border-signal-red bg-red-50 text-signal-red placeholder-red-300 focus:ring-red-500 focus:border-signal-red";

const hasVisualError = computed(() => props.invalid || Boolean(props.error));
const inputClasses = computed(() =>
    hasVisualError.value ? `${baseClasses} ${errorClasses}` : baseClasses,
);
</script>
