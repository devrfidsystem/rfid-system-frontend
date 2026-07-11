<template>
    <Card
        class="overflow-hidden border-border p-0 shadow-xs ring-0"
        v-bind="bindObjectId(objectId)"
    >
        <DataTableToolbar
            v-model:search="table.search"
            v-bind="toolbarBind"
            :object-id="objectId"
            class="border-b border-border"
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
                    class="border-b border-border bg-surface-secondary text-left text-xs font-semibold uppercase tracking-wide text-text-secondary"
                >
                    <tr>
                        <th v-if="selectable" class="px-4 py-3 w-10">
                            <label
                                :for="
                                    objectId
                                        ? `${objectId}SelectAll`
                                        : 'datatable-select-all'
                                "
                                class="sr-only"
                            >
                                Select all rows
                            </label>
                            <input
                                :id="
                                    objectId
                                        ? `${objectId}SelectAll`
                                        : 'datatable-select-all'
                                "
                                type="checkbox"
                                class="h-4 w-4 rounded border border-border text-primary-600 focus:ring-primary-500"
                                :checked="allSelected"
                                v-bind="
                                    bindObjectId(
                                        objectId
                                            ? `${objectId}SelectAll`
                                            : undefined,
                                    )
                                "
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
                                    ? 'cursor-pointer select-none hover:text-text'
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
                                        v-bind="
                                            bindObjectId(
                                                objectId
                                                    ? `icn_${objectId}Sort_${column.key}`
                                                    : undefined,
                                            )
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
                <tbody class="divide-y divide-border bg-surface">
                    <tr v-if="loading">
                        <td :colspan="columnSpan" class="px-4 py-8">
                            <div class="space-y-3">
                                <div
                                    v-for="n in 4"
                                    :key="n"
                                    class="mx-auto h-4 w-full max-w-md animate-pulse rounded bg-surface-secondary"
                                ></div>
                            </div>
                        </td>
                    </tr>
                    <template v-if="!loading">
                        <tr
                            v-for="(row, index) in paginatedRows"
                            :key="getRowKey(row, index)"
                            class="transition-colors duration-150 hover:bg-surface-secondary/60"
                        >
                            <td v-if="selectable" class="px-4 py-3 w-10">
                                <label
                                    :for="`datatable-select-${rowKey(row)}`"
                                    class="sr-only"
                                >
                                    Select row {{ rowKey(row) }}
                                </label>
                                <input
                                    :id="`datatable-select-${rowKey(row)}`"
                                    type="checkbox"
                                    :checked="table.isSelected(rowKey(row))"
                                    class="h-4 w-4 rounded border border-border text-primary-600 focus:ring-primary-500"
                                    v-bind="
                                        bindObjectId(
                                            objectId
                                                ? `${objectId}Select_${rowKey(row)}`
                                                : undefined,
                                        )
                                    "
                                    @change="table.toggleSelection(rowKey(row))"
                                />
                            </td>
                            <td
                                v-for="column in columns"
                                :key="column.key"
                                class="px-4 py-3 align-top text-sm text-text"
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

        <div class="rounded-b-md border-t border-border bg-surface">
            <DataTablePagination
                v-bind="paginationBind"
                :object-id="objectId ? `pgn_${objectId}` : undefined"
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
import { bindObjectId } from "@/utils/objectId";

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
    objectId?: string;
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
