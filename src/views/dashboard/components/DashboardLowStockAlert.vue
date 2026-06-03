<template>
    <Card class="p-5">
        <div
            class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
        >
            <div>
                <h2
                    class="text-xs font-semibold uppercase tracking-wider text-primary-600"
                >
                    Low Stock Alert
                </h2>
                <p class="text-lg font-semibold text-gray-900 mt-0.5">
                    Items requiring replenishment
                </p>
                <p class="text-sm text-text-secondary mt-1">
                    {{ subtitleMessage }}
                </p>
            </div>
            <div class="flex items-center gap-3">
                <span
                    class="inline-flex items-center gap-1.5 rounded-full bg-orange-50 ring-1 ring-orange-200 px-3 py-1.5 text-xs font-semibold uppercase text-action-orange"
                >
                    <AlertTriangle class="h-4 w-4" />
                    <span>{{ totalLowStock }}</span>
                    <span>items</span>
                </span>
                <RouterLink
                    to="/master-data/products"
                    class="text-xs font-semibold text-primary-600 hover:text-primary-700"
                    >View inventory →</RouterLink
                >
            </div>
        </div>

        <div class="mt-6 space-y-4">
            <div v-if="loading" class="space-y-3">
                <div
                    v-for="n in 3"
                    :key="n"
                    class="h-16 rounded-md bg-workspace-bg p-4 animate-pulse"
                ></div>
            </div>

            <div
                v-else-if="error"
                class="space-y-3 rounded-md border border-red-100 bg-red-50 p-4 text-sm text-signal-red"
            >
                <p>{{ error }}</p>
                <button
                    type="button"
                    class="text-xs font-semibold text-gray-700 underline"
                    @click="emitRetry"
                >
                    Try again
                </button>
            </div>

            <div
                v-else-if="items.length === 0"
                class="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center text-sm text-gray-500"
            >
                No low stock items found for the selected warehouse.
            </div>

            <ul v-else class="space-y-3">
                <li
                    v-for="item in items"
                    :key="item.itemId"
                    class="rounded-md border border-border-default bg-white p-4 shadow-xs transition-shadow hover:shadow-sm"
                >
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <p class="text-sm font-semibold text-gray-900">
                                {{ item.itemName }}
                            </p>
                            <p class="text-xs text-text-secondary mt-0.5">
                                {{ item.itemCode }}
                                <span class="mx-1.5 text-gray-300">•</span>
                                {{ item.warehouseName }}
                            </p>
                        </div>
                        <span
                            :class="severityClass(item.severity)"
                            class="rounded-full ring-1 ring-inset px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider shrink-0"
                        >
                            {{ severityLabel(item.severity) }}
                        </span>
                    </div>
                    <div
                        class="mt-4 flex flex-col gap-1 text-sm text-gray-700 sm:flex-row sm:items-center sm:justify-between bg-workspace-bg rounded-md p-3"
                    >
                        <p>
                            Stock
                            <span class="font-semibold">{{
                                item.currentStock
                            }}</span>
                            <span class="text-text-secondary mx-1">/</span> Min
                            <span class="font-semibold">{{
                                item.minimumQty
                            }}</span>
                        </p>
                        <p
                            class="text-xs font-medium"
                            :class="
                                item.severity === 'critical'
                                    ? 'text-signal-red'
                                    : 'text-action-orange'
                            "
                        >
                            Short by {{ item.shortageQty }}
                        </p>
                    </div>
                </li>
            </ul>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import { AlertTriangle } from "lucide-vue-next";
import type { PropType } from "vue";
import { computed } from "vue";
import { RouterLink } from "vue-router";
import type { DashboardLowStockAlert } from "@/model/dashboard";

const props = defineProps({
    totalLowStock: {
        type: Number,
        default: 0,
    },
    items: {
        type: Array as PropType<DashboardLowStockAlert[]>,
        default: () => [],
    },
    loading: {
        type: Boolean,
        default: false,
    },
    error: {
        type: String as PropType<string | null>,
        default: null,
    },
});

const emit = defineEmits<{
    (e: "retry"): void;
}>();

const severityClass = (severity: DashboardLowStockAlert["severity"]) => {
    if (severity === "critical") {
        return "bg-red-50 text-signal-red ring-red-200";
    }
    return "bg-orange-50 text-action-orange ring-orange-200";
};

const severityLabel = (severity: DashboardLowStockAlert["severity"]) =>
    severity === "critical" ? "Critical" : "Warning";

const subtitleMessage = computed(() => {
    if (props.totalLowStock === 0) {
        return "All monitored items are above the configured threshold.";
    }
    if (props.totalLowStock > props.items.length) {
        return `Showing top ${props.items.length} of ${props.totalLowStock} low stock items.`;
    }
    return "Showing all items below minimum stock.";
});

const emitRetry = () => {
    emit("retry");
};
</script>
