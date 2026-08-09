<template>
    <Card object-id="wdg_ProcessHourlyHeatmap">
        <PanelHeader title="Hourly Workload Distribution" class="mb-3" />
        <div v-if="loading" class="grid grid-cols-12 gap-1">
            <SkeletonBlock v-for="n in 24" :key="n" height="h-8" />
        </div>
        <div
            v-else-if="!data || data.every((bucket) => bucket.count === 0)"
            class="text-sm text-text-secondary text-center py-6"
        >
            No hourly workload in this window.
        </div>
        <div v-else class="grid grid-cols-12 gap-1">
            <div
                v-for="bucket in data"
                :key="bucket.hour"
                class="h-8 rounded flex items-center justify-center text-[9px] font-semibold"
                :class="intensityClass(bucket.count)"
                :title="`${formatHour(bucket.hour)} — ${bucket.count} transactions`"
            >
                {{ formatHour(bucket.hour) }}
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import PanelHeader from "@/components/molecules/PanelHeader.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import type { ProcessHourlyBucket } from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: ProcessHourlyBucket[] | null;
}>();

const formatHour = (hour: number): string =>
    `${String(hour).padStart(2, "0")}:00`;

const intensityClass = (count: number): string => {
    const maxCount = Math.max(1, ...(props.data ?? []).map((b) => b.count));
    if (count === 0) return "bg-surface-secondary text-text-muted";
    const ratio = count / maxCount;
    if (ratio >= 0.75) return "bg-primary-700 text-white";
    if (ratio >= 0.5) return "bg-primary-500 text-white";
    if (ratio >= 0.25) return "bg-primary-300 text-text";
    return "bg-primary-100 text-text";
};
</script>
