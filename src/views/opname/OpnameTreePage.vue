<template>
    <section class="space-y-6">
        <PageHeader
            title="Stock Opname Group"
            description="Manage stock opname groups, profiles, and task lines."
            tagline="Transactions"
        />

        <OpnameSummaryWidget
            :loading="summaryLoading"
            :error="summaryError"
            :summary="summary"
        />

        <Card no-padding object-id="wdg_OpnameTree">
            <OpnameTreeToolbar
                :heading="sectionHeading"
                v-model:selected-warehouse-id="selectedWarehouseId"
                v-model:keyword="keyword"
                v-model:start-date="startDate"
                v-model:end-date="endDate"
                v-model:status-filter="statusFilter"
                v-model:location-filter="locationFilter"
                :warehouse-options="warehouseOptions"
                @refresh="refresh"
                @new="openCreateRoot"
            />

            <div v-if="error" class="px-6 pt-4">
                <p
                    class="rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                    {{ error }}
                </p>
            </div>

            <OpnameTreeTable
                :rows="rows"
                :loading="loading"
                :empty-state-variant="emptyStateVariant"
                @toggle-expand="toggleExpand"
                @new-profile="(row) => openCreateChild(row, 'profile')"
                @new-task="(row) => openCreateChild(row, 'task')"
                @view-node="openDetail"
            />
        </Card>
    </section>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import Card from "@/components/molecules/Card.vue";
import { useOpnameTree } from "./composables/useOpnameTree";
import OpnameTreeToolbar from "./components/OpnameTreeToolbar.vue";
import OpnameTreeTable from "./components/OpnameTreeTable.vue";
import OpnameSummaryWidget from "./components/OpnameSummaryWidget.vue";

const {
    loading,
    error,
    summary,
    summaryLoading,
    summaryError,
    keyword,
    startDate,
    endDate,
    statusFilter,
    locationFilter,
    selectedWarehouseId,
    warehouseOptions,
    rows,
    emptyStateVariant,
    sectionHeading,
    refresh,
    openCreateRoot,
    openCreateChild,
    openDetail,
    toggleExpand,
} = useOpnameTree();

onMounted(() => {
    void refresh();
});
</script>
