<template>
    <section class="space-y-6">
        <PageHeader
            :title="config.title"
            :description="config.description"
            tagline="Reports"
        />
        <Card no-padding object-id="wdg_ReportEntityList">
            <ReportHeader
                v-model:keyword="keyword"
                v-model:start-date="startDate"
                v-model:end-date="endDate"
                v-model:selected-warehouse="selectedWarehouse"
                v-model:selected-partner="selectedPartner"
                :title="config.title"
                :show-warehouse-filter="Boolean(config.warehouseKey)"
                :partner-filter-supported="partnerFilterSupported"
                :warehouse-select-options="warehouseSelectOptions"
                :partner-select-options="partnerSelectOptions"
                :partner-label="config.partnerLabel ?? 'Partner'"
                :has-rows="rows.length > 0"
                :sort-order="sortOrder"
                @refresh="refreshRows"
                @reset-filters="resetFilters"
                @export="exportRows"
                @sort="toggleSort"
            />

            <div class="px-6">
                <p
                    v-if="warehouseError && !warehousesLoading"
                    class="rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 mb-4"
                >
                    {{ warehouseError }}
                </p>
                <p
                    v-if="partnerError"
                    class="rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 mb-4"
                >
                    {{ partnerError }}
                </p>
                <p
                    v-else-if="unsupportedPartnerNotice"
                    class="rounded-md border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600 mb-4"
                >
                    {{ unsupportedPartnerNotice }}
                </p>

                <p
                    v-if="error && !loading"
                    class="rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 mb-4"
                >
                    {{ error }}
                </p>
            </div>

            <ReportTable
                v-model:page="pagination.page"
                v-model:limit="pagination.limit"
                :loading="loading"
                :rows="tableRows"
                :columns="columns"
                :empty-state-variant="emptyStateVariant"
                :total="pagination.total"
                :page-size-options="pageSizeOptions"
                @open-detail="openDetail"
            />
        </Card>

        <Drawer
            :model-value="Boolean(selectedRow)"
            title="Detail"
            description="Rincian baris laporan yang dipilih."
            width="md"
            @update:model-value="(open) => !open && (selectedRow = null)"
        >
            <div v-if="selectedRow" class="space-y-3 text-sm text-gray-600">
                <div
                    v-for="(value, key) in selectedRow"
                    :key="key"
                    class="space-y-1 rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
                >
                    <p class="text-xs uppercase tracking-wider text-gray-400">
                        {{ key }}
                    </p>
                    <p class="break-words font-semibold text-gray-900">
                        {{ formatValue(value) }}
                    </p>
                </div>
            </div>
        </Drawer>
    </section>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Drawer from "@/components/organisms/Drawer.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import ReportHeader from "./components/ReportHeader.vue";
import ReportTable from "./components/ReportTable.vue";
import { useReportEntity } from "./composables/useReportEntity";
import { formatDate } from "@/utils/date";

const {
    config,
    columns,
    rows,
    loading,
    error,
    keyword,
    startDate,
    endDate,
    selectedWarehouse,
    selectedPartner,
    selectedRow,
    partnerError,
    pagination,
    pageSizeOptions,
    warehousesLoading,
    warehouseError,
    warehouseSelectOptions,
    partnerSelectOptions,
    partnerFilterSupported,
    unsupportedPartnerNotice,
    emptyStateVariant,
    sortOrder,
    tableRows,
    toggleSort,
    openDetail,
    exportRows,
    refreshRows,
    resetFilters,
} = useReportEntity();

const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") return "-";
    if (value instanceof Date) return formatDate(value);
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
};
</script>
