<template>
  <transition name="drawer-fade">
    <Teleport to="body">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50"
        @mousedown.self="handleBackdropClick"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true"></div>

        <div
          ref="drawerRef"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="descriptionId"
          class="absolute inset-0 flex"
        >
          <aside
            class="relative flex h-full flex-col bg-white shadow-2xl"
            :class="[widthClass, sideClass]"
            tabindex="-1"
            @keydown.esc.prevent="handleEsc"
            @click.stop
          >
            <header class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div class="space-y-1">
                <p v-if="title" :id="titleId" class="text-lg font-semibold text-gray-900">{{ title }}</p>
                <p v-if="description" :id="descriptionId" class="text-sm text-gray-500">{{ description }}</p>
              </div>
              <button
                v-if="!hideClose"
                type="button"
                class="rounded-full border border-gray-200 bg-white px-2 py-1 text-sm text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
                @click="close('button')"
                aria-label="Close drawer"
              >
                ×
              </button>
            </header>

            <section class="flex-1 overflow-y-auto px-6 py-4">
              <slot />
            </section>

            <footer v-if="$slots.footer" class="border-t border-gray-100 px-6 py-4">
              <slot name="footer" />
            </footer>
          </aside>
        </div>
      </div>
    </Teleport>
  </transition>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  title?: string;
  description?: string;
  side?: 'right' | 'left';
  width?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  persistent?: boolean;
  hideClose?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'open'): void;
  (e: 'close'): void;
}>();

const isOpen = computed(() => props.modelValue);
const drawerRef = ref<HTMLElement | null>(null);
const previousActiveElement = ref<HTMLElement | null>(null);
const id = useId();
const titleId = computed(() => (props.title ? `${id}-drawer-title` : undefined));
const descriptionId = computed(() => (props.description ? `${id}-drawer-description` : undefined));

const widthClass = computed(() => {
  switch (props.width) {
    case 'sm':
      return 'max-w-sm';
    case 'lg':
      return 'max-w-3xl';
    default:
      return 'max-w-2xl';
  }
});

const sideClass = computed(() =>
  props.side === 'left'
    ? 'mr-auto h-full translate-x-0'
    : 'ml-auto h-full translate-x-0'
);

const lockScroll = () => {
  document.body.style.overflow = 'hidden';
};
const unlockScroll = () => {
  document.body.style.overflow = '';
};

const focusPanel = () => {
  nextTick(() => {
    if (drawerRef.value) {
      const focusable = drawerRef.value.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (focusable ?? drawerRef.value).focus();
    }
  });
};

const close = (reason?: string) => {
  if (props.persistent) return;
  emit('update:modelValue', false);
  emit('close');
};

const handleBackdropClick = () => {
  if (props.closeOnBackdrop ?? true) {
    close('backdrop');
  }
};

const handleEsc = () => {
  if (props.closeOnEsc ?? true) {
    close('esc');
  }
};

watch(
  isOpen,
  (open) => {
    if (open) {
      previousActiveElement.value = document.activeElement as HTMLElement | null;
      lockScroll();
      emit('open');
      focusPanel();
    } else {
      unlockScroll();
      if (previousActiveElement.value && document.body.contains(previousActiveElement.value)) {
        previousActiveElement.value.focus();
      }
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (props.modelValue) {
    previousActiveElement.value = document.activeElement as HTMLElement | null;
    lockScroll();
    focusPanel();
  }
});

onBeforeUnmount(() => {
  unlockScroll();
});
</script>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}
</style>
