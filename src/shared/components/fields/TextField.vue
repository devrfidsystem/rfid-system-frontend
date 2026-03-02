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
        <Input
          :modelValue="String(field.value ?? '')"
          @update:modelValue="field.onChange"
          @blur="field.onBlur"
          :placeholder="placeholder"
          :type="inputType"
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
import Input from '@/app/ui/Input.vue';

const props = defineProps<{
  name: string;
  label?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  full?: boolean;
  mode?: 'stacked' | 'inline';
  fieldId?: string;
}>();

const inputType = props.type ?? 'text';
</script>
