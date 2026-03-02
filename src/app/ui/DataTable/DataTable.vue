<template>
  <Card class="ring-1 ring-gray-100">
    <DataTableToolbar
      v-model:search="table.search"
      v-bind="toolbarBind"
      @update:pageSize="table.setPageSize"
    >
      <slot name="filters" />
      <template #actions="{ rows, visibleRows }">
        <slot name="actions" :rows="rows" :visibleRows="visibleRows" />
      </template>
    </DataTableToolbar>

    <div class="table-panel">
      <table class="min-w-full density-table">
        <thead class="bg-gray-100 text-left text-xs uppercase tracking-[0.3em] text-gray-500">
          <tr>
            <th v-if="selectable" class="px-4 py-3">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border border-gray-300"
                :checked="allSelected"
                @change="onToggleAll"
              />
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-4 py-3 text-left"
              :class="[
                column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left',
                column.sortable ? 'cursor-pointer select-none' : ''
              ]"
              @click="column.sortable && table.toggleSort(column.key)"
            >
              <div class="flex items-center justify-between gap-2">
                <span>{{ column.header }}</span>
                <span v-if="column.sortable">
                  <Icon
                    :icon="getSortIcon(column.key)"
                    :size="14"
                    className="text-gray-400"
                  />
                </span>
              </div>
            </th>
            <th v-if="$slots.rowActions" class="px-4 py-3 text-right"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columnSpan" class="px-4 py-6">
              <div class="space-y-2">
                <div v-for="n in 4" :key="n" class="h-4 rounded bg-gray-200/70"></div>
              </div>
            </td>
          </tr>
          <template v-if="!loading">
        <tr
          v-for="(row, index) in paginatedRows"
          :key="getRowKey(row, index)"
          class="border-t border-gray-100 transition duration-150 hover:bg-gray-50"
        >
              <td v-if="selectable" class="px-4 py-3">
                <input
                  type="checkbox"
                  :checked="table.isSelected(rowKey(row))"
                  class="h-4 w-4 rounded border border-gray-300"
                  @change="table.toggleSelection(rowKey(row))"
                />
              </td>
              <td
                v-for="column in columns"
                :key="column.key"
                class="px-4 py-3 align-top text-sm text-gray-700"
                :class="column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'"
              >
                <slot :name="column.key" :row="row">
                  {{ resolveCellValue(column, row) }}
                </slot>
              </td>
              <td v-if="$slots.rowActions" class="px-4 py-3 text-right text-sm text-gray-500">
                <slot name="rowActions" :row="row" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div class="mt-3">
      <DataTablePagination
        v-bind="paginationBind"
        @update:page="table.setPage"
      />
    </div>

    <DataTableEmpty v-if="!loading && !paginatedRows.length" />
  </Card>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';
import Card from '@/app/ui/Card.vue';
import Icon from '@/app/ui/Icon.vue';
import DataTableToolbar from './DataTableToolbar.vue';
import DataTablePagination from './DataTablePagination.vue';
import DataTableEmpty from './DataTableEmpty.vue';
import { useDataTable } from './useDataTable';
import type { ColumnDef, SortState } from './types';
import { ChevronDown, ChevronUp } from 'lucide-vue-next';

const props = defineProps<{
  rows: Record<string, unknown>[];
  columns: ColumnDef<Record<string, unknown>>[];
  rowKey: (row: Record<string, unknown>) => string;
  loading?: boolean;
  pageSizeOptions?: number[];
  initialSort?: SortState;
  selectable?: boolean;
}>();

const safeRows = computed(() => (Array.isArray(props.rows) ? props.rows.filter(Boolean) : []));
const rowsRef = computed(() => safeRows.value);
const slots = useSlots();

const effectivePageSizes = props.pageSizeOptions?.length ? props.pageSizeOptions : [8, 20, 40];
const table = useDataTable(rowsRef, props.columns, props.rowKey, {
  selectable: Boolean(props.selectable),
  initialSort: props.initialSort,
  pageSizeOptions: effectivePageSizes
});

const columnSpan = computed(
  () => props.columns.length + (props.selectable ? 1 : 0) + (slots.rowActions ? 1 : 0)
);

const getSortIcon = (key: string) => {
  const state = table.sortState.value;
  if (state.key !== key) return ChevronDown;
  return state.dir === 'asc' ? ChevronDown : ChevronUp;
};

const toggleSelectAll = (checked: boolean) => {
  if (checked) {
    table.selectAll();
    return;
  }
  table.clearSelection();
};

const onToggleAll = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  toggleSelectAll(Boolean(target?.checked));
};

const rowKey = (row: Record<string, unknown> | null) => {
  if (!row) return '';
  try {
    return props.rowKey(row);
  } catch {
    return '';
  }
};

const getRowKey = (row: Record<string, unknown>, index: number) => {
  const key = rowKey(row);
  return key || `row-${index}`;
};

const resolveCellValue = (column: ColumnDef<Record<string, unknown>>, row: Record<string, unknown> | null) => {
  if (!row) return '';
  try {
    if (column.cell) return column.cell(row);
    if (column.accessor) return column.accessor(row);
    return row[column.key] ?? '';
  } catch {
    return '';
  }
};

const paginatedRows = computed(() => table.paginatedRows.value);
const visibleRows = computed(() => table.visibleRows.value);
const allSelected = computed(() => table.allSelected.value);

const toolbarBind = computed(() => ({
  pageSize: table.pageSize.value,
  pageSizeOptions: effectivePageSizes,
  rows: safeRows.value,
  visibleRows: visibleRows.value
}));

const paginationBind = computed(() => ({
  page: table.page.value,
  totalPages: table.totalPages.value,
  pageSize: table.pageSize.value,
  totalRows: table.totalRows.value
}));

defineExpose({
  visibleRows: table.visibleRows,
  filteredRows: table.filteredRows
});
</script>
