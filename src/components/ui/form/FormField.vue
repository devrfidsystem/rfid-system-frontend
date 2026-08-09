<template>
    <div :class="containerClass">
        <label
            v-if="label"
            :for="id"
            class="text-sm font-semibold text-text flex items-center gap-1"
        >
            <span>{{ label }}</span>
            <span v-if="required" class="text-danger-600">*</span>
        </label>

        <div :class="contentColumnClass">
            <slot
                :id="id"
                :described-by-id="describedById"
                :has-error="hasError"
            />

            <p
                v-if="hint"
                :id="hintId"
                class="text-xs text-text-secondary mt-1"
            >
                {{ hint }}
            </p>
            <p
                v-if="displayError"
                :id="errorId"
                class="text-xs text-danger-600 mt-1"
                aria-live="polite"
            >
                {{ displayError }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";
import { useField } from "vee-validate";

const props = defineProps<{
    label?: string;
    name?: string;
    required?: boolean;
    hint?: string;
    error?: string;
    mode?: "stacked" | "inline";
    full?: boolean;
    fieldId?: string;
}>();

const fieldState = useField(() => props.name ?? "");
const hasName = computed(() => Boolean(props.name));

const displayError = computed(() => {
    if (hasName.value) {
        return fieldState.errorMessage.value;
    }
    return props.error ?? "";
});
const hasError = computed(() => Boolean(displayError.value));

const baseId = useId();
const id = computed(() => props.fieldId ?? baseId);
const hintId = computed(() => (props.hint ? `${id.value}-hint` : undefined));
const errorId = computed(() =>
    displayError.value ? `${id.value}-error` : undefined,
);
const describedById = computed(() => {
    const ids: string[] = [];
    if (hintId.value) ids.push(hintId.value);
    if (errorId.value) ids.push(errorId.value);
    return ids.length ? ids.join(" ") : undefined;
});

const containerClass = computed(() => {
    const classes = ["space-y-1"];
    if (props.full) {
        classes.push("md:col-span-2");
    }
    if (props.mode === "inline") {
        classes.push(
            "md:grid",
            "md:grid-cols-[220px_1fr]",
            "md:items-start",
            "md:gap-3",
        );
    }
    return classes.join(" ");
});

const contentColumnClass = computed(() =>
    props.mode === "inline" ? "flex flex-col md:space-y-0" : "flex flex-col",
);
</script>
