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

        <div v-else-if="!data" class="p-6 text-center text-sm text-text-secondary">
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
                <p class="text-xs font-semibold text-text-secondary mb-2">
                    {{ data.label }} — Performance Timeline
                </p>
                <svg
                    class="h-32 w-full"
                    viewBox="0 0 100 40"
                    preserveAspectRatio="none"
                >
                    <polyline
                        :points="timelinePoints"
                        fill="none"
                        class="stroke-primary-600"
                        stroke-width="2"
                    />
                </svg>
                <div class="flex justify-between text-[10px] text-text-muted mt-1">
                    <span>{{ data.timeline[0]?.period }}</span>
                    <span>{{
                        data.timeline[data.timeline.length - 1]?.period
                    }}</span>
                </div>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Card from "@/components/molecules/Card.vue";
import type { DashboardKpiDetailResponse } from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: DashboardKpiDetailResponse | null;
}>();

const timelinePoints = computed(() => {
    const values = props.data?.timeline.map((point) => point.score) ?? [];
    if (values.length === 0) return "";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = values.length > 1 ? 100 / (values.length - 1) : 0;

    return values
        .map((value, index) => {
            const x = index * step;
            const y = 40 - ((value - min) / range) * 40;
            return `${x},${y}`;
        })
        .join(" ");
});
</script>
