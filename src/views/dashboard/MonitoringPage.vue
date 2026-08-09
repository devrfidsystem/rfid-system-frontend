<template>
    <section class="space-y-6">
        <DashboardToolbar
            :warehouse-id="selectedWarehouseId"
            :warehouse-options="warehouseOptions"
            :loading="loading"
            @update:warehouse-id="setSelectedWarehouse"
            @refresh="refresh"
        />

        <div>
            <div class="flex items-center gap-3">
                <h1 class="text-xl font-bold text-gray-900">Monitoring</h1>
                <span
                    class="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-danger-600"
                    object-id="ind_MonitoringLive"
                >
                    <span class="relative flex h-1.5 w-1.5">
                        <span
                            class="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-500 opacity-75"
                        ></span>
                        <span
                            class="relative inline-flex h-1.5 w-1.5 rounded-full bg-danger-600"
                        ></span>
                    </span>
                    Live
                </span>
            </div>
            <p class="text-sm text-text-secondary mt-0.5">
                Real-time event feed and exception monitoring across the network
            </p>
        </div>

        <p
            v-if="error"
            class="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-danger-600"
        >
            {{ error }}
        </p>

        <div class="grid gap-4 lg:grid-cols-3">
            <MonitoringDomainCard
                :loading="loading"
                :data="data?.domains?.stockIn ?? null"
            />
            <MonitoringDomainCard
                :loading="loading"
                :data="data?.domains?.stockOut ?? null"
            />
            <MonitoringDomainCard
                :loading="loading"
                :data="data?.domains?.inventory ?? null"
            />
        </div>

        <div class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <MonitoringLiveFeed
                :loading="loading"
                :data="data?.liveTransactions ?? null"
            />

            <MonitoringExceptionFeed
                :loading="loading"
                :data="data?.liveTransactions ?? null"
            />
        </div>
    </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import DashboardToolbar from "./components/DashboardToolbar.vue";
import MonitoringDomainCard from "./components/MonitoringDomainCard.vue";
import MonitoringLiveFeed from "./components/MonitoringLiveFeed.vue";
import MonitoringExceptionFeed from "./components/MonitoringExceptionFeed.vue";
import { useMonitoring } from "./composables/useMonitoring";

const {
    data,
    loading,
    error,
    start,
    stop,
    refresh,
    warehouseOptions,
    selectedWarehouseId,
    setSelectedWarehouse,
} = useMonitoring();

onMounted(() => {
    start();
});

onUnmounted(() => {
    stop();
});
</script>
