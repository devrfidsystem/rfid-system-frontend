<template>
    <section class="space-y-6">
        <PageHeader
            title="Stock Ledger"
            description="Activity log of stock events and EPC history."
            tagline="Stock"
        />

        <Card no-padding object-id="wdg_StockLedgerList">
            <StockTableToolbar
                v-model:keyword="keyword"
                v-model:selected-warehouse="selectedWarehouse"
                heading="Stock Ledger"
                :warehouse-options="warehouseSelectOptions"
                search-placeholder="Search by EPC, document, or product"
                object-id-prefix="StockLedger"
                :export-disabled="!displayRows.length"
                @refresh="refresh"
                @export="exportRows"
            />

            <DataTable
                object-id="StockLedgerList"
                bare
                :rows="displayRows"
                :columns="dataTableColumns"
                :row-key="(row) => String(row.id ?? '')"
                :loading="loading"
                :load-error="error ?? undefined"
                :show-search="false"
                :page="pagination.page"
                :page-size="pagination.limit"
                :total="pagination.total"
                :page-size-options="pageSizeOptions"
                @update:page="pagination.page = $event"
                @update:page-size="pagination.limit = $event"
            />
        </Card>
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Card from "@/components/molecules/Card.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import DataTable from "@/components/organisms/DataTable/DataTable.vue";
import type { ColumnDef } from "@/components/organisms/DataTable/types";
import { useStockLedger } from "./composables/useStockLedger";
import StockTableToolbar from "./components/StockTableToolbar.vue";

const {
    columns,
    keyword,
    selectedWarehouse,
    warehouseSelectOptions,
    loading,
    error,
    displayRows,
    pagination,
    pageSizeOptions,
    refresh,
    exportRows,
} = useStockLedger();

const dataTableColumns = computed<ColumnDef<Record<string, unknown>>[]>(() =>
    columns.map((column) => ({ key: column.key, header: column.label })),
);
</script>
