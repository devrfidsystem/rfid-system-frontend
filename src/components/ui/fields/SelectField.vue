<template>
    <FormField
        :label="label"
        :name="name"
        :required="required"
        :hint="hint"
        :full="full"
        :mode="mode"
        :field-id="fieldId"
    >
        <template #default="{ id, describedById, hasError }">
            <Field v-slot="{ field }" :name="name">
                <Select
                    :id="id"
                    :model-value="String(field.value ?? '')"
                    :options="options"
                    :placeholder="placeholder"
                    :disabled="disabled"
                    :aria-invalid="hasError"
                    :aria-describedby="describedById"
                    :invalid="hasError"
                    hide-message
                    @update:model-value="field.onChange"
                    @blur="field.onBlur"
                />
            </Field>
        </template>
    </FormField>
</template>

<script setup lang="ts">
import { Field } from "vee-validate";
import FormField from "@/components/ui/form/FormField.vue";
import Select from "@/components/atoms/Select.vue";

defineProps<{
    name: string;
    label?: string;
    required?: boolean;
    hint?: string;
    placeholder?: string;
    options: { label: string; value: string | number }[];
    disabled?: boolean;
    full?: boolean;
    mode?: "stacked" | "inline";
    fieldId?: string;
}>();
</script>
