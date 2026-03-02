<template>
  <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
    <div class="flex flex-1 min-w-[200px] items-center gap-2">
      <div class="flex w-full items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200">
        <slot name="search-icon">
        <Icon :icon="Search" :size="16" className="text-gray-400" />
        </slot>
        <input
          v-model="search" 
          class="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
          placeholder="Search"
        />
      </div>
      <slot name="filters" />
    </div>
    <div class="flex items-center gap-2">
      <slot name="actions" :rows="rows" :visibleRows="visibleRows" />
      <div v-if="pageSizeOptions?.length" class="flex items-center gap-1 text-xs text-gray-500">
        <label class="uppercase tracking-[0.3em] text-[10px]">Rows</label>
        <select
          v-model.number="localPageSize"
          class="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs focus:border-primary-300 focus:ring-1 focus:ring-primary-200"
        >
          <option v-for="option in pageSizeOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Icon from '@/app/ui/Icon.vue';
import { Search } from 'lucide-vue-next';

const props = defineProps<{
  modelValue?: string;
  pageSize: number;
  pageSizeOptions?: number[];
  rows: unknown[];
  visibleRows: unknown[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'update:pageSize', value: number): void;
}>();

const search = ref(props.modelValue ?? '');
const localPageSize = ref(props.pageSize ?? props.pageSizeOptions?.[0] ?? 10);

watch(search, (value) => emit('update:modelValue', value));
watch(
  () => props.modelValue,
  (value) => {
    if (value !== search.value) search.value = value ?? '';
  }
);

watch(localPageSize, (value) => emit('update:pageSize', value));
watch(
  () => props.pageSize,
  (value) => {
    if (value !== localPageSize.value) localPageSize.value = value;
  }
);

</script>
