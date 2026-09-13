<template>
    <Card object-id="wdg_KpiWarehouseComparison">
        <PanelHeader title="Warehouse Benchmark" class="mb-3" />
        <div v-if="loading" class="grid gap-4 sm:grid-cols-2">
            <SkeletonBlock height="h-24" />
            <SkeletonBlock height="h-24" />
        </div>
        <StatusPanel
            v-else-if="
                !data || (data.top.length === 0 && data.bottom.length === 0)
            "
            title="No warehouse benchmark data"
            description="No warehouse benchmark data in this window."
            :icon="Warehouse"
            tone="neutral"
            class="border-0 bg-transparent py-6"
        />
        <div v-else class="grid gap-6 sm:grid-cols-2">
            <div>
                <p class="text-xs font-semibold text-text-secondary mb-2">
                    Leading Sites
                </p>
                <ul class="space-y-2">
                    <li
                        v-for="(warehouse, index) in data.top"
                        :key="warehouse.warehouseId"
                        class="flex items-center justify-between text-sm"
                    >
                        <span class="flex items-center gap-2">
                            <RankBadge :label="index + 1" tone="success" />
                            {{ warehouse.warehouseName }}
                        </span>
                        <span class="font-semibold">{{ warehouse.score }}</span>
                    </li>
                </ul>
            </div>
            <div>
                <p class="text-xs font-semibold text-text-secondary mb-2">
                    Under Target
                </p>
                <ul class="space-y-2">
                    <li
                        v-for="warehouse in data.bottom"
                        :key="warehouse.warehouseId"
                        class="flex items-center justify-between text-sm"
                    >
                        <span class="flex items-center gap-2">
                            <RankBadge label="!" tone="error" />
                            {{ warehouse.warehouseName }}
                        </span>
                        <span class="font-semibold">{{ warehouse.score }}</span>
                    </li>
                </ul>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import PanelHeader from "@/components/molecules/PanelHeader.vue";
import StatusPanel from "@/components/molecules/StatusPanel.vue";
import RankBadge from "@/components/molecules/RankBadge.vue";
import SkeletonBlock from "@/components/ui/feedback/SkeletonBlock.vue";
import { Warehouse } from "lucide-vue-next";
import type { DashboardKpiDetailResponse } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardKpiDetailResponse["warehouseComparison"] | null;
}>();
</script>
