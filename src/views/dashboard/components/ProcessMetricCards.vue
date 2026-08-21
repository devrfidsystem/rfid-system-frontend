<template>
    <div class="grid gap-4 sm:grid-cols-2" object-id="wdg_ProcessMetricCards">
        <div v-if="loading" class="contents">
            <SkeletonBlock height="h-28" />
            <SkeletonBlock height="h-28" />
        </div>

        <template v-else-if="!data">
            <div class="col-span-2 p-6 text-center text-sm text-text-secondary">
                No process metric data for the selected activity.
            </div>
        </template>

        <template v-else>
            <MetricSummaryCard
                label="Cycle Time"
                :value="`${data.cycleTime.minutes} min`"
                :icon="Clock"
                tone="info"
            >
                <p
                    class="text-sm font-semibold"
                    :class="
                        data.cycleTime.trendPct <= 0
                            ? 'text-success-600'
                            : 'text-danger-600'
                    "
                >
                    {{ data.cycleTime.trendPct >= 0 ? "+" : ""
                    }}{{ data.cycleTime.trendPct.toFixed(1) }}% vs previous
                    period
                </p>
                <p class="text-xs text-text-secondary mt-2">
                    Previous: {{ data.cycleTime.previousMinutes }} min
                </p>
            </MetricSummaryCard>
            <MetricSummaryCard
                label="Productivity"
                :value="`${data.productivity.unitsPerHour} u/hr`"
                :icon="Gauge"
                tone="primary"
            >
                <p
                    class="text-sm font-semibold"
                    :class="
                        data.productivity.trendPct >= 0
                            ? 'text-success-600'
                            : 'text-danger-600'
                    "
                >
                    {{ data.productivity.trendPct >= 0 ? "+" : ""
                    }}{{ data.productivity.trendPct.toFixed(1) }}% vs previous
                    period
                </p>
                <p class="text-xs text-text-secondary mt-2">
                    Previous: {{ data.productivity.previousUnitsPerHour }} u/hr
                </p>
            </MetricSummaryCard>
        </template>
    </div>
</template>

<script setup lang="ts">
import MetricSummaryCard from "@/components/molecules/MetricSummaryCard.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import type { ProcessDetailResponse } from "@/api/feature/dto/dashboard.dto";
import { Clock, Gauge } from "lucide-vue-next";

defineProps<{
    loading: boolean;
    data: ProcessDetailResponse | null;
}>();
</script>
