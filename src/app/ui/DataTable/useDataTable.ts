import { computed, ref, watch, type Ref } from 'vue';
import type { ColumnDef, DataTableOptions, SortState } from './types';

const compareValues = (a: unknown, b: unknown): number => {
  const valueA = typeof a === 'string' ? a.toLowerCase() : a;
  const valueB = typeof b === 'string' ? b.toLowerCase() : b;
  if (valueA === valueB) return 0;
  if (valueA === null || valueA === undefined) return -1;
  if (valueB === null || valueB === undefined) return 1;
  if (valueA > valueB) return 1;
  return -1;
};

export const useDataTable = <T>(
  rows: Ref<T[]>,
  columns: ColumnDef<T>[],
  rowKeyFn: (row: T) => string,
  options: DataTableOptions = {}
) => {
  const search = ref('');
  const sortState = ref<SortState>(options.initialSort ?? { key: '', dir: 'asc' });
  const page = ref(1);
  const pageSize = ref(options.pageSizeOptions?.[0] ?? 10);
  const selectedKeys = ref(new Set<string>());

  const getCellValue = (row: T, key: string) => {
    const column = columns.find((col) => col.key === key);
    if (column?.accessor) return column.accessor(row);
    return (row as Record<string, unknown>)[key];
  };

  const filteredRows = computed(() => {
    const term = search.value.trim().toLowerCase();
    let dataset = rows.value ?? [];
    if (term) {
      dataset = dataset.filter((row) =>
        Object.values(row)
          .filter((value) => typeof value === 'string' || typeof value === 'number')
          .some((value) => String(value).toLowerCase().includes(term))
      );
    }
    if (sortState.value.key) {
      dataset = [...dataset].sort((a, b) => {
        const result = compareValues(
          getCellValue(a, sortState.value.key),
          getCellValue(b, sortState.value.key)
        );
        return sortState.value.dir === 'asc' ? result : -result;
      });
    }
    return dataset;
  });

  const totalRows = computed(() => filteredRows.value.length);
  const totalPages = computed(() => Math.max(1, Math.ceil(totalRows.value / pageSize.value)));
  const paginatedRows = computed(() => {
    const start = (page.value - 1) * pageSize.value;
    return filteredRows.value.slice(start, start + pageSize.value);
  });

  const visibleRows = computed(() => filteredRows.value);
  const selectedRows = computed(() => {
    if (!options.selectable) return [];
    return rows.value.filter((row) => selectedKeys.value.has(rowKeyFn(row)));
  });
  const allSelected = computed(() => {
    if (!options.selectable) return false;
    return filteredRows.value.length > 0 && filteredRows.value.every((row) => selectedKeys.value.has(rowKeyFn(row)));
  });

  const toggleSelection = (key: string) => {
    if (!options.selectable) return;
    if (selectedKeys.value.has(key)) {
      selectedKeys.value.delete(key);
    } else {
      selectedKeys.value.add(key);
    }
    selectedKeys.value = new Set(selectedKeys.value);
  };

  const selectAll = () => {
    if (!options.selectable) return;
    selectedKeys.value = new Set(filteredRows.value.map((row) => rowKeyFn(row)));
  };

  const clearSelection = () => {
    if (!options.selectable) return;
    selectedKeys.value = new Set();
  };

  const isSelected = (key: string) => {
    if (!options.selectable) return false;
    return selectedKeys.value.has(key);
  };

  const setSearch = (value: string) => {
    search.value = value;
  };

  const setPage = (value: number) => {
    page.value = Math.min(Math.max(value, 1), totalPages.value);
  };

  const setPageSize = (value: number) => {
    pageSize.value = value;
  };

  const toggleSort = (key: string) => {
    if (sortState.value.key !== key) {
      sortState.value = { key, dir: 'asc' };
      return;
    }
    sortState.value = { key, dir: sortState.value.dir === 'asc' ? 'desc' : 'asc' };
  };

  watch([search, () => rows.value.length], () => {
    page.value = 1;
  });

  watch(pageSize, () => {
    page.value = 1;
  });

  return {
    search,
    setSearch,
    sortState,
    toggleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalRows,
    totalPages,
    paginatedRows,
    visibleRows,
    filteredRows,
    selectedRows,
    toggleSelection
    ,
    allSelected,
    selectAll,
    clearSelection
    ,
    isSelected
  };
};
