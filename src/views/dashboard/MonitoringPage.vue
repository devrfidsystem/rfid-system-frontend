<template>
    <section class="space-y-6">
        <div>
            <h1 class="text-xl font-bold text-gray-900">Monitoring</h1>
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

        <MonitoringLiveFeed
            :loading="loading"
            :data="data?.liveTransactions ?? null"
        />
    </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import MonitoringDomainCard from "./components/MonitoringDomainCard.vue";
import MonitoringLiveFeed from "./components/MonitoringLiveFeed.vue";
import { useMonitoring } from "./composables/useMonitoring";

const { data, loading, error, start, stop } = useMonitoring();

onMounted(() => {
    start();
});

onUnmounted(() => {
    stop();
});
</script>
