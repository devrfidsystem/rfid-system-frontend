<template>
    <Card object-id="wdg_KpiContributors">
        <PanelHeader title="Score Drivers" class="mb-3" />
        <div v-if="loading" class="space-y-3">
            <SkeletonBlock height="h-4" />
            <SkeletonBlock height="h-4" />
        </div>
        <StatusPanel
            v-else-if="!data || data.length === 0"
            title="No score driver data"
            description="No score driver data for this domain."
            :icon="ChartNoAxesColumn"
            tone="neutral"
            class="border-0 bg-transparent py-6"
        />
        <div v-else class="space-y-3">
            <div
                v-for="contributor in data"
                :key="contributor.label"
                class="flex items-center gap-3"
            >
                <span class="w-20 text-xs font-semibold text-text-secondary">{{
                    contributor.label
                }}</span>
                <ProgressBar
                    class="flex-1"
                    :value="contributor.pct"
                    tone="primary"
                    track-class="w-full"
                    :show-value="false"
                />
                <span class="w-10 text-right text-xs font-mono"
                    >{{ contributor.pct }}%</span
                >
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import PanelHeader from "@/components/molecules/PanelHeader.vue";
import StatusPanel from "@/components/molecules/StatusPanel.vue";
import ProgressBar from "@/components/molecules/ProgressBar.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import { ChartNoAxesColumn } from "lucide-vue-next";
import type { DashboardKpiContributor } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardKpiContributor[] | null;
}>();
</script>
