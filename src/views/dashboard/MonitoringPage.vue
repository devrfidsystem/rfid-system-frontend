<template>
    <section class="space-y-6">
        <DashboardToolbar
            :warehouse-id="selectedWarehouseId"
            :warehouse-options="warehouseOptions"
            :loading="loading"
            @update:warehouse-id="setSelectedWarehouse"
            @refresh="refresh"
        />

        <PageHeader
            title="Monitoring"
            description="Real-time event feed and exception monitoring across the network"
            tagline="Dashboard"
        >
            <template #actions>
                <span
                    class="inline-flex items-center gap-1.5 text-[10px] font-semibold text-danger-600"
                    object-id="ind_MonitoringLive"
                >
                    <span class="h-1.5 w-1.5 rounded-full bg-danger-600"></span>
                    Live
                </span>
            </template>
        </PageHeader>

        <InlineAlert
            v-if="error"
            variant="error"
            title="Monitoring unavailable"
            :description="error"
        />

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
import PageHeader from "@/components/molecules/PageHeader.vue";
import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";
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
