<template>
    <Card object-id="wdg_KpiSupportingMetrics">
        <h3 class="text-sm font-semibold text-text mb-1">
            Supporting Signals
        </h3>
        <div v-if="loading" class="grid gap-3 sm:grid-cols-4">
            <div
                v-for="n in 4"
                :key="n"
                class="h-16 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </div>
        <div
            v-else-if="!data || data.length === 0"
            class="text-sm text-text-secondary text-center py-6"
        >
            No supporting signal data for this domain.
        </div>
        <div v-else class="grid gap-3 sm:grid-cols-4 mt-3">
            <div
                v-for="metric in data"
                :key="metric.label"
                class="rounded-md border border-border p-3"
            >
                <p class="text-[11px] text-text-secondary">
                    {{ metric.label }}
                </p>
                <p class="text-base font-bold text-text mt-1">
                    {{ metric.value }}
                </p>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import type { DashboardKpiDetailSupportingMetric } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardKpiDetailSupportingMetric[] | null;
}>();
</script>
