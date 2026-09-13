<template>
    <Card object-id="wdg_ProcessTrendChart">
        <div class="flex items-center justify-between mb-4">
            <PanelHeader title="Process Trend" />
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
            <SkeletonBlock
                v-for="n in 2"
                :key="`trend-skel-${n}`"
                height="h-36"
            />
        </div>

        <div
            v-else-if="!data || data.length === 0"
            class="text-sm text-text-secondary text-center py-6"
        >
            No process trend data for this activity.
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
                    class="border-t border-border text-text"
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
            class="grid gap-6 sm:grid-cols-2 sm:divide-x sm:divide-border"
        >
            <TrendMiniChart
                label="Cycle Time"
                unit="min"
                :points="cycleTimeSeries"
                stroke-class="stroke-primary-600"
                dot-class="fill-primary-600"
                :color="CHART_COLORS.primary"
                :higher-is-better="false"
            />
            <TrendMiniChart
                label="Productivity"
                unit="units/hr"
                :points="productivitySeries"
                stroke-class="stroke-success-600"
                dot-class="fill-success-600"
                :color="CHART_COLORS.success"
                class="sm:pl-6"
                :higher-is-better="true"
            />
        </div>
    </Card>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Card from "@/components/molecules/Card.vue";
import PanelHeader from "@/components/molecules/PanelHeader.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import TrendMiniChart from "./TrendMiniChart.vue";
import type { ProcessTrendPoint } from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: ProcessTrendPoint[] | null;
}>();

const CHART_COLORS = {
    primary: "rgb(var(--primary-600))",
    success: "rgb(var(--primary-teal))",
} as const;

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
