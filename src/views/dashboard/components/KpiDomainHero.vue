<template>
    <Card object-id="wdg_KpiDomainHero">
        <div v-if="loading" class="grid gap-4 sm:grid-cols-2">
            <SkeletonBlock height="h-32" />
            <SkeletonBlock height="h-32" />
        </div>

        <StatusPanel
            v-else-if="!data"
            title="No KPI scorecard data"
            description="No KPI scorecard data for this domain."
            :icon="ChartNoAxesCombined"
            tone="neutral"
            class="border-0 bg-transparent p-6"
        />

        <div v-else class="grid gap-6 sm:grid-cols-2">
            <div>
                <p class="text-xs font-semibold uppercase text-text-muted">
                    {{ data.label }}
                </p>
                <p class="text-2xl font-semibold text-text mt-1">
                    {{ data.score
                    }}<span class="text-base font-semibold text-text-muted">
                        / 100</span
                    >
                </p>
                <p
                    class="text-sm font-semibold mt-1"
                    :class="
                        data.trendVsPrevious >= 0
                            ? 'text-success-600'
                            : 'text-danger-600'
                    "
                >
                    {{ data.trendVsPrevious >= 0 ? "+" : ""
                    }}{{ data.trendVsPrevious.toFixed(1) }}pt vs previous period
                </p>
                <p class="text-xs text-text-secondary mt-2">
                    Source workflow: {{ data.derivedFrom }}
                </p>
                <div class="mt-3 grid grid-cols-2 gap-3">
                    <MetricValueTile
                        label="Current Period"
                        :value="data.score"
                        class="border-0 bg-transparent p-0"
                    />
                    <MetricValueTile
                        label="Previous Period"
                        :value="data.previousScore"
                        class="border-0 bg-transparent p-0"
                    />
                </div>
            </div>
            <div>
                <TrendMiniChart
                    label="Score Timeline"
                    unit="pts"
                    :points="
                        data.timeline.map((point) => ({
                            period: point.period,
                            value: point.score,
                        }))
                    "
                    stroke-class="stroke-primary-600"
                    dot-class="fill-primary-600"
                    :color="CHART_COLORS.primary"
                    :higher-is-better="true"
                />
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import StatusPanel from "@/components/molecules/StatusPanel.vue";
import MetricValueTile from "@/components/molecules/MetricValueTile.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import TrendMiniChart from "./TrendMiniChart.vue";
import { ChartNoAxesCombined } from "lucide-vue-next";
import type { DashboardKpiDetailResponse } from "@/model/dashboard";

const CHART_COLORS = {
    primary: "rgb(var(--primary-600))",
} as const;

defineProps<{
    loading: boolean;
    data: DashboardKpiDetailResponse | null;
}>();
</script>
