<template>
    <section class="space-y-6">
        <div class="flex items-start justify-between gap-4">
            <div>
                <h1 class="text-xl font-bold text-gray-900">
                    Process Performance
                </h1>
                <p class="text-sm text-text-secondary mt-0.5">
                    Cycle time and throughput analytics across warehouse
                    processes
                </p>
            </div>
            <div class="flex gap-1 rounded-md border border-border p-0.5">
                <button
                    type="button"
                    class="px-3 py-1 rounded text-sm font-semibold transition-colors"
                    :class="
                        period === 'week'
                            ? 'bg-primary-600 text-white'
                            : 'text-text-secondary hover:text-text'
                    "
                    @click="setPeriod('week')"
                >
                    Week
                </button>
                <button
                    type="button"
                    class="px-3 py-1 rounded text-sm font-semibold transition-colors"
                    :class="
                        period === 'month'
                            ? 'bg-primary-600 text-white'
                            : 'text-text-secondary hover:text-text'
                    "
                    @click="setPeriod('month')"
                >
                    Month
                </button>
            </div>
        </div>

        <p
            v-if="error"
            class="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-danger-600"
        >
            {{ error }}
        </p>

        <ProcessActivityPicker
            :model-value="activity"
            @update:model-value="setActivity"
        />
        <ProcessMetricCards :loading="loading" :data="data" />
        <KpiSupportingMetrics
            :loading="loading"
            :data="supportingMetricsList"
        />
        <ProcessTrendChart :loading="loading" :data="data?.trend ?? null" />
        <div class="grid gap-6 lg:grid-cols-2">
            <ProcessHourlyHeatmap
                :loading="loading"
                :data="data?.hourlyDistribution ?? null"
            />
            <ProcessOperatorRanking
                :loading="loading"
                :data="data?.operatorRanking ?? null"
            />
        </div>
        <KpiWarehouseComparison
            :loading="loading"
            :data="data?.warehouseComparison ?? null"
        />
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import ProcessActivityPicker from "./components/ProcessActivityPicker.vue";
import ProcessMetricCards from "./components/ProcessMetricCards.vue";
import ProcessTrendChart from "./components/ProcessTrendChart.vue";
import ProcessHourlyHeatmap from "./components/ProcessHourlyHeatmap.vue";
import ProcessOperatorRanking from "./components/ProcessOperatorRanking.vue";
import KpiWarehouseComparison from "./components/KpiWarehouseComparison.vue";
import KpiSupportingMetrics from "./components/KpiSupportingMetrics.vue";
import { useProcessPerformance } from "./composables/useProcessPerformance";
import type { DashboardKpiDetailSupportingMetric } from "@/model/dashboard";

const {
    activity,
    period,
    setActivity,
    setPeriod,
    data,
    loading,
    error,
    refresh,
} = useProcessPerformance();

const supportingMetricsList = computed<
    DashboardKpiDetailSupportingMetric[] | null
>(() => {
    const metrics = data.value?.supportingMetrics;
    if (!metrics) return null;
    return [
        {
            label: "Completed Transactions",
            value: `${metrics.completedTransactions}`,
        },
        {
            label: "Avg Daily Volume",
            value: `${metrics.avgDailyVolumeUnits} units/day`,
        },
        {
            label: "Avg Queue Time",
            value: `${metrics.avgQueueTimeMinutes} min`,
        },
    ];
});

onMounted(() => {
    void refresh();
});
</script>
