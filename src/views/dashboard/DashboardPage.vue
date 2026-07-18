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
            <section
                v-for="dashboardSection in dashboardSections"
                :key="dashboardSection.key"
                class="space-y-3"
            >
                <h2 class="text-lg font-semibold text-slate-900">
                    {{ dashboardSection.heading }}
                </h2>
            </section>
        </div>
    </section>
</template>

<script setup lang="ts">
import DashboardToolbar from "./components/DashboardToolbar.vue";
import { useDashboard } from "./composables/useDashboard";

const {
    dashboardSections,
    warehouseOptions,
    warehousesLoading,
    warehouseError,
    dashboardLoading,
    dashboardError,
    refreshDashboard,
    selectedWarehouseId,
    setSelectedWarehouse,
} = useDashboard();
</script>
