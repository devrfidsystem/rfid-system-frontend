<template>
    <div class="grid gap-4 lg:grid-cols-3">
        <!-- Heatmap -->
        <Card
            class="lg:col-span-2 flex flex-col"
            object-id="wdg_DashboardOverviewMain"
        >
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-lg font-semibold text-gray-900">
                        Inventory Heatmap
                    </h2>
                    <p class="text-sm text-gray-500 mt-0.5">
                        Density map of products across zones
                    </p>
                </div>
                <p
                    class="text-xs font-medium text-text-secondary bg-workspace-bg px-2.5 py-1 rounded-md"
                >
                    Row / Column
                </p>
            </div>

            <div v-if="loading" class="mt-6 grid gap-3 md:grid-cols-4 flex-1">
                <div
                    v-for="n in 6"
                    :key="`heat-skel-${n}`"
                    class="h-20 rounded-md bg-workspace-bg animate-pulse"
                ></div>
            </div>

            <div
                v-else-if="!heatmapRows.length"
                class="mt-6 flex-1 flex flex-col justify-center items-center rounded-lg border border-gray-100 bg-gray-50/50 p-8 text-center"
            >
                <div
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 mb-3 text-gray-400"
                >
                    <Icon :icon="Box" :size="20" />
                </div>
                <p class="text-sm font-medium text-gray-900">
                    No inventory data
                </p>
                <p class="text-xs text-gray-500 mt-1">
                    Select a warehouse to view its heatmap.
                </p>
            </div>

            <div v-else class="mt-6 flex-1 space-y-3 overflow-x-auto pb-2">
                <div
                    v-for="row in heatmapRows"
                    :key="`heat-row-${row.row}`"
                    class="flex gap-3 min-w-max"
                >
                    <div
                        v-for="cell in row.cells"
                        :key="cell.id"
                        class="w-32 shrink-0"
                    >
                        <div
                            class="rounded-md px-4 py-5 text-center transition-transform hover:-translate-y-1 hover:shadow-sm cursor-pointer"
                            :class="heatTone(cell.quantity)"
                        >
                            <p class="truncate text-xs font-bold opacity-90">
                                {{ cell.label }}
                            </p>
                            <p class="text-sm font-medium mt-1">
                                {{ cell.quantity }}
                                <span class="text-[10px] uppercase opacity-75"
                                    >units</span
                                >
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>

        <!-- Throughput -->
        <Card
            class="flex flex-col"
            object-id="wdg_DashboardOverviewDistribution"
        >
            <div>
                <h2 class="text-lg font-semibold text-gray-900">Throughput</h2>
                <p class="text-sm text-gray-500 mt-0.5">
                    Recent inbound and outbound volume
                </p>
            </div>

            <div class="mt-6 flex-1 flex flex-col justify-center">
                <div v-if="loading" class="space-y-4">
                    <div
                        v-for="n in 4"
                        :key="`chart-skel-${n}`"
                        class="space-y-2"
                    >
                        <div class="flex justify-between">
                            <div class="h-3 w-16 bg-workspace-bg rounded"></div>
                            <div class="h-3 w-8 bg-workspace-bg rounded"></div>
                        </div>
                        <div class="h-2.5 rounded-full bg-workspace-bg"></div>
                    </div>
                </div>

                <div
                    v-else-if="!chartBars.length"
                    class="rounded-lg border border-gray-100 bg-gray-50/50 p-8 flex flex-col items-center text-center"
                >
                    <div
                        class="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 mb-3 text-gray-400"
                    >
                        <Icon :icon="LayoutDashboard" :size="20" />
                    </div>
                    <p class="text-sm font-medium text-gray-900">
                        No throughput data
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                        Data will appear once transactions are made.
                    </p>
                </div>

                <div v-else class="space-y-5">
                    <div
                        v-for="(item, index) in chartBars"
                        :key="item.id || index"
                        class="space-y-2"
                    >
                        <div
                            class="flex items-center justify-between text-xs font-medium text-gray-700"
                        >
                            <span>{{ item.label }}</span>
                            <span>{{ item.value }}</span>
                        </div>
                        <div
                            class="h-1.5 rounded-full bg-gray-100 overflow-hidden"
                        >
                            <div
                                class="h-full rounded-full transition-all duration-1000 bg-primary-600"
                                :style="{ width: `${item.pct}%` }"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>

        <!-- Recent Activity -->
        <Card
            class="lg:col-span-3 flex flex-col"
            object-id="wdg_DashboardOverviewAlerts"
        >
            <div>
                <h2 class="text-lg font-semibold text-gray-900">
                    Recent Activity
                </h2>
                <p class="text-sm text-gray-500 mt-0.5">
                    Latest system events and user actions
                </p>
            </div>
            <div class="mt-6 relative border-l border-gray-200 ml-3 space-y-6">
                <div
                    v-for="activity in activities"
                    :key="activity.id"
                    class="relative pl-6"
                >
                    <div
                        class="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full border-2 border-white"
                        :class="activity.colorClass"
                    ></div>
                    <div>
                        <p class="text-sm text-gray-800">
                            <span class="font-medium text-gray-900">{{
                                activity.user
                            }}</span>
                            {{ activity.action }}
                            <span class="font-medium text-gray-900">{{
                                activity.target
                            }}</span>
                        </p>
                        <p class="text-xs text-gray-500 mt-1">
                            {{ activity.time }}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    </div>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Icon from "@/components/atoms/Icon.vue";
import { Box, LayoutDashboard } from "lucide-vue-next";

const props = defineProps<{
    loading: boolean;
    heatmapRows: Array<{
        row: string | number;
        cells: Array<{ id: string; label: string; quantity: number }>;
    }>;
    heatmapMax: number;
    chartBars: Array<{
        id?: string;
        label: string;
        value: string | number;
        pct: number;
    }>;
}>();

const heatTone = (value: number) => {
    const ratio = props.heatmapMax ? value / props.heatmapMax : 0;
    if (ratio > 0.8) return "bg-primary-600 text-white";
    if (ratio > 0.6) return "bg-primary-500 text-white";
    if (ratio > 0.4) return "bg-primary-400 text-white";
    if (ratio > 0.2) return "bg-primary-teal text-white opacity-90";
    if (ratio > 0)
        return "bg-teal-50 text-primary-teal ring-1 ring-teal-100 inset-0";
    return "bg-workspace-bg text-text-secondary";
};

const activities = [
    {
        id: 1,
        user: "Aditya Aria",
        action: "created a new outbound order",
        target: "OUT-20260602",
        time: "Just now",
        colorClass: "bg-blue-500",
    },
    {
        id: 2,
        user: "System",
        action: "registered new RFID tag",
        target: "EPC-1093847192",
        time: "25 mins ago",
        colorClass: "bg-teal-500",
    },
    {
        id: 3,
        user: "Aditya Aria",
        action: "updated master product",
        target: 'Laptop Pro 15"',
        time: "2 hours ago",
        colorClass: "bg-amber-500",
    },
    {
        id: 4,
        user: "Warehouse Staff",
        action: "completed cycle count for zone",
        target: "Aisle A",
        time: "Yesterday",
        colorClass: "bg-gray-400",
    },
];
</script>
