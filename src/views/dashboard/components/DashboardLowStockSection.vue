<template>
    <Card object-id="wdg_DashboardLowStockSection">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-lg font-semibold text-gray-900">
                    Low Stock Inventory
                </h2>
                <p class="text-sm text-gray-500 mt-0.5">
                    Products with inventory levels below the minimum threshold.
                </p>
            </div>
            <span
                v-if="totalLowStock > 0"
                class="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-200/50"
            >
                {{ totalLowStock }} Products Alerted
            </span>
        </div>

        <div class="mt-6">
            <div v-if="loading" class="space-y-4">
                <div
                    v-for="n in 5"
                    :key="`low-skel-${n}`"
                    class="h-10 bg-workspace-bg animate-pulse rounded-md"
                ></div>
            </div>
            <div
                v-else-if="!lowStockItems.length"
                class="rounded-lg border border-gray-100 bg-gray-50/50 p-8 flex flex-col items-center text-center"
            >
                <div
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 mb-3 text-emerald-500"
                >
                    <Icon :icon="CheckCircle2" :size="20" />
                </div>
                <p class="text-sm font-medium text-gray-900">
                    All inventory levels are optimal
                </p>
                <p class="text-xs text-gray-500 mt-1">
                    No products are currently below the minimum stock threshold.
                </p>
            </div>
            <div
                v-else
                class="overflow-x-auto rounded-md border border-gray-200"
            >
                <table
                    class="min-w-full divide-y divide-gray-200 text-sm text-gray-600"
                >
                    <thead
                        class="bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                        <tr>
                            <th class="px-4 py-3 text-left">SKU Code</th>
                            <th class="px-4 py-3 text-left">Product Name</th>
                            <th class="px-4 py-3 text-left">Warehouse</th>
                            <th class="px-4 py-3 text-left">Location</th>
                            <th class="px-4 py-3 text-right">Min Stock</th>
                            <th class="px-4 py-3 text-right">Current Stock</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr
                            v-for="(item, idx) in lowStockItems"
                            :key="item.itemId"
                            class="transition-colors duration-150 hover:bg-gray-100/70"
                            :class="{ 'bg-gray-50/50': idx % 2 === 1 }"
                        >
                            <td class="px-4 py-3 font-semibold text-gray-900">
                                {{ item.productCode || item.itemCode }}
                            </td>
                            <td class="px-4 py-3">
                                {{ item.productName || item.itemName }}
                            </td>
                            <td class="px-4 py-3">
                                <span
                                    class="bg-workspace-bg px-2 py-1 rounded text-xs font-semibold text-text-secondary"
                                    >{{
                                        item.warehouseCode || item.warehouseName
                                    }}</span
                                >
                            </td>
                            <td class="px-4 py-3">
                                <span
                                    class="bg-workspace-bg px-2 py-1 rounded text-xs font-semibold text-text-secondary"
                                    >{{ item.locationCode || "-" }}</span
                                >
                            </td>
                            <td
                                class="px-4 py-3 text-right text-text-secondary"
                            >
                                {{ item.minStock || item.minimumQty }}
                            </td>
                            <td
                                class="px-4 py-3 text-right font-bold text-rose-600"
                            >
                                {{ item.currentQty || item.currentStock }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import Icon from "@/components/atoms/Icon.vue";
import { CheckCircle2 } from "lucide-vue-next";

import type { DashboardLowStockAlert } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    totalLowStock: number;
    lowStockItems: DashboardLowStockAlert[];
}>();
</script>
