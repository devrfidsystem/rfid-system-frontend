<template>
    <section class="space-y-6">
        <DashboardToolbar
            :warehouse-id="dashboardFilters.filter.warehouseId"
            :warehouse-options="warehouseOptions"
            :loading="dashboardLoading"
            @update:warehouse-id="(val) => dashboardFilters.setWarehouse(val)"
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

        <DashboardSummaryCards
            :loading="dashboardLoading"
            :cards="summaryCards"
        />

        <!-- Main Details Area based on Active Route Section -->
        <template v-if="section === 'overview'">
            <DashboardOverview
                :loading="dashboardLoading"
                :heatmap-rows="heatmapRows"
                :heatmap-max="heatmapMax"
                :chart-bars="chartBars"
            />

            <!-- Alerts Area -->
            <div class="grid gap-4 mt-4">
                <DashboardLowStockAlert
                    :total-low-stock="totalLowStock"
                    :items="lowStockItems"
                    :loading="dashboardLoading"
                    :error="dashboardError"
                    @retry="refreshDashboard"
                />
            </div>
        </template>

        <template v-else-if="section === 'low-stock'">
            <DashboardLowStockSection
                :loading="dashboardLoading"
                :total-low-stock="totalLowStock"
                :low-stock-items="lowStockItems"
            />
        </template>

        <template v-else-if="section === 'recent-activity'">
            <DashboardRecentActivity
                :loading="dashboardLoading"
                :recent-activity="recentActivity"
            />
        </template>

        <template v-else-if="section === 'epc-status'">
            <DashboardEpcStatus
                :epc-status-total="epcStatusTotal"
                :epc-status-breakdown="epcStatusBreakdown"
            />
        </template>
    </section>
</template>

<script setup lang="ts">
import DashboardToolbar from "./components/DashboardToolbar.vue";
import DashboardSummaryCards from "./components/DashboardSummaryCards.vue";
import DashboardOverview from "./components/DashboardOverview.vue";
import DashboardLowStockSection from "./components/DashboardLowStockSection.vue";
import DashboardRecentActivity from "./components/DashboardRecentActivity.vue";
import DashboardEpcStatus from "./components/DashboardEpcStatus.vue";
import DashboardLowStockAlert from "./components/DashboardLowStockAlert.vue";
import { useDashboard } from "./composables/useDashboard";

const {
    dashboardFilters,
    warehouseOptions,
    warehousesLoading,
    warehouseError,
    dashboardLoading,
    dashboardError,
    refreshDashboard,
    heatmapRows,
    heatmapMax,
    chartBars,
    lowStockItems,
    totalLowStock,
    section,
    recentActivity,
    epcStatusTotal,
    epcStatusBreakdown,
    summaryCards,
} = useDashboard();
</script>
