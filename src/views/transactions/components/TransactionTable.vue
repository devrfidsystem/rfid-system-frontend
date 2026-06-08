<template>
    <div>
        <div v-if="loading" class="px-6 pb-5">
            <LoadingState :lines="5" />
        </div>

        <div v-else-if="!rows.length" class="px-6 pb-5">
            <EmptyState :variant="emptyStateVariant" />
        </div>

        <div v-else>
            <AppTable
                :columns="columns"
                :rows="rows"
                class="border-none shadow-none rounded-none"
                object-id="tbl_TransactionList"
            >
                <template #status="{ row }">
                    <Badge :tone="getStatusTone(String(row.status))">
                        {{ formatStatus(String(row.status)) }}
                    </Badge>
                </template>
                <template #actions="{ row }">
                    <RowActions
                        :actions="[
                            {
                                key: 'view',
                                label: 'View Details',
                                onClick: () => $emit('view', String(row.id)),
                            },
                        ]"
                    />
                </template>
            </AppTable>
            <div class="border-t border-gray-200 px-6 py-4">
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
import AppTable from "@/components/organisms/Table.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import EmptyState from "@/components/molecules/EmptyState.vue";
import Pagination from "@/components/ui/table/Pagination.vue";
import RowActions from "@/components/ui/table/RowActions.vue";
import Badge from "@/components/atoms/Badge.vue";
import type { ReportColumnDef } from "@/views/report/reportConfig";

const props = defineProps<{
    loading: boolean;
    rows: Record<string, string | number>[];
    columns: (ReportColumnDef | { key: string; label: string })[];
    emptyStateVariant: "default" | "search";
    page: number;
    limit: number;
    total: number;
    pageSizeOptions: number[];
}>();

const getStatusTone = (status?: string) => {
    if (!status) return "neutral";
    const s = status.toLowerCase();
    if (["completed", "closed", "reconciled", "success"].includes(s))
        return "success";
    if (["draft", "pending", "counting", "processing"].includes(s))
        return "warning";
    if (["canceled", "cancelled", "failed", "error"].includes(s))
        return "error";
    return "info";
};

const formatStatus = (status?: string) => {
    if (!status) return "-";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const emit = defineEmits<{
    (e: "update:page", value: number): void;
    (e: "update:limit", value: number): void;
    (e: "view", id: string): void;
}>();

const localPage = computed({
    get: () => props.page,
    set: (value) => emit("update:page", value),
});

const localLimit = computed({
    get: () => props.limit,
    set: (value) => emit("update:limit", value),
});
</script>
