<template>
    <Card object-id="wdg_ProcessOperatorRanking">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">
            Operator Ranking
        </h3>
        <div v-if="loading" class="space-y-2">
            <div
                v-for="n in 5"
                :key="n"
                class="h-6 rounded bg-surface-secondary animate-pulse"
            ></div>
        </div>
        <div
            v-else-if="!data || data.length === 0"
            class="text-sm text-text-secondary text-center py-6"
        >
            No operator activity in this window.
        </div>
        <ul v-else class="space-y-2">
            <li
                v-for="(operator, index) in data"
                :key="operator.userId"
                class="flex items-center justify-between text-sm"
            >
                <span class="flex items-center gap-2">
                    <span
                        class="flex h-5 w-5 items-center justify-center rounded-full bg-primary-50 text-primary-600 text-xs font-bold"
                        >{{ index + 1 }}</span
                    >
                    {{ operator.userName }}
                </span>
                <span class="font-semibold">{{ operator.score }}</span>
            </li>
        </ul>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import type { ProcessOperatorRankEntry } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: ProcessOperatorRankEntry[] | null;
}>();
</script>
