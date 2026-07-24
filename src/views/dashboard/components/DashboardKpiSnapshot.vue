<template>
    <Card object-id="wdg_DashboardKpiSnapshot">
        <div>
            <h2 class="text-lg font-semibold text-gray-900">
                Executive KPI Snapshot
            </h2>
            <p class="text-sm text-gray-500 mt-0.5">
                Operational improvement vs previous period
            </p>
        </div>

        <div class="mt-6">
            <div v-if="loading" class="grid gap-4 sm:grid-cols-3">
                <div
                    v-for="n in 3"
                    :key="`kpi-skel-${n}`"
                    class="h-40 rounded-md bg-surface-secondary animate-pulse"
                ></div>
            </div>

            <div
                v-else-if="!data || data.cards.length === 0"
                class="rounded-lg border border-gray-100 bg-gray-50/50 p-8 text-center text-sm text-gray-500"
            >
                No KPI data available.
            </div>

            <div v-else class="grid gap-4 sm:grid-cols-3">
                <div
                    v-for="card in data.cards"
                    :key="card.key"
                    class="rounded-md border border-border p-4"
                >
                    <div class="flex items-center justify-between">
                        <span
                            class="text-xs font-semibold uppercase text-text-muted"
                            >{{ card.label }}</span
                        >
                        <span
                            :class="
                                card.trendVsPrevious >= 0
                                    ? 'text-success-600'
                                    : 'text-danger-600'
                            "
                            class="text-xs font-semibold"
                        >
                            {{ card.trendVsPrevious >= 0 ? "+" : ""
                            }}{{ card.trendVsPrevious }}pt
                        </span>
                    </div>
                    <p class="text-3xl font-extrabold text-gray-900 mt-2">
                        {{ card.score
                        }}<span class="text-xs font-semibold text-text-muted">
                            / 100</span
                        >
                    </p>
                    <div class="mt-3 space-y-1.5">
                        <div
                            v-for="metric in card.subMetrics"
                            :key="metric.label"
                            class="flex items-center justify-between text-xs"
                        >
                            <span class="text-text-secondary">{{
                                metric.label
                            }}</span>
                            <span class="font-semibold text-success-600">{{
                                metric.value
                            }}</span>
                        </div>
                    </div>
                    <svg
                        class="mt-3 h-8 w-full"
                        viewBox="0 0 100 30"
                        preserveAspectRatio="none"
                    >
                        <polyline
                            :points="sparklinePoints(card.sparkline)"
                            fill="none"
                            class="stroke-primary-600"
                            stroke-width="2"
                        />
                    </svg>
                    <button
                        type="button"
                        disabled
                        class="mt-4 text-xs font-semibold text-text-muted cursor-not-allowed"
                    >
                        View Performance →
                    </button>
                </div>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import type { DashboardKpiSnapshotResponse } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardKpiSnapshotResponse | null;
}>();

function sparklinePoints(values: number[]): string {
    if (!values || values.length === 0) return "";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = values.length > 1 ? 100 / (values.length - 1) : 0;

    return values
        .map((value, index) => {
            const x = index * step;
            const y = 30 - ((value - min) / range) * 30;
            return `${x},${y}`;
        })
        .join(" ");
}
</script>
