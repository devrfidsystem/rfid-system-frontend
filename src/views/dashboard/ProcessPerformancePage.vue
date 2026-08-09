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
            title="Process Performance"
            description="Cycle time and throughput analytics across warehouse processes"
            tagline="Dashboard"
        >
            <template #actions>
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
            </template>
        </PageHeader>

        <InlineAlert
            v-if="errorMessage"
            variant="error"
            title="Process performance unavailable"
            :description="errorMessage"
        />

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
import { computed, onMounted, unref } from "vue";
import PageHeader from "@/components/molecules/PageHeader.vue";
import InlineAlert from "@/components/ui/feedback/InlineAlert.vue";
import DashboardToolbar from "./components/DashboardToolbar.vue";
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
    warehouseOptions,
    selectedWarehouseId,
    setSelectedWarehouse,
} = useProcessPerformance();

const errorMessage = computed(() => {
    const value = unref(error);
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && "value" in value) {
        const nestedValue = (value as { value?: unknown }).value;
        return typeof nestedValue === "string" ? nestedValue : "";
    }
    return "";
});

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
