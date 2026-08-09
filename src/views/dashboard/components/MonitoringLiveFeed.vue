<template>
    <Card object-id="wdg_MonitoringLiveFeed">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 class="text-sm font-semibold text-gray-900">
                Live Transactions
            </h3>
            <div
                v-if="data && data.length > 0"
                class="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5"
            >
                <Icon :icon="Search" :size="13" class="text-text-muted" />
                <label for="txt_MonitoringLiveFeedSearch" class="sr-only"
                    >Search live transactions</label
                >
                <input
                    id="txt_MonitoringLiveFeedSearch"
                    v-model="searchTerm"
                    type="text"
                    placeholder="Search operator, zone, event…"
                    class="w-48 border-none bg-transparent text-xs text-text outline-none placeholder:text-text-muted"
                    object-id="txt_MonitoringLiveFeedSearch"
                />
            </div>
        </div>

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

        <div
            v-else-if="filteredRows.length === 0"
            class="text-sm text-text-secondary text-center py-6"
        >
            No transactions match "{{ searchTerm }}".
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
                        v-for="(row, index) in filteredRows"
                        :key="index"
                        :class="rowClass(row)"
                    >
                        <td class="py-2 pr-3">
                            <span class="inline-flex items-center gap-1.5">
                                <span
                                    class="h-2 w-2 rounded-full"
                                    :class="statusDotClass(row.status)"
                                ></span>
                                <span
                                    class="text-[11px] font-semibold"
                                    :class="statusTextClass(row.status)"
                                >
                                {{
                                    row.status === "exception"
                                        ? "Exception"
                                        : "OK"
                                }}
                                </span>
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
                                            class="h-full rounded-full"
                                            :class="slaBarClass(row.slaPct)"
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
import { computed, ref } from "vue";
import Card from "@/components/molecules/Card.vue";
import Icon from "@/components/atoms/Icon.vue";
import { Search } from "lucide-vue-next";
import type { LiveTransactionRow } from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: LiveTransactionRow[] | null;
}>();

const searchTerm = ref("");

const filteredRows = computed(() => {
    const rows = props.data ?? [];
    const term = searchTerm.value.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
        [row.operatorName, row.zoneLabel, row.eventLabel, row.warehouseName]
            .filter((value): value is string => Boolean(value))
            .some((value) => value.toLowerCase().includes(term)),
    );
});

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

const rowClass = (row: LiveTransactionRow): string =>
    [
        "border-t border-border",
        row.status === "exception" ? "bg-danger-50/40" : "",
    ]
        .join(" ")
        .trim();

const statusDotClass = (status: LiveTransactionRow["status"]): string =>
    status === "exception" ? "bg-danger-500" : "bg-success-500";

const statusTextClass = (status: LiveTransactionRow["status"]): string =>
    status === "exception" ? "text-danger-600" : "text-success-600";

const slaBarClass = (slaPct: number): string => {
    if (slaPct >= 90) return "bg-danger-600";
    if (slaPct >= 75) return "bg-warning-500";
    return "bg-success-600";
};
</script>
