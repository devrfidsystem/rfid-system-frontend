<template>
    <Card object-id="wdg_MonitoringExceptionFeed">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Exception Feed</h3>
        <p class="text-xs text-text-secondary mb-4 -mt-2">
            Transactions requiring manual intervention
        </p>

        <div v-if="loading" class="space-y-2">
            <div
                v-for="n in 3"
                :key="n"
                class="h-16 rounded bg-surface-secondary animate-pulse"
            ></div>
        </div>

        <div
            v-else-if="exceptions.length === 0"
            class="rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-5 flex flex-col items-center text-center"
        >
            <div
                class="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 mb-2 text-emerald-500"
            >
                <Icon :icon="CheckCircle2" :size="20" />
            </div>
            <p class="text-sm font-medium text-gray-900">
                No exceptions currently open
            </p>
        </div>

        <ul v-else class="space-y-3">
            <li
                v-for="(row, index) in exceptions"
                :key="index"
                class="flex gap-3 rounded-md border border-border bg-white p-4 shadow-xs"
            >
                <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-danger-600"
                >
                    <Icon :icon="AlertTriangle" :size="16" />
                </div>
                <div class="flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="text-sm font-semibold text-gray-900">
                            {{ row.eventLabel }} exception
                        </span>
                        <span
                            class="rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-medium text-text-secondary"
                        >
                            {{ row.warehouseName }}
                        </span>
                    </div>
                    <p class="text-xs text-text-secondary mt-1">
                        {{ row.zoneLabel ?? "—" }} · Operator
                        {{ row.operatorName }} · Duration
                        {{ row.durationMinutes }} min
                    </p>
                </div>
                <div class="shrink-0 text-xs text-text-muted font-mono">
                    {{ formatTimestamp(row.timestamp) }}
                </div>
            </li>
        </ul>
    </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Card from "@/components/molecules/Card.vue";
import Icon from "@/components/atoms/Icon.vue";
import { AlertTriangle, CheckCircle2 } from "lucide-vue-next";
import type { LiveTransactionRow } from "@/model/dashboard";

const props = defineProps<{
    loading: boolean;
    data: LiveTransactionRow[] | null;
}>();

const exceptions = computed(() =>
    (props.data ?? []).filter((row) => row.status === "exception"),
);

const formatTimestamp = (iso: string): string => {
    const date = new Date(iso);
    return date.toLocaleString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
    });
};
</script>
