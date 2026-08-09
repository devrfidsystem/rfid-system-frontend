<template>
    <Card object-id="wdg_ProcessOperatorRanking">
        <PanelHeader title="Operator Throughput" class="mb-3" />
        <div v-if="loading" class="space-y-2">
            <SkeletonBlock v-for="n in 5" :key="n" height="h-6" />
        </div>
        <StatusPanel
            v-else-if="!data || data.length === 0"
            title="No operator throughput data"
            description="No operator throughput data in this window."
            :icon="Users"
            tone="neutral"
            class="border-0 bg-transparent py-6"
        />
        <ul v-else class="space-y-2">
            <li
                v-for="(operator, index) in data"
                :key="operator.userId"
                class="flex items-center justify-between text-sm"
            >
                <span class="flex items-center gap-2">
                    <RankBadge :label="index + 1" />
                    {{ operator.userName }}
                </span>
                <span class="font-semibold">{{ operator.score }}</span>
            </li>
        </ul>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import PanelHeader from "@/components/molecules/PanelHeader.vue";
import StatusPanel from "@/components/molecules/StatusPanel.vue";
import RankBadge from "@/components/molecules/RankBadge.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import { Users } from "lucide-vue-next";
import type { ProcessOperatorRankEntry } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: ProcessOperatorRankEntry[] | null;
}>();
</script>
