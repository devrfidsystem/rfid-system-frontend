<template>
    <div>
        <p
            v-if="loadError"
            class="mx-6 mb-4 rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
            {{ loadError }}
        </p>
        <div v-else-if="loading" class="px-6 pb-5">
            <LoadingState />
        </div>
        <p
            v-else-if="unsupportedFeature"
            class="mx-6 mb-4 rounded-md border border-yellow-100 bg-yellow-50 px-4 py-3 text-sm text-amber-700"
        >
            {{ unsupportedFeatureMessage }}
        </p>
        <div
            v-else-if="!rows.length && !loadError && !unsupportedFeature"
            class="px-6 pb-5"
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
                    class="min-w-full divide-y divide-gray-200 text-sm text-gray-600"
                    object-id="tbl_MasterTable"
                >
                    <thead
                        class="bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500 border-t border-gray-200"
                    >
                        <tr>
                            <th
                                v-for="column in columnDefs"
                                :key="column.key"
                                class="px-6 py-3 text-left"
                            >
                                {{ column.label }}
                            </th>
                            <th class="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr
                            v-for="row in rows"
                            :key="rowKey(row)"
                            class="transition-colors duration-150 hover:bg-gray-50"
                        >
                            <td
                                v-for="column in columnDefs"
                                :key="`${rowKey(row)}-${column.key}`"
                                class="px-6 py-3"
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
                                    <span v-else class="text-gray-400">—</span>
                                </template>
                                <template v-else>
                                    {{ column.accessor(row) }}
                                </template>
                            </td>
                            <td
                                class="px-6 py-3 text-right text-sm text-gray-500"
                            >
                                <div class="flex flex-wrap justify-end gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
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
            <div
                v-if="showPagination"
                class="border-t border-gray-200 px-6 py-4"
            >
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
import { Pencil, Trash2 } from "lucide-vue-next";
import type { MasterRecord } from "../types";

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
</script>
