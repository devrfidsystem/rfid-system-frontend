<template>
    <div class="grid gap-4 sm:grid-cols-2" object-id="wdg_ProcessMetricCards">
        <div v-if="loading" class="contents">
            <div
                class="h-28 rounded-md bg-surface-secondary animate-pulse"
            ></div>
            <div
                class="h-28 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </div>

        <template v-else-if="!data">
            <div class="col-span-2 p-6 text-center text-sm text-text-secondary">
                No metric data available.
            </div>
        </template>

        <template v-else>
            <Card>
                <p class="text-xs font-semibold uppercase text-text-muted">
                    Cycle Time
                </p>
                <p class="text-3xl font-extrabold text-gray-900 mt-1">
                    {{ data.cycleTime.minutes
                    }}<span class="text-base font-semibold text-text-muted">
                        min</span
                    >
                </p>
                <p
                    class="text-sm font-semibold mt-1"
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
            </Card>
            <Card>
                <p class="text-xs font-semibold uppercase text-text-muted">
                    Productivity
                </p>
                <p class="text-3xl font-extrabold text-gray-900 mt-1">
                    {{ data.productivity.unitsPerHour
                    }}<span class="text-base font-semibold text-text-muted">
                        u/hr</span
                    >
                </p>
                <p
                    class="text-sm font-semibold mt-1"
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
            </Card>
        </template>
    </div>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import type { ProcessDetailResponse } from "@/api/feature/dto/dashboard.dto";

defineProps<{
    loading: boolean;
    data: ProcessDetailResponse | null;
}>();
</script>
