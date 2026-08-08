<template>
    <Card object-id="wdg_ProcessTrendChart">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-900">
                Performance Trend
            </h3>
            <button
                v-if="data && data.length > 0"
                type="button"
                class="text-xs font-medium text-primary-600 hover:text-primary-700"
                @click="showTable = !showTable"
            >
                {{ showTable ? "View chart" : "View as table" }}
            </button>
        </div>

        <div v-if="loading" class="grid gap-4 sm:grid-cols-2">
            <div
                v-for="n in 2"
                :key="`trend-skel-${n}`"
                class="h-36 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </div>

        <div
            v-else-if="!data || data.length === 0"
            class="text-sm text-text-secondary text-center py-6"
        >
            No trend data available.
        </div>

        <table v-else-if="showTable" class="w-full text-left text-xs">
            <caption class="sr-only">
                Cycle time and productivity by period
            </caption>
            <thead>
                <tr class="text-text-muted">
                    <th scope="col" class="py-1.5 pr-3 font-medium">Period</th>
                    <th scope="col" class="py-1.5 pr-3 font-medium">
                        Cycle Time (min)
                    </th>
                    <th scope="col" class="py-1.5 font-medium">
                        Productivity (units/hr)
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="point in data"
                    :key="point.period"
                    class="border-t border-gray-100 text-gray-700"
                >
                    <td class="py-1.5 pr-3">{{ point.period }}</td>
                    <td class="py-1.5 pr-3 tabular-nums">
                        {{ point.cycleTimeMinutes }}
                    </td>
                    <td class="py-1.5 tabular-nums">
                        {{ point.productivityUnitsPerHour }}
                    </td>
                </tr>
            </tbody>
        </table>

        <div
            v-else
            class="grid gap-6 sm:grid-cols-2 sm:divide-x sm:divide-gray-100"
        >
            <TrendMiniChart
                label="Cycle Time"
                unit="min"
                :points="cycleTimeSeries"
                stroke-class="stroke-primary-600"
                dot-class="fill-primary-600"
                color="#2563EB"
                :higher-is-better="false"
            />
            <TrendMiniChart
                label="Productivity"
                unit="units/hr"
                :points="productivitySeries"
                stroke-class="stroke-success-600"
                dot-class="fill-success-600"
                color="#0D9488"
                class="sm:pl-6"
                :higher-is-better="true"
            />
        </div>
    </Card>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Card from "@/components/molecules/Card.vue";
import TrendMiniChart from "./TrendMiniChart.vue";
import type { ProcessTrendPoint } from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: ProcessTrendPoint[] | null;
}>();

const showTable = ref(false);

const cycleTimeSeries = computed(() =>
    (props.data ?? []).map((point) => ({
        period: point.period,
        value: point.cycleTimeMinutes,
    })),
);

const productivitySeries = computed(() =>
    (props.data ?? []).map((point) => ({
        period: point.period,
        value: point.productivityUnitsPerHour,
    })),
);
</script>
