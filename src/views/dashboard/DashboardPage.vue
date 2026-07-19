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
            v-if="dashboardError && !dashboardLoading"
            class="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-signal-red"
        >
            {{ dashboardError }}
        </p>
        <p
            v-if="warehouseError && !warehousesLoading"
            class="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-signal-red"
        >
            {{ warehouseError }}
        </p>

        <div class="space-y-6">
            <section class="space-y-3">
                <h2 class="text-lg font-semibold text-slate-900">
                    Operations Alert Center
                </h2>
                <DashboardAlertCenter
                    :loading="alertsLoading"
                    :data="alertsData"
                />
            </section>

            <section class="space-y-3">
                <h2 class="text-lg font-semibold text-slate-900">
                    Business Workflow Overview
                </h2>
                <DashboardWorkflowOverview
                    :loading="workflowLoading"
                    :data="workflowData"
                />
            </section>

            <section class="space-y-3">
                <h2 class="text-lg font-semibold text-slate-900">
                    Executive KPI Snapshot
                </h2>
                <DashboardKpiSnapshot
                    :loading="kpiSnapshotLoading"
                    :data="kpiSnapshotData"
                />
            </section>
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
    dashboardError,
    refreshDashboard,
    selectedWarehouseId,
    setSelectedWarehouse,
    alertsData,
    alertsLoading,
    workflowData,
    workflowLoading,
    kpiSnapshotData,
    kpiSnapshotLoading,
} = useDashboard();
</script>
