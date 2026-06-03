<template>
    <Card class="p-0 border-gray-200 shadow-sm ring-0 overflow-hidden">
        <DataTableToolbar
            v-model:search="table.search"
            v-bind="toolbarBind"
            class="border-b border-gray-200"
            @update:page-size="table.setPageSize"
        >
            <slot name="filters" />
            <template
                #actions="{ rows: actionRows, visibleRows: actionVisibleRows }"
            >
                <slot
                    name="actions"
                    :rows="actionRows"
                    :visible-rows="actionVisibleRows"
                />
            </template>
        </DataTableToolbar>

        <div class="table-panel border-none rounded-none">
            <table class="min-w-full density-table">
                <thead
                    class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 border-b border-gray-200"
                >
                    <tr>
                        <th v-if="selectable" class="px-4 py-3 w-10">
                            <input
                                type="checkbox"
                                class="h-4 w-4 rounded border border-gray-300 text-primary-600 focus:ring-primary-500"
                                :checked="allSelected"
                                @change="onToggleAll"
                            />
                        </th>
                        <th
                            v-for="column in columns"
                            :key="column.key"
                            class="px-4 py-3 text-left transition-colors"
                            :class="[
                                column.align === 'center'
                                    ? 'text-center'
                                    : column.align === 'right'
                                      ? 'text-right'
                                      : 'text-left',
                                column.sortable
                                    ? 'cursor-pointer select-none hover:text-gray-900'
                                    : '',
                            ]"
                            @click="
                                column.sortable && table.toggleSort(column.key)
                            "
                        >
                            <div
                                class="flex items-center gap-2"
                                :class="
                                    column.align === 'center'
                                        ? 'justify-center'
                                        : column.align === 'right'
                                          ? 'justify-end'
                                          : 'justify-start'
                                "
                            >
                                <span>{{ column.header }}</span>
                                <span
                                    v-if="column.sortable"
                                    class="inline-flex"
                                >
                                    <Icon
                                        :icon="getSortIcon(column.key)"
                                        :size="14"
                                        :class-name="
                                            table.sortState.value.key ===
                                            column.key
                                                ? 'text-primary-600'
                                                : 'text-text-secondary'
                                        "
                                    />
                                </span>
                            </div>
                        </th>
                        <th
                            v-if="$slots.rowActions"
                            class="px-4 py-3 text-right"
                        ></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                    <tr v-if="loading">
                        <td :colspan="columnSpan" class="px-4 py-8">
                            <div class="space-y-3">
                                <div
                                    v-for="n in 4"
                                    :key="n"
                                    class="h-4 rounded bg-gray-100 animate-pulse w-full max-w-md mx-auto"
                                ></div>
                            </div>
                        </td>
                    </tr>
                    <template v-if="!loading">
                        <tr
                            v-for="(row, index) in paginatedRows"
                            :key="getRowKey(row, index)"
                            class="transition-colors duration-150 hover:bg-gray-100/70"
                            :class="{ 'bg-gray-50/50': index % 2 === 1 }"
                        >
                            <td v-if="selectable" class="px-4 py-3 w-10">
                                <input
                                    type="checkbox"
                                    :checked="table.isSelected(rowKey(row))"
                                    class="h-4 w-4 rounded border border-gray-300 text-primary-600 focus:ring-primary-500"
                                    @change="table.toggleSelection(rowKey(row))"
                                />
                            </td>
                            <td
                                v-for="column in columns"
                                :key="column.key"
                                class="px-4 py-3 align-top text-sm text-gray-800"
                                :class="
                                    column.align === 'center'
                                        ? 'text-center'
                                        : column.align === 'right'
                                          ? 'text-right'
                                          : 'text-left'
                                "
                            >
                                <slot :name="column.key" :row="row">
                                    {{ resolveCellValue(column, row) }}
                                </slot>
                            </td>
                            <td
                                v-if="$slots.rowActions"
                                class="px-4 py-3 text-right text-sm text-text-secondary"
                            >
                                <slot name="rowActions" :row="row" />
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <div class="border-t border-gray-200 bg-white rounded-b-md">
            <DataTablePagination
                v-bind="paginationBind"
                @update:page="table.setPage"
            />
        </div>

        <DataTableEmpty
            v-if="!loading && !paginatedRows.length"
            :title="emptyStateTitle"
            :description="emptyStateDescription"
            :variant="emptyStateVariant"
        />
    </Card>
</template>

<script setup lang="ts">
import { computed, useSlots } from "vue";
import Card from "@/components/molecules/Card.vue";
import Icon from "@/components/atoms/Icon.vue";
import DataTableToolbar from "./DataTableToolbar.vue";
import DataTablePagination from "./DataTablePagination.vue";
import DataTableEmpty from "./DataTableEmpty.vue";
import { useDataTable } from "./useDataTable";
import type { ColumnDef, SortState } from "./types";
import { ChevronDown, ChevronUp } from "lucide-vue-next";

type EmptyStateVariant = "default" | "search" | "filter";

const props = defineProps<{
    rows: Record<string, unknown>[];
    columns: ColumnDef<Record<string, unknown>>[];
    rowKey: (row: Record<string, unknown>) => string;
    loading?: boolean;
    pageSizeOptions?: number[];
    initialSort?: SortState;
    selectable?: boolean;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    emptyStateVariant?: EmptyStateVariant;
}>();

const safeRows = computed(() =>
    Array.isArray(props.rows) ? props.rows.filter(Boolean) : [],
);
const rowsRef = computed(() => safeRows.value);
const slots = useSlots();

const effectivePageSizes = props.pageSizeOptions?.length
    ? props.pageSizeOptions
    : [8, 20, 40];
const table = useDataTable(rowsRef, props.columns, props.rowKey, {
    selectable: Boolean(props.selectable),
    initialSort: props.initialSort,
    pageSizeOptions: effectivePageSizes,
});

const columnSpan = computed(
    () =>
        props.columns.length +
        (props.selectable ? 1 : 0) +
        (slots.rowActions ? 1 : 0),
);

const getSortIcon = (key: string) => {
    const state = table.sortState.value;
    if (state.key !== key) return ChevronDown;
    return state.dir === "asc" ? ChevronDown : ChevronUp;
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
    if (!row) return "";
    try {
        return props.rowKey(row);
    } catch {
        return "";
    }
};

const getRowKey = (row: Record<string, unknown>, index: number) => {
    const key = rowKey(row);
    return key || `row-${index}`;
};

const resolveCellValue = (
    column: ColumnDef<Record<string, unknown>>,
    row: Record<string, unknown> | null,
) => {
    if (!row) return "";
    try {
        if (column.cell) return column.cell(row);
        if (column.accessor) return column.accessor(row);
        return row[column.key] ?? "";
    } catch {
        return "";
    }
};

const paginatedRows = computed(() => table.paginatedRows.value);
const visibleRows = computed(() => table.visibleRows.value);
const allSelected = computed(() => table.allSelected.value);

const toolbarBind = computed(() => ({
    pageSize: table.pageSize.value,
    pageSizeOptions: effectivePageSizes,
    rows: safeRows.value,
    visibleRows: visibleRows.value,
}));

const paginationBind = computed(() => ({
    page: table.page.value,
    totalPages: table.totalPages.value,
    pageSize: table.pageSize.value,
    totalRows: table.totalRows.value,
}));

defineExpose({
    visibleRows: table.visibleRows,
    filteredRows: table.filteredRows,
});
</script>
