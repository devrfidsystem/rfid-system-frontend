<template>
  <button :class="buttonClasses" :type="resolvedType" :disabled="disabled" v-bind="attrs">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';

type IconButtonVariant = 'neutral' | 'primary' | 'danger';
type IconButtonSize = 'sm' | 'md';

const props = defineProps<{
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}>();

const attrs = useAttrs();

const variant = computed<IconButtonVariant>(() => props.variant ?? 'neutral');
const size = computed<IconButtonSize>(() => props.size ?? 'md');
const resolvedType = computed(() => props.type ?? 'button');

const variantClasses: Record<IconButtonVariant, string> = {
  neutral:
    'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus-visible:ring-primary-200',
  primary:
    'border-primary-100 bg-primary-50 text-primary-700 hover:bg-primary-100 focus-visible:ring-primary-200',
  danger:
    'border-error-50 bg-error-50 text-error-600 hover:bg-error-50/70 focus-visible:ring-error-50'
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9'
};

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center rounded-md border shadow-sm transition duration-150 ease-out',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
  'active:scale-[0.99]',
  variantClasses[variant.value],
  sizeClasses[size.value],
  props.disabled ? 'cursor-not-allowed opacity-70' : ''
]);
</script>
