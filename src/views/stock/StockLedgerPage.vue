<template>
    <section class="space-y-6">
        <PageHeader
            title="Stock Ledger"
            description="Activity log of stock events and EPC history."
            tagline="Stock"
        />

        <Card no-padding object-id="wdg_StockLedgerList">
            <div class="px-6 py-5">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 class="text-base font-semibold text-text">
                            Stock Ledger List
                        </h3>
                    </div>
                    <div
                        class="flex flex-wrap items-end justify-end gap-3 flex-1"
                    >
                        <Input
                            v-model="keyword"
                            placeholder="Search by EPC, document, or product"
                            class="w-full max-w-xs"
                            object-id="txt_StockLedgerSearch"
                        >
                            <template #icon>
                                <Icon :icon="Search" :size="16" />
                            </template>
                        </Input>
                        <div class="flex items-center gap-2">
                            <div ref="filterPopoverRef" class="relative">
                                <Button
                                    variant="outline"
                                    class="px-3"
                                    object-id="btn_StockLedgerFilter"
                                    @click="toggleFilter"
                                >
                                    <Icon :icon="Filter" :size="14" />
                                    Filter
                                </Button>
                                <div
                                    v-if="isFilterOpen"
                                    class="absolute right-0 z-10 mt-2 w-[320px] origin-top-right rounded-md bg-surface shadow-lg ring-1 ring-border focus:outline-none p-4 space-y-4"
                                >
                                    <h4
                                        class="font-medium text-sm text-text mb-2"
                                    >
                                        Filters
                                    </h4>
                                    <Select
                                        v-model="selectedWarehouse"
                                        :options="warehouseSelectOptions"
                                        placeholder="All warehouses"
                                        label="Warehouse"
                                        class="w-full"
                                        object-id="cmb_StockLedgerWarehouse"
                                    />
                                    <div class="pt-2 flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            object-id="btn_StockLedgerCloseFilter"
                                            @click="toggleFilter"
                                            >Close</Button
                                        >
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                class="px-2"
                                title="Refresh"
                                object-id="btn_StockLedgerRefresh"
                                @click="refresh"
                            >
                                <Icon :icon="RefreshCw" :size="16" />
                            </Button>
                            <Button
                                variant="outline"
                                class="px-3"
                                :disabled="!displayRows.length"
                                object-id="btn_StockLedgerExport"
                                @click="exportRows"
                            >
                                <Icon :icon="Download" :size="14" />
                                Export XLS
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

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
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import DataTable from "@/components/organisms/DataTable/DataTable.vue";
import type { ColumnDef } from "@/components/organisms/DataTable/types";
import Icon from "@/components/atoms/Icon.vue";
import { RefreshCw, Search, Filter, Download } from "lucide-vue-next";
import { useStockLedger } from "./composables/useStockLedger";

const {
    columns,
    keyword,
    selectedWarehouse,
    warehouseSelectOptions,
    isFilterOpen,
    filterPopoverRef,
    toggleFilter,
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
