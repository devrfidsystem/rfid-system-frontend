<template>
  <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-gray-500">
    <p>
      Showing {{ from }} - {{ to }} of {{ totalRows }} records
    </p>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-md border border-gray-200 px-3 py-1 transition hover:bg-gray-100"
        :disabled="page <= 1"
        @click="changePage(page - 1)"
      >
        Prev
      </button>
      <button
        type="button"
        class="rounded-md border border-gray-200 px-3 py-1 transition hover:bg-gray-100"
        :disabled="page >= totalPages"
        @click="changePage(page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  page: number;
  totalPages: number;
  pageSize: number;
  totalRows: number;
}>();

const emit = defineEmits<{
  (e: 'update:page', value: number): void;
}>();

const changePage = (value: number) => {
  emit('update:page', value);
};

const from = computed(() => (props.page - 1) * props.pageSize + 1);
const to = computed(() => Math.min(props.page * props.pageSize, props.totalRows));
</script>
