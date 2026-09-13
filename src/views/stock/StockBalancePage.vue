<template>
    <section class="space-y-6">
        <PageHeader
            title="Stock Balance"
            description="Live location balances across warehouses."
            tagline="Stock"
        />

        <Card no-padding object-id="wdg_StockBalanceList">
            <StockTableToolbar
                v-model:keyword="keyword"
                v-model:selected-warehouse="selectedWarehouse"
                heading="Stock Balance"
                :warehouse-options="warehouseSelectOptions"
                search-placeholder="Search product or location"
                object-id-prefix="StockBalance"
                :export-disabled="!displayRows.length"
                @refresh="refresh"
                @export="exportRows"
            />

            <DataTable
                object-id="StockBalanceList"
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
import { useStockBalance } from "./composables/useStockBalance";
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
} = useStockBalance();

const dataTableColumns = computed<ColumnDef<Record<string, unknown>>[]>(() =>
    columns.map((column) => ({ key: column.key, header: column.label })),
);
</script>
