<template>
  <FormField :label="label" :required="required" :hint="hint" :error="errorMessage">
    <Input
      v-bind="field"
      :placeholder="placeholder"
      :disabled="disabled"
      :type="inputType"
      class="w-full"
    />
  </FormField>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useField } from 'vee-validate';
import Input from '@/app/ui/Input.vue';
import FormField from '@/app/ui/FormField.vue';

const props = defineProps<{
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
  type?: 'text' | 'number' | 'email' | 'password';
}>();

const { value, errorMessage, handleChange, handleBlur } = useField<string>(props.name);

const field = computed(() => ({
  value: value.value,
  onInput: handleChange,
  onBlur: handleBlur
}));

const disabled = computed(() => Boolean(props.disabled));
const placeholder = computed(() => props.placeholder ?? '');
const label = computed(() => props.label ?? '');
const hint = computed(() => props.hint ?? '');
const required = computed(() => Boolean(props.required));
const inputType = computed(() => props.type ?? 'text');
</script>
