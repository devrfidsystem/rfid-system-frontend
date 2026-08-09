<template>
    <Card object-id="wdg_KpiContributors">
        <h3 class="text-sm font-semibold text-text mb-3">
            Score Drivers
        </h3>
        <div v-if="loading" class="space-y-3">
            <div class="h-4 rounded bg-surface-secondary animate-pulse"></div>
            <div class="h-4 rounded bg-surface-secondary animate-pulse"></div>
        </div>
        <div
            v-else-if="!data || data.length === 0"
            class="text-sm text-text-secondary text-center py-6"
        >
            No score driver data for this domain.
        </div>
        <div v-else class="space-y-3">
            <div
                v-for="contributor in data"
                :key="contributor.label"
                class="flex items-center gap-3"
            >
                <span class="w-20 text-xs font-semibold text-text-secondary">{{
                    contributor.label
                }}</span>
                <div
                    class="flex-1 h-2 rounded-full bg-surface-secondary overflow-hidden"
                >
                    <div
                        class="h-full rounded-full bg-primary-600"
                        :style="{ width: `${contributor.pct}%` }"
                    ></div>
                </div>
                <span class="w-10 text-right text-xs font-mono"
                    >{{ contributor.pct }}%</span
                >
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import type { DashboardKpiContributor } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardKpiContributor[] | null;
}>();
</script>
