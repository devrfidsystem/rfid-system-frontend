<template>
  <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600">
    <div>
      <p class="font-semibold text-gray-800">
        Showing {{ rangeStart }}–{{ rangeEnd }} of {{ total }}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="rounded border border-gray-300 px-3 py-1 text-sm transition hover:border-gray-400 disabled:border-gray-200 disabled:text-gray-300"
        :disabled="disabled || page <= 1"
        @click="goToPage(1)"
      >
        First
      </button>
      <button
        type="button"
        class="rounded border border-gray-300 px-3 py-1 text-sm transition hover:border-gray-400 disabled:border-gray-200 disabled:text-gray-300"
        :disabled="disabled || page <= 1"
        @click="goToPage(page - 1)"
      >
        Prev
      </button>
      <span class="text-xs uppercase tracking-[0.3em] text-gray-500">
        Page {{ page }} of {{ totalPages }}
      </span>
      <button
        type="button"
        class="rounded border border-gray-300 px-3 py-1 text-sm transition hover:border-gray-400 disabled:border-gray-200 disabled:text-gray-300"
        :disabled="disabled || page >= totalPages"
        @click="goToPage(page + 1)"
      >
        Next
      </button>
      <button
        type="button"
        class="rounded border border-gray-300 px-3 py-1 text-sm transition hover:border-gray-400 disabled:border-gray-200 disabled:text-gray-300"
        :disabled="disabled || page >= totalPages"
        @click="goToPage(totalPages)"
      >
        Last
      </button>

      <Select
        v-if="pageSizeOptions.length"
        class="w-32"
        :modelValue="String(pageSize)"
        @update:modelValue="onPageSizeChange"
        :options="selectOptions"
        :disabled="disabled"
        hideMessage
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import Select from '@/app/ui/Select.vue';

const props = defineProps<{
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:page', value: number): void;
  (e: 'update:pageSize', value: number): void;
}>();

const totalPages = computed(() => {
  if (!props.pageSize) return 1;
  return Math.max(1, Math.ceil(props.total / props.pageSize));
});

const rangeStart = computed(() =>
  props.total === 0 ? 0 : (clampedPage.value - 1) * props.pageSize + 1
);
const rangeEnd = computed(() => Math.min(props.total, clampedPage.value * props.pageSize));
const clampedPage = computed(() => Math.min(Math.max(1, props.page), totalPages.value));
const pageSizeOptions = computed(() => props.pageSizeOptions?.length ? props.pageSizeOptions : [10, 20, 50, 100]);
const selectOptions = computed(() => pageSizeOptions.value.map((value) => ({ label: String(value), value })));

const goToPage = (next: number) => {
  if (props.disabled) return;
  const target = Math.min(Math.max(1, next), totalPages.value);
  emit('update:page', target);
};

const onPageSizeChange = (value: string) => {
  const numeric = Number(value);
  emit('update:pageSize', numeric);
  emit('update:page', 1);
};

watch(totalPages, (pages) => {
  if (props.page > pages) {
    emit('update:page', pages);
  }
});
</script>
