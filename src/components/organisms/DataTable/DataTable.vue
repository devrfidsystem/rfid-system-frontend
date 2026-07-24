<template>
    <component
        :is="bare ? 'div' : Card"
        class="overflow-hidden"
        :class="bare ? '' : 'border-border p-0 shadow-xs ring-0'"
        v-bind="bindObjectId(objectId)"
    >
        <DataTableToolbar
            v-if="hasToolbarContent"
            v-model:search="table.search"
            v-bind="toolbarBind"
            :object-id="objectId"
            class="border-b border-border"
            @update:page-size="handleToolbarPageSize"
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

        <p
            v-if="loadError"
            class="mx-4 my-4 rounded-md border border-danger-500/20 bg-danger-50 px-4 py-3 text-sm text-danger-600"
        >
            {{ loadError }}
        </p>
        <p
            v-else-if="unsupportedFeature"
            class="mx-4 my-4 rounded-md border border-warning-500/20 bg-warning-50 px-4 py-3 text-sm text-warning-600"
        >
            {{ unsupportedFeatureMessage }}
        </p>
        <template v-else>
            <div v-if="loading || displayRows.length">
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
                                    class="h-4 w-4 rounded border border-border text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                    column.sortable &&
                                    table.toggleSort(column.key)
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
                            >
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-border bg-surface">
                        <template v-if="loading">
                            <tr
                                v-for="n in loadingRowCount"
                                :key="`skeleton-${n}`"
                            >
                                <td v-if="selectable" class="px-4 py-3 w-10">
                                    <div
                                        class="h-4 w-4 animate-pulse rounded bg-surface-secondary"
                                    ></div>
                                </td>
                                <td
                                    v-for="column in columns"
                                    :key="column.key"
                                    class="px-4 py-3"
                                >
                                    <div
                                        class="h-4 animate-pulse rounded bg-surface-secondary"
                                        :style="{
                                            width: skeletonCellWidth(column),
                                        }"
                                    ></div>
                                </td>
                                <td
                                    v-if="$slots.rowActions"
                                    class="px-4 py-3 text-right"
                                >
                                    <div
                                        class="ml-auto h-4 w-16 animate-pulse rounded bg-surface-secondary"
                                    ></div>
                                </td>
                            </tr>
                        </template>
                        <template v-if="!loading">
                            <tr
                                v-for="(row, index) in displayRows"
                                :key="getRowKey(row, index)"
                                class="transition-colors duration-150 odd:bg-surface even:bg-surface-secondary/40 hover:bg-surface-secondary/60"
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
                                        class="h-4 w-4 rounded border border-border text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        v-bind="
                                            bindObjectId(
                                                objectId
                                                    ? `${objectId}Select_${rowKey(row)}`
                                                    : undefined,
                                            )
                                        "
                                        @change="
                                            table.toggleSelection(rowKey(row))
                                        "
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
                                    :style="getTreeRowIndentStyle(row)"
                                >
                                    <div
                                        v-if="
                                            column.key === treeColumnKey &&
                                            getTreeDepth(row) !== undefined
                                        "
                                        class="flex items-start gap-2"
                                    >
                                        <button
                                            v-if="hasTreeChildren(row)"
                                            type="button"
                                            class="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-text-muted transition-colors duration-150 hover:text-text"
                                            :aria-label="
                                                isTreeExpanded(row)
                                                    ? 'Collapse row'
                                                    : 'Expand row'
                                            "
                                            :aria-expanded="isTreeExpanded(row)"
                                            @click="emit('toggleTreeRow', row)"
                                        >
                                            <Icon
                                                :icon="
                                                    isTreeExpanded(row)
                                                        ? ChevronDown
                                                        : ChevronRight
                                                "
                                                :size="12"
                                            />
                                        </button>
                                        <div
                                            class="flex flex-col leading-tight"
                                        >
                                            <span class="font-medium text-text">
                                                <slot
                                                    :name="column.key"
                                                    :row="row"
                                                >
                                                    {{
                                                        resolveCellValue(
                                                            column,
                                                            row,
                                                        )
                                                    }}
                                                </slot>
                                            </span>
                                            <span
                                                v-if="getTreeSubtitle(row)"
                                                class="mt-0.5 text-[11px] text-text-secondary"
                                            >
                                                {{ getTreeSubtitle(row) }}
                                            </span>
                                        </div>
                                    </div>
                                    <slot v-else :name="column.key" :row="row">
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

            <div
                v-if="loading || displayRows.length"
                class="rounded-b-md border-t border-border bg-surface"
            >
                <DataTablePagination
                    v-if="!isServerPagination"
                    v-bind="paginationBind"
                    :object-id="objectId ? `pgn_${objectId}` : undefined"
                    @update:page="table.setPage"
                />
                <div v-else class="px-4 py-3">
                    <ServerPagination
                        :page="serverPage"
                        :page-size="serverPageSize"
                        :total="props.total ?? 0"
                        :page-size-options="effectivePageSizes"
                        @update:page="emit('update:page', $event)"
                        @update:page-size="emit('update:pageSize', $event)"
                    />
                </div>
            </div>

            <DataTableEmpty
                v-if="!loading && !displayRows.length"
                :title="emptyStateTitle"
                :description="emptyStateDescription"
                :variant="emptyStateVariant"
                :action-label="emptyStateActionLabel"
                :show-action="emptyStateShowAction"
                @action="emit('emptyStateAction')"
            >
                <template v-if="$slots.emptyAction" #action>
                    <slot name="emptyAction" />
                </template>
            </DataTableEmpty>
        </template>
    </component>
</template>

<script setup lang="ts">
import { computed, useSlots } from "vue";
import Card from "@/components/molecules/Card.vue";
import Icon from "@/components/atoms/Icon.vue";
import DataTableToolbar from "./DataTableToolbar.vue";
import DataTablePagination from "./DataTablePagination.vue";
import DataTableEmpty from "./DataTableEmpty.vue";
import ServerPagination from "@/components/ui/table/Pagination.vue";
import { useDataTable } from "./useDataTable";
import type { ColumnDef, SortState } from "./types";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-vue-next";
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
    emptyStateActionLabel?: string;
    emptyStateShowAction?: boolean;
    objectId?: string;
    // Server-side pagination: when `total` is supplied, `rows` is treated as
    // already the current page — internal client-side slicing is skipped.
    page?: number;
    pageSize?: number;
    total?: number;
    loadError?: string;
    unsupportedFeature?: boolean;
    unsupportedFeatureMessage?: string;
    showSearch?: boolean;
    // Which column renders the tree indent/expand-collapse affordance for
    // hierarchical rows (see getTreeDepth/hasTreeChildren below). Unset by
    // default, so plain flat tables are unaffected.
    treeColumnKey?: string;
    // Skip DataTable's own Card wrapper (border/shadow/rounded) when the
    // caller already renders one around it, to avoid a nested double card.
    bare?: boolean;
}>();

const emit = defineEmits<{
    (e: "update:page", value: number): void;
    (e: "update:pageSize", value: number): void;
    (e: "toggleTreeRow", row: Record<string, unknown>): void;
    (e: "emptyStateAction"): void;
}>();

const safeRows = computed(() =>
    Array.isArray(props.rows) ? props.rows.filter(Boolean) : [],
);
const rowsRef = computed(() => safeRows.value);
const slots = useSlots();

const isServerPagination = computed(() => props.total !== undefined);

const effectivePageSizes = props.pageSizeOptions?.length
    ? props.pageSizeOptions
    : [8, 20, 40];
const table = useDataTable(rowsRef, props.columns, props.rowKey, {
    selectable: Boolean(props.selectable),
    initialSort: props.initialSort,
    pageSizeOptions: effectivePageSizes,
});

// Server mode: `filteredRows` still applies (a no-op when search is hidden)
// column sort over the current page's rows without re-slicing them, since
// slicing/paging itself is owned by the parent via `total`.
const displayRows = computed(() =>
    isServerPagination.value
        ? table.filteredRows.value
        : table.paginatedRows.value,
);

const serverPage = computed(() => props.page ?? 1);
const serverPageSize = computed(() => props.pageSize ?? effectivePageSizes[0]);

// Hide the toolbar entirely when it would render nothing — no search box,
// no page-size select, and no filters/actions slot content — instead of an
// empty bordered bar taking up space.
const hasToolbarContent = computed(
    () =>
        props.showSearch !== false ||
        (!isServerPagination.value && effectivePageSizes.length > 0) ||
        Boolean(slots.filters) ||
        Boolean(slots.actions),
);

const handleToolbarPageSize = (value: number) => {
    if (isServerPagination.value) {
        emit("update:pageSize", value);
        return;
    }
    table.setPageSize(value);
};

const loadingRowCount = computed(() => {
    const size = isServerPagination.value
        ? serverPageSize.value
        : table.pageSize.value;
    return Math.min(Math.max(size, 3), 8);
});

const skeletonWidths = ["85%", "60%", "75%", "50%", "70%"];
const skeletonCellWidth = (column: ColumnDef<Record<string, unknown>>) => {
    const index = props.columns.indexOf(column);
    if (column.align === "right" || column.align === "center") return "50%";
    return skeletonWidths[index % skeletonWidths.length];
};

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

// Optional tree-row metadata (used by hierarchical data such as Master
// locations). Rows that don't set these fields render as plain flat rows.
const getTreeDepth = (row: Record<string, unknown>) =>
    row.treeDepth as number | undefined;
const hasTreeChildren = (row: Record<string, unknown>) =>
    Boolean(row.treeHasChildren);
const isTreeExpanded = (row: Record<string, unknown>) =>
    Boolean(row.treeExpanded);
const getTreeSubtitle = (row: Record<string, unknown>) =>
    row.treeSubtitle as string | undefined;

const getTreeRowIndentStyle = (row: Record<string, unknown>) => {
    const depth = getTreeDepth(row);
    if (!depth || depth <= 0) return undefined;
    const indent = 0.9 * depth;
    return { paddingInlineStart: `calc(1rem + ${indent}rem)` };
};

const visibleRows = computed(() => table.visibleRows.value);
const allSelected = computed(() => table.allSelected.value);

const toolbarBind = computed(() => ({
    pageSize: isServerPagination.value
        ? serverPageSize.value
        : table.pageSize.value,
    // Server-pagination mode already renders its own page-size select
    // inside the bottom Pagination bar — don't show a second one here.
    pageSizeOptions: isServerPagination.value ? undefined : effectivePageSizes,
    rows: safeRows.value,
    visibleRows: visibleRows.value,
    showSearch: props.showSearch,
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
