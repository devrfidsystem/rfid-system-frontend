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
        <Textarea
          :modelValue="String(field.value ?? '')"
          @update:modelValue="field.onChange"
          @blur="field.onBlur"
          :placeholder="placeholder"
          :disabled="disabled"
          :rows="computedRows"
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
import { computed } from 'vue';
import { Field } from 'vee-validate';
import FormField from '@/shared/components/form/FormField.vue';
import Textarea from '@/app/ui/Textarea.vue';

const props = defineProps<{
  name: string;
  label?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  full?: boolean;
  mode?: 'stacked' | 'inline';
  fieldId?: string;
}>();

const computedRows = computed(() => props.rows ?? 3);
</script>
