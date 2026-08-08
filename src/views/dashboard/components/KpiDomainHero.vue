<template>
    <Card object-id="wdg_KpiDomainHero">
        <div v-if="loading" class="grid gap-4 sm:grid-cols-2">
            <div
                class="h-32 rounded-md bg-surface-secondary animate-pulse"
            ></div>
            <div
                class="h-32 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </div>

        <div
            v-else-if="!data"
            class="p-6 text-center text-sm text-text-secondary"
        >
            No KPI data available.
        </div>

        <div v-else class="grid gap-6 sm:grid-cols-2">
            <div>
                <p class="text-xs font-semibold uppercase text-text-muted">
                    {{ data.label }}
                </p>
                <p class="text-4xl font-extrabold text-gray-900 mt-1">
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
                    Derived from {{ data.derivedFrom }}
                </p>
                <div class="flex gap-6 mt-3">
                    <div>
                        <p
                            class="text-[10px] font-semibold uppercase text-text-muted"
                        >
                            Current Period
                        </p>
                        <p class="text-sm font-bold">{{ data.score }}</p>
                    </div>
                    <div>
                        <p
                            class="text-[10px] font-semibold uppercase text-text-muted"
                        >
                            Previous Period
                        </p>
                        <p class="text-sm font-bold">
                            {{ data.previousScore }}
                        </p>
                    </div>
                </div>
            </div>
            <div>
                <TrendMiniChart
                    label="Performance Timeline"
                    unit="pts"
                    :points="
                        data.timeline.map((point) => ({
                            period: point.period,
                            value: point.score,
                        }))
                    "
                    stroke-class="stroke-primary-600"
                    dot-class="fill-primary-600"
                    color="#2563EB"
                    :higher-is-better="true"
                />
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import TrendMiniChart from "./TrendMiniChart.vue";
import type { DashboardKpiDetailResponse } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardKpiDetailResponse | null;
}>();
</script>
