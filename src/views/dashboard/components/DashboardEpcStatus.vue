<template>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Active monitored -->
        <Card class="flex flex-col justify-between">
            <div>
                <h2 class="text-sm font-medium text-gray-500">
                    Monitored Tags
                </h2>
                <p class="text-xs text-gray-400 mt-0.5">
                    Total active tags in WMS
                </p>
            </div>
            <div class="mt-6 flex items-baseline gap-2">
                <span class="text-3xl font-bold text-gray-900">{{
                    epcStatusTotal
                }}</span>
                <span
                    class="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100"
                    >active</span
                >
            </div>
        </Card>

        <!-- Breakdowns -->
        <Card
            v-for="status in epcStatusBreakdown"
            :key="status.name"
            class="flex flex-col justify-between"
        >
            <div>
                <h2 class="text-sm font-medium text-gray-500">
                    {{ status.title }}
                </h2>
                <p class="text-xs text-gray-400 mt-0.5">
                    {{ status.name }}
                </p>
            </div>
            <div class="mt-6 space-y-2">
                <div class="flex justify-between items-baseline">
                    <span class="text-3xl font-bold text-gray-900">{{
                        status.count
                    }}</span>
                    <span class="text-sm font-medium text-gray-500"
                        >{{ status.pct }}%</span
                    >
                </div>
                <div
                    class="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"
                >
                    <div
                        class="h-full rounded-full transition-all duration-1000 bg-primary-600"
                        :style="{ width: `${status.pct}%` }"
                    ></div>
                </div>
            </div>
        </Card>
    </div>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";

defineProps<{
    epcStatusTotal: number;
    epcStatusBreakdown: Array<{
        name: string;
        title: string;
        count: number;
        pct: number;
    }>;
}>();
</script>
