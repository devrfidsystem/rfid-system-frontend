<template>
    <Card object-id="wdg_KpiSupportingMetrics">
        <PanelHeader title="Supporting Signals" class="mb-1" />
        <div v-if="loading" class="grid gap-3 sm:grid-cols-4">
            <SkeletonBlock v-for="n in 4" :key="n" height="h-16" />
        </div>
        <div
            v-else-if="!data || data.length === 0"
            class="text-sm text-text-secondary text-center py-6"
        >
            No supporting signal data for this domain.
        </div>
        <div v-else class="grid gap-3 sm:grid-cols-4 mt-3">
            <MetricValueTile
                v-for="metric in data"
                :key="metric.label"
                :label="metric.label"
                :value="metric.value"
            />
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import PanelHeader from "@/components/molecules/PanelHeader.vue";
import MetricValueTile from "@/components/molecules/MetricValueTile.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import type { DashboardKpiDetailSupportingMetric } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardKpiDetailSupportingMetric[] | null;
}>();
</script>
