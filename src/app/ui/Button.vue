<template>
  <button :class="buttonClasses" :type="resolvedType" :disabled="isDisabled" v-bind="attrs">
    <span v-if="loading" class="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
    <span v-if="$slots.leftIcon" class="flex items-center">
      <slot name="leftIcon" />
    </span>
    <span class="inline-flex items-center justify-center gap-2">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'neutral';
type ButtonSize = 'sm' | 'md';

const props = defineProps<{
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}>();

const attrs = useAttrs();

const variant = computed<ButtonVariant>(() => props.variant ?? 'primary');
const size = computed<ButtonSize>(() => props.size ?? 'md');

const isDisabled = computed(() => Boolean(props.disabled) || Boolean(props.loading));
const loading = computed(() => Boolean(props.loading));
const resolvedType = computed(() => props.type ?? 'button');

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-200',
  outline:
    'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-primary-200',
  ghost:
    'border-transparent bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-primary-200',
  danger:
    'border-transparent bg-error-500 text-white hover:bg-error-600 focus-visible:ring-error-50',
  neutral:
    'border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-primary-200'
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm'
};

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-md border transition duration-150 ease-out font-medium',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
  'active:scale-[0.99]',
  variantClasses[variant.value],
  sizeClasses[size.value],
  isDisabled.value ? 'cursor-not-allowed opacity-70' : ''
]);
</script>