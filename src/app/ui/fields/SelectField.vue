<template>
  <FormField :label="label" :required="required" :hint="hint" :error="errorMessage">
    <select
      v-bind="field"
      class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
      :disabled="disabled || loading"
    >
      <option value="" disabled hidden>Select {{ label }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </FormField>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useField } from 'vee-validate';
import FormField from '@/app/ui/FormField.vue';
import type { FormFieldConfig } from '@/form-builder/types';

const props = defineProps<{
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  options: { label: string; value: string }[];
  loading?: boolean;
  disabled?: boolean;
}>();

const { value, errorMessage, handleChange, handleBlur } = useField<string>(props.name);

const field = computed(() => ({
  value: value.value,
  onChange: handleChange,
  onBlur: handleBlur
}));

const disabled = computed(() => Boolean(props.disabled));
const required = computed(() => Boolean(props.required));
const hint = computed(() => props.hint ?? '');

const options = computed(() => props.options ?? []);
const loading = computed(() => Boolean(props.loading));
</script>
