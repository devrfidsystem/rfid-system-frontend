<template>
  <FormField :label="label" :required="required" :hint="hint" :error="errorMessage">
    <input
      v-bind="field"
      type="date"
      class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
      :disabled="disabled"
    />
  </FormField>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useField } from 'vee-validate';
import FormField from '@/app/ui/FormField.vue';

const props = defineProps<{
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
}>();

const { value, errorMessage, handleChange, handleBlur } = useField<string>(props.name);

const field = computed(() => ({
  value: value.value,
  onInput: handleChange,
  onBlur: handleBlur
}));

const disabled = computed(() => Boolean(props.disabled));
const required = computed(() => Boolean(props.required));
const hint = computed(() => props.hint ?? '');
</script>
