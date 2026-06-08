<template>
    <section class="space-y-6">
        <PageHeader
            :title="pageTitle"
            :description="pageDescription"
            tagline="Transactions"
        />

        <Card no-padding object-id="wdg_TransactionList">
            <TransactionHeader
                v-model:keyword="keyword"
                v-model:start-date="startDate"
                v-model:end-date="endDate"
                v-model:selected-warehouse="selectedWarehouse"
                v-model:selected-partner="selectedPartner"
                :show-warehouse-filter="showWarehouseFilter"
                :partner-filter-supported="partnerFilterSupported"
                :warehouse-select-options="warehouseSelectOptions"
                :partner-select-options="partnerSelectOptions"
                :partner-label="partnerLabel"
                @refresh="refresh"
                @new="handleNew"
            />

            <div class="px-6">
                <p v-if="partnerError" class="text-xs text-rose-600 mb-4">
                    {{ partnerError }}
                </p>
                <p
                    v-if="error && !loading"
                    class="rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 mb-4"
                >
                    {{ error }}
                </p>
            </div>

            <TransactionTable
                v-model:page="pagination.page"
                v-model:limit="pagination.limit"
                :loading="loading"
                :rows="displayRows"
                :columns="columns"
                :empty-state-variant="emptyStateVariant"
                :total="pagination.total"
                :page-size-options="pageSizeOptions"
                @view="handleView"
            />
        </Card>
    </section>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import TransactionHeader from "./components/TransactionHeader.vue";
import TransactionTable from "./components/TransactionTable.vue";
import type { TransactionKey } from "@/services/transactions.service";
import { useTransactionList } from "./composables/useTransactionList";
import { useRouter } from "vue-router";

const props = defineProps<{ transactionKey: TransactionKey }>();
const router = useRouter();

const handleNew = () => {
    router.push(`/transactions/${props.transactionKey}/new`);
};

const handleView = (id: string) => {
    router.push(`/transactions/${props.transactionKey}/${id}`);
};

const {
    pageTitle,
    pageDescription,
    keyword,
    startDate,
    endDate,
    selectedWarehouse,
    selectedPartner,
    showWarehouseFilter,
    partnerFilterSupported,
    warehouseSelectOptions,
    partnerSelectOptions,
    partnerLabel,
    partnerError,
    error,
    loading,
    pagination,
    pageSizeOptions,
    displayRows,
    columns,
    emptyStateVariant,
    refresh,
} = useTransactionList(props);
</script>
