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
                <Input
                    :id="id"
                    :model-value="String(field.value ?? '')"
                    :placeholder="placeholder"
                    type="date"
                    :disabled="disabled"
                    :aria-invalid="hasError"
                    :aria-describedby="describedById"
                    :invalid="hasError"
                    hide-message
                    data-testid="input-1"
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
import Input from "@/components/atoms/Input.vue";

defineProps<{
    name: string;
    label?: string;
    required?: boolean;
    hint?: string;
    placeholder?: string;
    disabled?: boolean;
    full?: boolean;
    mode?: "stacked" | "inline";
    fieldId?: string;
}>();
</script>
