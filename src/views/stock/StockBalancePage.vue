<template>
    <section class="space-y-6">
        <PageHeader
            title="Stock Balance"
            description="Live location balances across warehouses."
            tagline="Stock"
        />

        <Card no-padding object-id="wdg_StockBalanceList">
            <div class="px-6 py-5">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 class="text-base font-semibold text-gray-900">
                            Stock Balance List
                        </h3>
                    </div>
                    <div
                        class="flex flex-wrap items-end justify-end gap-3 flex-1"
                    >
                        <Input
                            v-model="keyword"
                            placeholder="Search product or location"
                            class="w-full max-w-xs"
                            object-id="txt_StockBalanceSearch"
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
                                    object-id="btn_StockBalanceFilter"
                                    @click="toggleFilter"
                                >
                                    <Icon :icon="Filter" :size="14" />
                                    Filter
                                </Button>
                                <div
                                    v-if="isFilterOpen"
                                    class="absolute right-0 z-10 mt-2 w-[320px] origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-4 space-y-4"
                                >
                                    <h4
                                        class="font-medium text-sm text-gray-900 mb-2"
                                    >
                                        Filters
                                    </h4>
                                    <Select
                                        v-model="selectedWarehouse"
                                        :options="warehouseSelectOptions"
                                        placeholder="All warehouses"
                                        label="Warehouse"
                                        class="w-full"
                                        object-id="cmb_StockBalanceWarehouse"
                                    />
                                    <div class="pt-2 flex justify-end">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            object-id="btn_StockBalanceCloseFilter"
                                            @click="toggleFilter"
                                            >Close</Button
                                        >
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                class="px-3"
                                object-id="btn_StockBalanceSort"
                                @click="toggleSort"
                            >
                                <Icon :icon="sortOrder === 'desc' ? ArrowDown : ArrowUp" :size="14" />
                                {{ sortOrder === 'desc' ? 'Newest' : 'Oldest' }}
                            </Button>
                            <Button
                                variant="outline"
                                class="px-2"
                                title="Refresh"
                                object-id="btn_StockBalanceRefresh"
                                @click="refresh"
                            >
                                <Icon :icon="RefreshCw" :size="16" />
                            </Button>
                        </div>
                    </div>
                </div>

                <p
                    v-if="error && loading === false"
                    class="rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                    {{ error }}
                </p>
            </div>

            <div v-if="loading" class="px-6 pb-5">
                <LoadingState :lines="5" />
            </div>

            <div v-else-if="displayRows.length === 0" class="px-6 pb-5">
                <EmptyState variant="default" />
            </div>

            <div v-else>
                <AppTable
                    :columns="columns"
                    :rows="displayRows"
                    class="border-none shadow-none rounded-none"
                    object-id="tbl_StockBalanceList"
                />
                <div class="border-t border-gray-200 px-6 py-4">
                    <Pagination
                        v-model:page="pagination.page"
                        v-model:page-size="pagination.limit"
                        :total="pagination.total"
                        :page-size-options="pageSizeOptions"
                    />
                </div>
            </div>
        </Card>
    </section>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import Input from "@/components/atoms/Input.vue";
import Select from "@/components/atoms/Select.vue";
import Button from "@/components/atoms/Button.vue";
import AppTable from "@/components/organisms/Table.vue";
import LoadingState from "@/components/ui/states/LoadingState.vue";
import EmptyState from "@/components/molecules/EmptyState.vue";
import Pagination from "@/components/ui/table/Pagination.vue";
import Icon from "@/components/atoms/Icon.vue";
import { RefreshCw, Search, Filter, ArrowUp, ArrowDown } from "lucide-vue-next";
import { useStockBalance } from "./composables/useStockBalance";

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
    sortOrder,
    toggleSort,
    pagination,
    pageSizeOptions,
    refresh,
} = useStockBalance();
</script>
