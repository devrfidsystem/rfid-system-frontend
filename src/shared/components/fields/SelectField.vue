<template>
  <FormField
    :label="label"
    :name="name"
    :required="required"
    :hint="hint"
    :full="full"
    :mode="mode"
    :fieldId="fieldId"
  >
    <template #default="{ id, describedById, hasError }">
      <Field :name="name" v-slot="{ field }">
        <Select
          :modelValue="String(field.value ?? '')"
          @update:modelValue="field.onChange"
          @blur="field.onBlur"
          :options="options"
          :placeholder="placeholder"
          :disabled="disabled"
          :id="id"
          :aria-invalid="hasError"
          :aria-describedby="describedById"
          :invalid="hasError"
          hideMessage
        />
      </Field>
    </template>
  </FormField>
</template>

<script setup lang="ts">
import { Field } from 'vee-validate';
import FormField from '@/shared/components/form/FormField.vue';
import Select from '@/app/ui/Select.vue';

const props = defineProps<{
  name: string;
  label?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options: { label: string; value: string | number }[];
  disabled?: boolean;
  full?: boolean;
  mode?: 'stacked' | 'inline';
  fieldId?: string;
}>();
</script>
