<template>
  <form
    class="space-y-6"
    @submit.prevent="handleSubmit"
  >
    <slot />
  </form>
</template>

<script setup lang="ts">
const emit = defineEmits<{ (e: 'submit'): void }>();

const handleSubmit = () => {
  emit('submit');
};
</script>
