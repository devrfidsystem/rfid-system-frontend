<template>
    <div>
        <p
            v-if="loadError"
            class="mx-4 mb-4 rounded-md border border-danger-500/20 bg-danger-50 px-4 py-3 text-sm text-danger-600"
        >
            {{ loadError }}
        </p>
        <div v-else-if="loading" class="px-4 pb-5">
            <LoadingState />
        </div>
        <p
            v-else-if="unsupportedFeature"
            class="mx-4 mb-4 rounded-md border border-warning-500/20 bg-warning-50 px-4 py-3 text-sm text-warning-600"
        >
            {{ unsupportedFeatureMessage }}
        </p>
        <div
            v-else-if="!rows.length && !loadError && !unsupportedFeature"
            class="px-4 pb-5"
        >
            <EmptyState
                title="Belum ada data"
                description="Data belum tersedia untuk ditampilkan"
                variant="default"
            />
        </div>
        <div v-else>
            <div class="overflow-x-auto">
                <table
                    class="min-w-full divide-y divide-border text-sm text-text-secondary"
                    object-id="tbl_MasterTable"
                >
                    <thead
                        class="border-t border-border bg-surface-secondary text-xs font-medium uppercase tracking-wide text-text-secondary"
                    >
                        <tr>
                            <th
                                v-for="column in columnDefs"
                                :key="column.key"
                                class="px-4 py-3 text-left"
                            >
                                {{ column.label }}
                            </th>
                            <th class="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-border bg-surface">
                        <tr
                            v-for="row in rows"
                            :key="rowKey(row)"
                            class="transition-colors duration-150 hover:bg-surface-secondary/60"
                        >
                            <td
                                v-for="column in columnDefs"
                                :key="`${rowKey(row)}-${column.key}`"
                                class="px-4 py-3"
                                :style="getTreeRowIndentStyle(row)"
                            >
                                <template v-if="column.key === 'isActive'">
                                    <Badge
                                        :tone="
                                            column.accessor(row)
                                                ? 'success'
                                                : 'error'
                                        "
                                    >
                                        {{
                                            column.accessor(row)
                                                ? "Active"
                                                : "Inactive"
                                        }}
                                    </Badge>
                                </template>
                                <template v-else-if="column.key === 'status'">
                                    <Badge
                                        v-if="column.accessor(row)"
                                        :tone="
                                            getStatusTone(column.accessor(row))
                                        "
                                        class="capitalize"
                                    >
                                        {{ column.accessor(row) }}
                                    </Badge>
                                    <span v-else class="text-text-muted">—</span>
                                </template>
                                <template
                                    v-else-if="
                                        column.key === 'path' &&
                                        row.treeDepth !== undefined
                                    "
                                >
                                    <div
                                        class="flex items-start gap-2"
                                    >
                                        <button
                                            v-if="row.treeHasChildren"
                                            type="button"
                                            class="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-text-muted transition hover:text-text"
                                            :aria-label="
                                                row.treeExpanded
                                                    ? 'Collapse location'
                                                    : 'Expand location'
                                            "
                                            :aria-expanded="row.treeExpanded"
                                            @click="
                                                $emit('toggleTreeRow', row)
                                            "
                                        >
                                            <Icon
                                                :icon="
                                                    row.treeExpanded
                                                        ? ChevronDown
                                                        : ChevronRight
                                                "
                                                :size="12"
                                            />
                                        </button>
                                        <div class="flex flex-col leading-tight">
                                            <span class="font-medium text-text">
                                                {{
                                                    formatCellValue(
                                                        column.accessor(row),
                                                    )
                                                }}
                                            </span>
                                            <span
                                                v-if="row.treeSubtitle"
                                                class="mt-0.5 text-[11px] text-text-secondary"
                                            >
                                                {{ row.treeSubtitle }}
                                            </span>
                                        </div>
                                    </div>
                                </template>
                                <template v-else>
                                    {{ formatCellValue(column.accessor(row)) }}
                                </template>
                            </td>
                            <td
                                class="px-4 py-3 text-right text-sm text-text-secondary"
                                :style="getTreeRowIndentStyle(row)"
                            >
                                <div class="flex flex-wrap justify-end gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        class="shrink-0"
                                        object-id="btn_MasterTableEdit"
                                        @click="$emit('edit', row)"
                                    >
                                        <Icon :icon="Pencil" :size="12" />
                                        Edit
                                    </Button>
                                    <Button
                                        v-if="showDeleteButton"
                                        size="sm"
                                        variant="danger"
                                        class="shrink-0"
                                        object-id="btn_MasterTableDelete"
                                        @click="$emit('delete', row)"
                                    >
                                        <Icon :icon="Trash2" :size="12" />
                                        Delete
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="showPagination" class="border-t border-border px-4 py-4">
                <Pagination
                    v-model:page="localPage"
                    v-model:page-size="localLimit"
                    :total="total"
                    :page-size-options="pageSizeOptions"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Badge from "@/components/atoms/Badge.vue";
import Button from "@/components/atoms/Button.vue";
import EmptyState from "@/components/molecules/EmptyState.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import Pagination from "@/components/ui/table/Pagination.vue";
import Icon from "@/components/atoms/Icon.vue";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-vue-next";
import type { MasterRecord } from "../types";
import { formatDate } from "@/utils/date";

export interface TableColumnDef {
    key: string;
    label: string;
    accessor: (
        row: MasterRecord,
    ) => string | number | boolean | null | undefined;
}

const props = defineProps<{
    rows: MasterRecord[];
    columnDefs: TableColumnDef[];
    loading: boolean;
    loadError: string | null;
    unsupportedFeature: boolean;
    unsupportedFeatureMessage: string;
    showDeleteButton: boolean;
    page: number;
    limit: number;
    total: number;
    showPagination: boolean;
}>();

const emit = defineEmits<{
    (e: "edit", row: MasterRecord): void;
    (e: "delete", row: MasterRecord): void;
    (e: "toggleTreeRow", row: MasterRecord): void;
    (e: "update:page", value: number): void;
    (e: "update:limit", value: number): void;
}>();

const localPage = computed({
    get: () => props.page,
    set: (value) => emit("update:page", value),
});

const localLimit = computed({
    get: () => props.limit,
    set: (value) => emit("update:limit", value),
});

const pageSizeOptions = [10, 20, 50];

const rowKey = (row: MasterRecord) => String(row.id ?? row.code ?? "");

const getTreeRowIndentStyle = (row: MasterRecord) => {
    if (!row.treeDepth || row.treeDepth <= 0) return undefined;

    const indent = 0.9 * row.treeDepth;
    return {
        paddingInlineStart: `calc(1rem + ${indent}rem)`,
    };
};

const getStatusTone = (status: unknown) => {
    const s = String(status).toLowerCase();
    if (
        s === "active" ||
        s === "published" ||
        s === "approved" ||
        s === "completed"
    )
        return "success";
    if (s === "draft" || s === "pending" || s === "processing")
        return "warning";
    if (
        s === "inactive" ||
        s === "archived" ||
        s === "rejected" ||
        s === "failed"
    )
        return "error";
    return "neutral";
};

const formatCellValue = (value: unknown) => {
    if (value === null || value === undefined) return "-";
    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ) {
        return formatDate(value);
    }
    return value;
};
</script>
