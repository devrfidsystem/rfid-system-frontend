<template>
    <Card object-id="wdg_ProcessTrendChart">
        <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-gray-900">
                Performance Trend
            </h3>
            <div class="flex gap-4 text-xs">
                <span class="flex items-center gap-1 text-text-secondary">
                    <span class="h-2 w-2 rounded-full bg-primary-600"></span>
                    Cycle Time
                </span>
                <span class="flex items-center gap-1 text-text-secondary">
                    <span class="h-2 w-2 rounded-full bg-success-600"></span>
                    Productivity
                </span>
            </div>
        </div>

        <div
            v-if="loading"
            class="h-32 rounded-md bg-surface-secondary animate-pulse"
        ></div>

        <div
            v-else-if="!data || data.length === 0"
            class="text-sm text-text-secondary text-center py-6"
        >
            No trend data available.
        </div>

        <div v-else>
            <svg
                class="h-32 w-full"
                viewBox="0 0 100 40"
                preserveAspectRatio="none"
            >
                <polyline
                    :points="cycleTimePoints"
                    fill="none"
                    class="stroke-primary-600"
                    stroke-width="2"
                />
                <polyline
                    :points="productivityPoints"
                    fill="none"
                    class="stroke-success-600"
                    stroke-width="2"
                />
            </svg>
            <div class="flex justify-between text-[10px] text-text-muted mt-1">
                <span>{{ data[0]?.period }}</span>
                <span>{{ data[data.length - 1]?.period }}</span>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Card from "@/components/molecules/Card.vue";
import type { ProcessTrendPoint } from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: ProcessTrendPoint[] | null;
}>();

const toPolyline = (values: number[]): string => {
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
};

const cycleTimePoints = computed(() =>
    toPolyline((props.data ?? []).map((point) => point.cycleTimeMinutes)),
);

const productivityPoints = computed(() =>
    toPolyline(
        (props.data ?? []).map((point) => point.productivityUnitsPerHour),
    ),
);
</script>
