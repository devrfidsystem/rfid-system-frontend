<template>
    <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submitHandler">
        <component
            :is="getComponent(field.type)"
            v-for="field in visibleFields"
            :key="field.name"
            v-bind="resolveProps(field)"
            :class="gridClass(field.colSpan)"
        />
        <div class="md:col-span-2 flex justify-between items-center pt-2">
            <slot name="status" :meta="meta" :errors="errors" />
            <slot name="actions" :meta="meta" :errors="errors">
                <Button
                    type="submit"
                    variant="primary"
                    :disabled="isSubmitting || !meta.valid"
                >
                    Submit
                </Button>
            </slot>
        </div>
    </form>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useForm } from "vee-validate";
import Button from "@/components/atoms/Button.vue";
import type { FormBuilderProps, FormFieldConfig } from "./types";
import { FIELD_MAP } from "./field-map";

const props = defineProps<FormBuilderProps>();
const emit = defineEmits<{
    (e: "submit", values: Record<string, unknown>): void;
}>();

const { handleSubmit, resetForm, errors, meta, values, isSubmitting } = useForm<
    Record<string, unknown>
>({
    validationSchema: props.schema,
});

const submitHandler = handleSubmit((vals) => {
    emit("submit", vals);
});

const visibleFields = computed(() =>
    props.fields.filter((field) =>
        field.visibleIf
            ? field.visibleIf(values.value as Record<string, unknown>)
            : true,
    ),
);

const getComponent = (type: FormFieldConfig["type"]) => FIELD_MAP[type];

const resolveProps = (field: FormFieldConfig) => {
    const base = {
        name: field.name,
        label: field.label,
        placeholder: field.placeholder,
        required: field.required,
        hint: field.hint,
        disabled: props.readonly || field.readonly,
    };

    if (field.type === "select") {
        return {
            ...base,
            options: field.options ?? [],
            loading: Boolean(field.loading),
        };
    }

    if (field.type === "text") {
        return {
            ...base,
            type: field.inputType ?? "text",
        };
    }

    return base;
};

const gridClass = (span?: FormFieldConfig["colSpan"]) =>
    span === 2 ? "md:col-span-2" : "";

defineExpose({ resetForm, meta, errors, values, isSubmitting });
</script>
