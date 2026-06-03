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
                <Textarea
                    :id="id"
                    :model-value="String(field.value ?? '')"
                    :placeholder="placeholder"
                    :disabled="disabled"
                    :rows="computedRows"
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
import { computed } from "vue";
import { Field } from "vee-validate";
import FormField from "@/components/ui/form/FormField.vue";
import Textarea from "@/components/atoms/Textarea.vue";

const props = defineProps<{
    name: string;
    label?: string;
    required?: boolean;
    hint?: string;
    placeholder?: string;
    disabled?: boolean;
    rows?: number;
    full?: boolean;
    mode?: "stacked" | "inline";
    fieldId?: string;
}>();

const computedRows = computed(() => props.rows ?? 3);
</script>
