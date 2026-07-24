<template>
    <Card object-id="wdg_MonitoringLiveFeed">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">
            Live Transactions
        </h3>

        <div v-if="loading" class="space-y-2">
            <div
                v-for="n in 6"
                :key="n"
                class="h-8 rounded bg-surface-secondary animate-pulse"
            ></div>
        </div>

        <div
            v-else-if="!data || data.length === 0"
            class="text-sm text-text-secondary text-center py-6"
        >
            No live transactions in the current window.
        </div>

        <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr
                        class="text-left text-[10px] font-semibold uppercase text-text-muted"
                    >
                        <th class="pb-2 pr-3">Status</th>
                        <th class="pb-2 pr-3">Warehouse</th>
                        <th class="pb-2 pr-3">Zone</th>
                        <th class="pb-2 pr-3">Operator</th>
                        <th class="pb-2 pr-3">Event</th>
                        <th class="pb-2 pr-3">Timestamp</th>
                        <th class="pb-2 pr-3">Duration</th>
                        <th class="pb-2 pr-3">Priority</th>
                        <th class="pb-2">SLA</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(row, index) in data"
                        :key="index"
                        class="border-t border-border"
                    >
                        <td class="py-2 pr-3">
                            <span
                                class="rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-semibold text-success-600"
                            >
                                OK
                            </span>
                        </td>
                        <td class="py-2 pr-3">{{ row.warehouseName }}</td>
                        <td class="py-2 pr-3">{{ row.zoneLabel ?? "—" }}</td>
                        <td class="py-2 pr-3">{{ row.operatorName }}</td>
                        <td class="py-2 pr-3">{{ row.eventLabel }}</td>
                        <td class="py-2 pr-3 text-text-secondary">
                            {{ formatTimestamp(row.timestamp) }}
                        </td>
                        <td class="py-2 pr-3">{{ row.durationMinutes }} min</td>
                        <td class="py-2 pr-3">
                            <span
                                class="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase"
                                :class="priorityClass(row.priority)"
                            >
                                {{ row.priority }}
                            </span>
                        </td>
                        <td class="py-2">
                            <template v-if="row.slaPct !== null">
                                <div class="flex items-center gap-1.5">
                                    <div
                                        role="progressbar"
                                        :aria-valuenow="row.slaPct"
                                        class="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100"
                                    >
                                        <div
                                            class="h-full rounded-full bg-primary-600"
                                            :style="{ width: `${row.slaPct}%` }"
                                        ></div>
                                    </div>
                                    <span class="text-xs text-text-muted"
                                        >{{ row.slaPct }}%</span
                                    >
                                </div>
                            </template>
                            <span v-else class="text-xs text-text-muted"
                                >—</span
                            >
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </Card>
</template>

<script setup lang="ts">
import Card from "@/components/molecules/Card.vue";
import type { LiveTransactionRow } from "@/model/dashboard";

defineProps<{
    loading: boolean;
    data: LiveTransactionRow[] | null;
}>();

const formatTimestamp = (iso: string): string => {
    const date = new Date(iso);
    return date.toLocaleString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
    });
};

const priorityClass = (priority: LiveTransactionRow["priority"]): string => {
    switch (priority) {
        case "high":
            return "bg-danger-50 text-danger-600";
        case "med":
            return "bg-warning-50 text-warning-600";
        default:
            return "bg-success-50 text-success-600";
    }
};
</script>
