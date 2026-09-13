<template>
    <DataTable
        object-id="TransactionList"
        bare
        :rows="rows"
        :columns="dataTableColumns"
        :row-key="(row) => String(row.id ?? '')"
        :loading="loading"
        :empty-state-variant="emptyStateVariant"
        :show-search="false"
        :page="page"
        :page-size="limit"
        :total="total"
        :page-size-options="pageSizeOptions"
        @update:page="emit('update:page', $event)"
        @update:page-size="emit('update:limit', $event)"
    >
        <template #status="{ row }">
            <Badge :tone="getStatusTone(String(row.status))">
                {{ formatStatus(String(row.status)) }}
            </Badge>
        </template>
        <template #rowActions="{ row }">
            <Button
                variant="outline"
                size="sm"
                type="button"
                object-id="btn_TransactionTableViewDetails"
                @click="emit('view', String(row.id))"
            >
                <Icon :icon="Eye" :size="12" />
                View Details
            </Button>
        </template>
    </DataTable>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DataTable from "@/components/organisms/DataTable/DataTable.vue";
import type { ColumnDef } from "@/components/organisms/DataTable/types";
import Button from "@/components/atoms/Button.vue";
import Icon from "@/components/atoms/Icon.vue";
import Badge from "@/components/atoms/Badge.vue";
import type { ReportColumnDef } from "@/domain/report/reportConfig";
import { Eye } from "lucide-vue-next";
import {
    formatTransactionStatus,
    getTransactionStatusTone,
} from "../utils/transactionStatus";

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

const getStatusTone = getTransactionStatusTone;
const formatStatus = formatTransactionStatus;

const emit = defineEmits<{
    (e: "update:page", value: number): void;
    (e: "update:limit", value: number): void;
    (e: "view", id: string): void;
}>();

const dataTableColumns = computed<ColumnDef<Record<string, unknown>>[]>(() =>
    props.columns
        .filter((column) => column.key !== "actions")
        .map((column) => ({ key: column.key, header: column.label })),
);
</script>
