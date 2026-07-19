<template>
    <Card object-id="wdg_KpiWarehouseComparison">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">
            Warehouse Comparison
        </h3>
        <div v-if="loading" class="grid gap-4 sm:grid-cols-2">
            <div
                class="h-24 rounded-md bg-surface-secondary animate-pulse"
            ></div>
            <div
                class="h-24 rounded-md bg-surface-secondary animate-pulse"
            ></div>
        </div>
        <div
            v-else-if="
                !data || (data.top.length === 0 && data.bottom.length === 0)
            "
            class="text-sm text-text-secondary text-center py-6"
        >
            No warehouse activity in this window.
        </div>
        <div v-else class="grid gap-6 sm:grid-cols-2">
            <div>
                <p class="text-xs font-semibold text-text-secondary mb-2">
                    Top Performing
                </p>
                <ul class="space-y-2">
                    <li
                        v-for="(warehouse, index) in data.top"
                        :key="warehouse.warehouseId"
                        class="flex items-center justify-between text-sm"
                    >
                        <span class="flex items-center gap-2">
                            <span
                                class="flex h-5 w-5 items-center justify-center rounded-full bg-success-50 text-success-600 text-xs font-bold"
                                >{{ index + 1 }}</span
                            >
                            {{ warehouse.warehouseName }}
                        </span>
                        <span class="font-semibold">{{ warehouse.score }}</span>
                    </li>
                </ul>
            </div>
            <div>
                <p class="text-xs font-semibold text-text-secondary mb-2">
                    Needs Attention
                </p>
                <ul class="space-y-2">
                    <li
                        v-for="warehouse in data.bottom"
                        :key="warehouse.warehouseId"
                        class="flex items-center justify-between text-sm"
                    >
                        <span class="flex items-center gap-2">
                            <span
                                class="flex h-5 w-5 items-center justify-center rounded-full bg-danger-50 text-danger-600 text-xs font-bold"
                                >!</span
                            >
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
import type { DashboardKpiDetailResponse } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: DashboardKpiDetailResponse["warehouseComparison"] | null;
}>();
</script>
