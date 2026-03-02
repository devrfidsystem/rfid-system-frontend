<template>
  <transition name="modal-fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="title || 'Dialog'"
      @keydown.esc.prevent="close"
    >
      <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" @click="close" />

      <div
        ref="panelRef"
        class="relative w-full max-w-lg rounded-md border border-gray-200 bg-white shadow-md"
        tabindex="-1"
      >
        <header class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div class="min-w-0">
            <h3 class="truncate text-base font-semibold text-gray-900">
              {{ title }}
            </h3>
          </div>

          <button
            type="button"
            class="rounded-md p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
            @click="close"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </header>

        <div class="px-5 py-4">
          <slot />
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const panelRef = ref<HTMLElement | null>(null);
let lastActiveElement: HTMLElement | null = null;

const close = () => emit('close');

const lockBody = (locked: boolean) => {
  document.body.style.overflow = locked ? 'hidden' : '';
};

watch(
  () => props.isOpen,
  async (open) => {
    lockBody(open);

    if (open) {
      lastActiveElement = document.activeElement as HTMLElement | null;
      await nextTick();
      panelRef.value?.focus();
    } else {
      // restore focus to previous element for better UX
      lastActiveElement?.focus?.();
      lastActiveElement = null;
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  lockBody(false);
});
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>