<template>
    <section class="space-y-6">
        <DashboardToolbar
            :warehouse-id="selectedWarehouseId"
            :warehouse-options="warehouseOptions"
            :loading="dashboardLoading"
            @update:warehouse-id="setSelectedWarehouse"
            @refresh="refreshDashboard"
        />

        <p
            v-if="warehouseError && !warehousesLoading"
            class="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-signal-red"
        >
            {{ warehouseError }}
        </p>

        <div class="space-y-6">
            <DashboardAlertCenter
                :loading="alertsLoading"
                :data="alertsData"
                :error="alertsError"
            />

            <DashboardWorkflowOverview
                :loading="workflowLoading"
                :data="workflowData"
                :error="workflowError"
            />

            <DashboardKpiSnapshot
                :loading="kpiSnapshotLoading"
                :data="kpiSnapshotData"
                :error="kpiSnapshotError"
            />
        </div>
    </section>
</template>

<script setup lang="ts">
import DashboardToolbar from "./components/DashboardToolbar.vue";
import DashboardAlertCenter from "./components/DashboardAlertCenter.vue";
import DashboardWorkflowOverview from "./components/DashboardWorkflowOverview.vue";
import DashboardKpiSnapshot from "./components/DashboardKpiSnapshot.vue";
import { useDashboard } from "./composables/useDashboard";

const {
    warehouseOptions,
    warehousesLoading,
    warehouseError,
    dashboardLoading,
    refreshDashboard,
    selectedWarehouseId,
    setSelectedWarehouse,
    alertsData,
    alertsLoading,
    alertsError,
    workflowData,
    workflowLoading,
    workflowError,
    kpiSnapshotData,
    kpiSnapshotLoading,
    kpiSnapshotError,
} = useDashboard();
</script>
